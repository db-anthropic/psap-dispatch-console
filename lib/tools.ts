import { tool } from "ai";
import { z } from "zod";
import { preciselyPost, preciselyGet } from "./precisely";

export const tools = {
  verify_address: tool({
    description:
      "Verify and standardize a US street address. Returns the standardized address, confidence score, PreciselyID, and coordinates (lat/lon). Call this as soon as the caller provides an address. Coordinates are included — only use geocode_address as a fallback if this returns no coordinates.",
    inputSchema: z.object({
      addressLine1: z.string().describe("Street address line 1 (e.g. '350 Jordan Rd')"),
      addressLine2: z.string().optional().describe("Street address line 2 (suite, apt, etc.)"),
      city: z.string().describe("City name"),
      state: z.string().describe("Two-letter state abbreviation (e.g. 'NY')"),
      postalCode: z.string().optional().describe("ZIP code"),
    }),
    execute: async ({ addressLine1, addressLine2, city, state, postalCode }) => {
      const addressLines = [addressLine1];
      if (addressLine2) addressLines.push(addressLine2);

      const data = await preciselyPost("/v1/addresses/verify", {
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

      const responses = data.responses as Array<Record<string, unknown>>;
      if (!responses?.[0]) {
        return { error: "No address verification results returned" };
      }

      const result = responses[0];
      const address = result.address as Record<string, unknown> | undefined;
      const geocode = result.geocode as Record<string, unknown> | undefined;

      return {
        formattedAddress: address?.formattedAddress || "",
        streetAddress: address?.formattedStreetAddress || "",
        city: address?.city || "",
        state: address?.admin1 || "",
        postalCode: address?.postalCode || "",
        country: address?.country || "",
        preciselyId: address?.preciselyId || "",
        confidence: result.confidence ?? null,
        latitude: geocode?.latitude ?? null,
        longitude: geocode?.longitude ?? null,
      };
    },
  }),

  geocode_address: tool({
    description:
      "Fallback geocoding: get precise lat/lon for a US address when verify_address did not return coordinates. Only call this if verify_address returned null latitude/longitude.",
    inputSchema: z.object({
      addressLine1: z.string().describe("Street address line 1"),
      city: z.string().describe("City name"),
      state: z.string().describe("Two-letter state abbreviation"),
      postalCode: z.string().optional().describe("ZIP code"),
    }),
    execute: async ({ addressLine1, city, state, postalCode }) => {
      const data = await preciselyPost("/v1/addresses/geocode", {
        addresses: [
          {
            addressLines: [addressLine1],
            city,
            admin1: state,
            postalCode: postalCode || "",
            country: "USA",
          },
        ],
        preferences: {
          maxResults: 1,
          returnAllInfo: true,
        },
      });

      if (data.error) {
        return { error: `Geocoding failed: ${JSON.stringify(data.details)}` };
      }

      const responses = data.responses as Array<Record<string, unknown>>;
      const candidates = responses?.[0]?.candidates as Array<Record<string, unknown>>;
      if (!candidates?.[0]) {
        return { error: "No geocoding results returned" };
      }

      const candidate = candidates[0];
      const location = candidate.location as Record<string, unknown> | undefined;
      const address = candidate.address as Record<string, unknown> | undefined;

      return {
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        preciselyId: candidate.preciselyId || "",
        formattedAddress: address?.formattedAddress || "",
        matchScore: candidate.matchScore ?? null,
      };
    },
  }),

  lookup_emergency_contacts: tool({
    description:
      "Look up PSAP and AHJ (EMS, Fire, Police) emergency contacts for a US address. Returns dispatch center info, agency contacts with phone numbers, and the PSAP site address/coordinates for route calculation.",
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
          city,
          admin1: state,
          admin2: "",
          postalCode: postalCode || "",
          postalCodeExt: "",
          placeName: "",
          borough: "",
          suburb: "",
        },
      });

      if (data.error) {
        return { error: `Emergency contacts lookup failed: ${JSON.stringify(data.details)}` };
      }

      const response = data.response as Record<string, unknown> | undefined;
      if (!response || response.status === "ZERO_RESULTS") {
        return { error: "No emergency contact results found for this address" };
      }

      const psapData = response.psap as Record<string, unknown> | undefined;
      const ahjsData = response.ahjs as Array<Record<string, unknown>> | undefined;
      const county = psapData?.county as Record<string, unknown> | undefined;
      const siteDetails = psapData?.siteDetails as Record<string, unknown> | undefined;
      const siteAddress = siteDetails?.address as Record<string, unknown> | undefined;
      const siteGeo = siteDetails?.geocode as Record<string, unknown> | undefined;

      const psap = {
        agency: psapData?.agency || "Unknown",
        phone: psapData?.phone || "Unknown",
        type: psapData?.type || "Unknown",
        fccId: psapData?.fccId || "",
        county: county?.name || "",
        countyFips: county?.fips || "",
        siteAddress: siteAddress?.formattedAddress || "",
        siteLatitude: siteGeo?.latitude ?? null,
        siteLongitude: siteGeo?.longitude ?? null,
      };

      const ahjs = (ahjsData || []).map((ahj) => ({
        type: ahj.ahjType || ahj.type || "Unknown",
        agency: ahj.agency || "Unknown",
        phone: ahj.phone || "Unknown",
        ahjId: ahj.ahjId || "",
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

      const response = data.response as Record<string, unknown> | undefined;
      if (!response || response.status === "ZERO_RESULTS") {
        return { error: "No PSAP results found for these coordinates" };
      }

      const psapData = response.psap as Record<string, unknown> | undefined;
      const county = psapData?.county as Record<string, unknown> | undefined;
      const siteDetails = psapData?.siteDetails as Record<string, unknown> | undefined;
      const siteAddress = siteDetails?.address as Record<string, unknown> | undefined;
      const siteGeo = siteDetails?.geocode as Record<string, unknown> | undefined;

      return {
        psap: {
          agency: psapData?.agency || "Unknown",
          phone: psapData?.phone || "Unknown",
          type: psapData?.type || "Unknown",
          fccId: psapData?.fccId || "",
          county: county?.name || "",
          countyFips: county?.fips || "",
          siteAddress: siteAddress?.formattedAddress || "",
          siteLatitude: siteGeo?.latitude ?? null,
          siteLongitude: siteGeo?.longitude ?? null,
        },
      };
    },
  }),

  enrich_property: tool({
    description:
      "Get property details, building info, business data, and hazard assessments for a US address via the Precisely Data Graph. Returns building type, stories, construction materials, heating fuel, flood/earthquake/wildfire risks, and business data (name, SIC/NAICS codes, employee count) for commercial properties. Critical for first responder pre-planning.",
    inputSchema: z.object({
      addressLine1: z.string().describe("Street address line 1"),
      city: z.string().describe("City name"),
      state: z.string().describe("Two-letter state abbreviation"),
      postalCode: z.string().optional().describe("ZIP code"),
    }),
    execute: async ({ addressLine1, city, state, postalCode }) => {
      const graphqlQuery = `{
        address(
          addressLine1: "${addressLine1.replace(/"/g, '\\"')}",
          city: "${city.replace(/"/g, '\\"')}",
          stateProvince: "${state.replace(/"/g, '\\"')}",
          postalCode: "${(postalCode || "").replace(/"/g, '\\"')}",
          country: "US"
        ) {
          preciselyId
          formattedAddress
          property {
            pbKey
            buildingArea
            lotSize
            yearBuilt
            stories
            buildingType
            roofType
            foundationType
            exteriorWalls
            heatingFuel
            heatingType
            coolingType
            numberOfBedrooms
            numberOfBathrooms
            numberOfRooms
            garageType
            poolType
          }
          business {
            businessName
            sicCode
            naicsCode
            employeeCount
          }
          hazards {
            earthquake { riskScore }
            flood { zone floodRisk }
            wildfire { riskScore }
          }
          demographics {
            population
            medianHouseholdIncome
          }
        }
      }`;

      const data = await preciselyPost("/v1/data-graph", {
        query: graphqlQuery.replace(/\n/g, " ").replace(/\s+/g, " "),
      });

      if (data.error) {
        return { error: `Property enrichment failed: ${JSON.stringify(data.details)}` };
      }

      const addressData = (data.data as Record<string, unknown>)?.address as Record<string, unknown> | undefined;
      if (!addressData) {
        return { error: "No property data returned for this address" };
      }

      const prop = addressData.property as Record<string, unknown> | undefined;
      const biz = addressData.business as Record<string, unknown> | undefined;
      const hazards = addressData.hazards as Record<string, unknown> | undefined;
      const demographics = addressData.demographics as Record<string, unknown> | undefined;
      const earthquake = hazards?.earthquake as Record<string, unknown> | undefined;
      const flood = hazards?.flood as Record<string, unknown> | undefined;
      const wildfire = hazards?.wildfire as Record<string, unknown> | undefined;

      return {
        property: {
          buildingType: prop?.buildingType || "Unknown",
          stories: prop?.stories ?? null,
          yearBuilt: prop?.yearBuilt ?? null,
          buildingArea: prop?.buildingArea ?? null,
          lotSize: prop?.lotSize ?? null,
          roofType: prop?.roofType || "Unknown",
          foundationType: prop?.foundationType || "Unknown",
          exteriorWalls: prop?.exteriorWalls || "Unknown",
          heatingFuel: prop?.heatingFuel || "Unknown",
          heatingType: prop?.heatingType || "Unknown",
          coolingType: prop?.coolingType || "Unknown",
          numberOfBedrooms: prop?.numberOfBedrooms ?? null,
          numberOfBathrooms: prop?.numberOfBathrooms ?? null,
          numberOfRooms: prop?.numberOfRooms ?? null,
          garageType: prop?.garageType || "None",
          poolType: prop?.poolType || "None",
        },
        business: {
          businessName: biz?.businessName || null,
          sicCode: biz?.sicCode || null,
          naicsCode: biz?.naicsCode || null,
          employeeCount: biz?.employeeCount ?? null,
        },
        hazards: {
          earthquake: { riskScore: earthquake?.riskScore || "Unknown" },
          flood: {
            zone: flood?.zone || "Unknown",
            floodRisk: flood?.floodRisk || "Unknown",
          },
          wildfire: { riskScore: wildfire?.riskScore || "Unknown" },
        },
        demographics: {
          population: demographics?.population ?? null,
          medianHouseholdIncome: demographics?.medianHouseholdIncome ?? null,
        },
      };
    },
  }),

  calculate_route: tool({
    description:
      "Calculate driving route and ETA from a station to the incident location. Use the PSAP siteLatitude/siteLongitude from lookup_emergency_contacts as the start point. If no site coordinates are available, use a central location in the same city as a reasonable estimate.",
    inputSchema: z.object({
      startLatitude: z.number().describe("Latitude of the responding station (use PSAP siteLatitude when available)"),
      startLongitude: z.number().describe("Longitude of the responding station (use PSAP siteLongitude when available)"),
      endLatitude: z.number().describe("Latitude of the incident location"),
      endLongitude: z.number().describe("Longitude of the incident location"),
    }),
    execute: async ({ startLatitude, startLongitude, endLatitude, endLongitude }) => {
      const data = await preciselyGet("/v1/routing/route", {
        startPoint: `${startLatitude},${startLongitude}`,
        endPoint: `${endLatitude},${endLongitude}`,
        db: "driving",
        optimizeBy: "time",
        distanceUnit: "mi",
        timeUnit: "min",
        returnIntermediatePoints: "false",
      });

      if (data.error) {
        return { error: `Route calculation failed: ${JSON.stringify(data.details)}` };
      }

      return {
        totalDistance: data.totalDistance || "Unknown",
        totalTime: data.totalTime || "Unknown",
        distanceUnit: "mi",
        timeUnit: "min",
      };
    },
  }),
};
