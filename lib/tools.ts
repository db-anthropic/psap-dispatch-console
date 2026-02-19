import { tool } from "ai";
import { z } from "zod";
import { preciselyPost, preciselyGet, preciselyGraphQL } from "./precisely";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Precisely uses -9999 as a "no data" sentinel — convert to null for clean display. */
function filterSentinel(val: any): any {
  return val === -9999 || val === "-9999" ? null : val;
}

/**
 * Extract lat/lon from the Precisely geocode response location field.
 * Coordinates are in GeoJSON format: [longitude, latitude]
 */
function extractCoordinates(location: any): { latitude: number | null; longitude: number | null } {
  const coords = location?.feature?.geometry?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    return { latitude: coords[1], longitude: coords[0] };
  }
  return { latitude: null, longitude: null };
}

export const tools = {
  verify_address: tool({
    description:
      "Verify and standardize a US street address. Returns the standardized address, confidence score, and PreciselyID (PB_KEY). Does NOT return coordinates — call geocode_address after this to get lat/lon.",
    inputSchema: z.object({
      addressLine1: z.string().describe("Street address line 1 (e.g. '350 Jordan Rd')"),
      addressLine2: z.string().optional().describe("Street address line 2 (suite, apt, etc.)"),
      city: z.string().describe("City name"),
      state: z.string().describe("Two-letter state abbreviation (e.g. 'NY')"),
      postalCode: z.string().optional().describe("ZIP code"),
    }),
    execute: async ({ addressLine1, addressLine2, city, state, postalCode }) => {
      const addressLines = addressLine2
        ? [`${addressLine1}, ${addressLine2}`]
        : [addressLine1];

      const data = await preciselyPost("/v1/verify", {
        preferences: {
          maxResults: 1,
          returnAllInfo: true,
          factoryDescription: { label: "ggs", featureSpecific: {} },
        },
        addresses: [
          {
            addressLines,
            city,
            admin1: state,
            postalCode: postalCode || "",
            country: "USA",
          },
        ],
      });

      if (data.error) {
        return { error: `Address verification failed: ${JSON.stringify(data.details)}` };
      }

      const responses = data.responses as any[];
      const results = responses?.[0]?.results as any[];
      if (!results?.[0]) {
        return { error: "No address verification results returned" };
      }

      const result = results[0];
      const address = result.address || {};
      const cf = result.customFields || {};

      return {
        formattedAddress: address.formattedAddress || "",
        streetAddress: address.formattedStreetAddress || "",
        city: address.city?.longName || address.city?.shortName || "",
        state: address.admin1?.shortName || "",
        postalCode: address.postalCode || "",
        country: address.country?.isoAlpha3Code || "USA",
        preciselyId: cf.PB_KEY || "",
        confidence: cf.CONFIDENCE ? Number(cf.CONFIDENCE) : (result.score ?? null),
      };
    },
  }),

  geocode_address: tool({
    description:
      "Geocode a verified US address to get precise latitude/longitude coordinates. Call this after verify_address to get coordinates needed for routing and emergency lookups.",
    inputSchema: z.object({
      addressLine1: z.string().describe("Street address line 1"),
      city: z.string().describe("City name"),
      state: z.string().describe("Two-letter state abbreviation"),
      postalCode: z.string().optional().describe("ZIP code"),
    }),
    execute: async ({ addressLine1, city, state, postalCode }) => {
      const data = await preciselyPost("/v1/geocode", {
        preferences: {
          maxResults: 1,
          returnAllInfo: true,
          factoryDescription: { label: "ggs", featureSpecific: {} },
        },
        addresses: [
          {
            addressLines: [addressLine1],
            city,
            admin1: state,
            postalCode: postalCode || "",
            country: "USA",
          },
        ],
      });

      if (data.error) {
        return { error: `Geocoding failed: ${JSON.stringify(data.details)}` };
      }

      const responses = data.responses as any[];
      const results = responses?.[0]?.results as any[];
      if (!results?.[0]) {
        return { error: "No geocoding results returned" };
      }

      const result = results[0];
      const address = result.address || {};
      const cf = result.customFields || {};
      const { latitude, longitude } = extractCoordinates(result.location);

      return {
        latitude,
        longitude,
        preciselyId: cf.PB_KEY || "",
        formattedAddress: address.formattedAddress || "",
        matchScore: result.score ?? null,
      };
    },
  }),

  lookup_emergency_contacts: tool({
    description:
      "Look up PSAP and AHJ (EMS, Fire, Police) emergency contacts for a US address. Returns dispatch center info, agency contacts with phone numbers and mailing addresses. Use the relevant AHJ's mailingAddress (geocoded) as the route start point — Fire AHJ for fire calls, EMS AHJ for medical, Police AHJ for police.",
    inputSchema: z.object({
      addressLine1: z.string().describe("Full street address line (e.g. '350 Jordan Rd Troy NY 12180, USA')"),
      city: z.string().describe("City name"),
      state: z.string().describe("State name or abbreviation"),
      postalCode: z.string().optional().describe("ZIP code"),
    }),
    execute: async ({ addressLine1, city, state, postalCode }) => {
      const data = await preciselyPost("/v1/emergency-info/psap-ahj/address", {
        address: {
          addressLines: [`${addressLine1} ${city} ${state} ${postalCode || ""}, USA`],
          admin1: "",
          admin2: "",
          city: "",
          borough: "",
          suburb: "",
          postalCode: "",
          postalCodeExt: "",
          placeName: "",
        },
      });

      if (data.error) {
        return { error: `Emergency contacts lookup failed: ${JSON.stringify(data.details)}` };
      }

      const response = data.response as any;
      if (!response || response.status === "ZERO_RESULTS") {
        return { error: "No emergency contact results found for this address" };
      }

      const psapData = response.psap || {};
      const ahjsData = response.ahjs || [];
      const county = psapData.county || {};
      const siteDetails = psapData.siteDetails || {};
      const siteAddress = siteDetails.address || {};
      const siteGeo = siteDetails.geocode || {};

      const psap = {
        agency: psapData.agency || "Unknown",
        phone: psapData.phone || "Unknown",
        type: psapData.type || "Unknown",
        fccId: psapData.fccId || "",
        county: county.name || "",
        countyFips: county.fips || "",
        siteAddress: siteAddress.formattedAddress || "",
        siteLatitude: siteGeo.latitude ?? null,
        siteLongitude: siteGeo.longitude ?? null,
      };

      const ahjs = ahjsData.map((ahj: any) => ({
        type: ahj.ahjType || ahj.type || "Unknown",
        agency: ahj.agency || "Unknown",
        phone: ahj.phone || "Unknown",
        ahjId: ahj.ahjId || "",
        mailingAddress: ahj.mailingAddress || "",
      }));

      return { psap, ahjs };
    },
  }),

  lookup_psap_by_location: tool({
    description:
      "Look up PSAP emergency contacts using GPS coordinates (latitude/longitude). Use this when the caller provides coordinates instead of a street address, or when address verification fails but approximate coordinates are available.",
    inputSchema: z.object({
      latitude: z.number().describe("Latitude of the incident location"),
      longitude: z.number().describe("Longitude of the incident location"),
    }),
    execute: async ({ latitude, longitude }) => {
      const data = await preciselyPost("/v1/emergency-info/psap/location", {
        location: {
          coordinates: [longitude, latitude],
        },
      });

      if (data.error) {
        return { error: `PSAP location lookup failed: ${JSON.stringify(data.details)}` };
      }

      const response = data.response as any;
      if (!response || response.status === "ZERO_RESULTS") {
        return { error: "No PSAP results found for these coordinates" };
      }

      const psapData = response.psap || {};
      const county = psapData.county || {};
      const siteDetails = psapData.siteDetails || {};
      const siteAddress = siteDetails.address || {};
      const siteGeo = siteDetails.geocode || {};

      return {
        psap: {
          agency: psapData.agency || "Unknown",
          phone: psapData.phone || "Unknown",
          type: psapData.type || "Unknown",
          fccId: psapData.fccId || "",
          county: county.name || "",
          countyFips: county.fips || "",
          siteAddress: siteAddress.formattedAddress || "",
          siteLatitude: siteGeo.latitude ?? null,
          siteLongitude: siteGeo.longitude ?? null,
        },
      };
    },
  }),

  enrich_property: tool({
    description:
      "Get property details, building info, and business data for a US address via the Precisely Data Graph. Returns building type, area, elevation, property attributes, and business data for commercial properties. Critical for first responder pre-planning.",
    inputSchema: z.object({
      address: z.string().describe("Full address string (e.g. '350 Jordan Rd Troy NY 12180')"),
    }),
    execute: async ({ address }) => {
      const query = `query propertyByAddress {
        getByAddress(address: "${address.replace(/"/g, '\\"')}") {
          propertyAttributes {
            data {
              livingSquareFootage
              bedroomCount
              bathroomCount { value }
              saleAmount
            }
          }
          addresses {
            data {
              preciselyID
              latitude
              longitude
              propertyType { value description }
              places {
                data {
                  businessName
                  lineOfBusiness
                  phone
                }
              }
            }
          }
          buildings {
            data {
              buildingType { value description }
              buildingArea
              elevation
            }
          }
        }
      }`;

      const data = await preciselyGraphQL(query);

      if (data.error) {
        return { error: `Property enrichment failed: ${JSON.stringify(data.details)}` };
      }

      // Handle GraphQL errors
      if (data.errors) {
        return { error: `Data Graph query error: ${JSON.stringify(data.errors)}` };
      }

      const gqlData = data.data as any;
      const result = gqlData?.getByAddress;
      if (!result) {
        return { error: "No property data returned for this address" };
      }

      const propAttrs = result.propertyAttributes;
      const propData = propAttrs?.data?.[0];

      const addrData = result.addresses?.data?.[0];
      const propertyType = addrData?.propertyType;
      const firstPlace = addrData?.places?.data?.[0];

      const buildingData = result.buildings?.data?.[0];
      const buildingType = buildingData?.buildingType;
      const bathroomCount = propData?.bathroomCount;

      return {
        property: {
          propertyType: propertyType?.description || propertyType?.value || "Unknown",
          buildingType: buildingType?.description || buildingType?.value || "Unknown",
          buildingArea: buildingData?.buildingArea ?? null,
          elevation: buildingData?.elevation ?? null,
          livingSquareFootage: filterSentinel(propData?.livingSquareFootage ?? null),
          bedroomCount: filterSentinel(propData?.bedroomCount ?? null),
          bathroomCount: filterSentinel(bathroomCount?.value ?? null),
          saleAmount: filterSentinel(propData?.saleAmount ?? null),
          latitude: addrData?.latitude ?? null,
          longitude: addrData?.longitude ?? null,
          preciselyId: addrData?.preciselyID || "",
        },
        business: {
          businessName: firstPlace?.businessName || null,
          lineOfBusiness: firstPlace?.lineOfBusiness || null,
          phone: firstPlace?.phone || null,
        },
      };
    },
  }),

  calculate_route: tool({
    description:
      "Calculate driving route and ETA from a station to the incident location. Returns total distance and travel time. Use the PSAP siteLatitude/siteLongitude from lookup_emergency_contacts as the start point. Do NOT geocode the AHJ mailing address — the PSAP coordinates are already provided.",
    inputSchema: z.object({
      startLatitude: z.number().describe("Latitude of the responding station"),
      startLongitude: z.number().describe("Longitude of the responding station"),
      endLatitude: z.number().describe("Latitude of the incident location"),
      endLongitude: z.number().describe("Longitude of the incident location"),
    }),
    execute: async ({ startLatitude, startLongitude, endLatitude, endLongitude }) => {
      const data = await preciselyGet("/v1/direction/location", {
        origin: `${startLatitude},${startLongitude}`,
        destination: `${endLatitude},${endLongitude}`,
        mode: "car",
        option: "flexible",
      });

      if (data.error) {
        return { error: `Route calculation failed: ${JSON.stringify(data.details)}` };
      }

      // Parse response: routes[0] has distance (meters) and duration (seconds)
      const routes = data.routes as any[];
      const route = routes?.[0];

      if (route) {
        const distanceMeters = route.distance as number | undefined;
        const durationSeconds = route.duration as number | undefined;

        return {
          totalDistance: distanceMeters != null ? (distanceMeters / 1609.344).toFixed(1) : "Unknown",
          totalTime: durationSeconds != null ? (durationSeconds / 60).toFixed(1) : "Unknown",
          distanceUnit: "mi",
          timeUnit: "min",
        };
      }

      return {
        totalDistance: "Unknown",
        totalTime: "Unknown",
        distanceUnit: "mi",
        timeUnit: "min",
      };
    },
  }),
};
