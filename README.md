# Precisely Geo Intelligence Demo

A real-time dispatch intelligence console that demonstrates how **Precisely's location APIs** combined with **Claude AI** can power emergency response workflows. A dispatcher enters an address or selects a demo scenario, the system enriches it through multiple Precisely APIs in parallel, then Claude synthesizes a structured First Responder Briefing.

## How It Works

```
Caller describes emergency with address
  → Address Verification (standardize + PreciselyID)
  → Geocoding (lat/lon coordinates)
  → [parallel] PSAP/AHJ lookup + Property enrichment
  → Route calculation (ETA from nearest station)
  → Claude AI briefing synthesis
```

The UI is a split-panel layout:
- **Left panel** — iMessage-style chat between the emergency caller and dispatcher, with tool status pills showing API progress
- **Right panel** — Dispatch Intelligence dashboard with live data cards (address, building profile, hazards, emergency contacts, response route) and an AI-generated tactical briefing

## Demo Scenarios

Three pre-built scenarios are available on the start screen:

| Scenario | Address | Type |
|----------|---------|------|
| Residential Fire | 350 Jordan Rd, Troy, NY 12180 | Structure fire, occupants inside |
| Medical Emergency | 860 White Plains Rd, Trumbull, CT 06611 | Chest pains, elderly patient |
| Commercial Incident | 1271 Avenue of the Americas, New York, NY 10020 | Gas leak, high-rise evacuation |

After the initial briefing, the dispatcher can ask follow-up questions (rendered as clickable pills) to gather more info from the caller. Claude incorporates caller responses into an updated tactical briefing.

## Tech Stack

- **Next.js 16** (App Router, React 19)
- **AI SDK v6** (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`) — streaming tool use with Claude
- **Precisely APIs** — address verification, geocoding, emergency info (PSAP/AHJ), property data (GraphQL), routing
- **Tailwind CSS 4** — dark theme dispatch UI
- **Zod v4** — tool input validation
- **TypeScript** — end-to-end type safety

## Project Structure

```
app/
  page.tsx              # Main page — split-panel layout, message/tool state management
  api/chat/route.ts     # AI SDK streaming endpoint (Claude + tools)
  layout.tsx            # Root layout, global styles
  globals.css           # Tailwind theme (dark dispatch palette)

components/
  chat-panel.tsx        # iMessage-style caller/dispatcher chat
  dispatch-panel.tsx    # Right panel — data cards + briefing
  demo-scenarios.tsx    # Pre-built scenario buttons
  address-card.tsx      # Verified address + coordinates + map link
  building-card.tsx     # Property type, area, elevation, business info
  hazard-card.tsx       # Flood zones, earthquake risk, environmental hazards
  contacts-card.tsx     # PSAP dispatch center + AHJ agencies (EMS/Fire/Police)
  route-card.tsx        # Response ETA + distance from station
  narrative-card.tsx    # Claude AI tactical briefing

lib/
  tools.ts              # AI SDK tool definitions (6 Precisely API tools)
  precisely.ts          # Precisely API client (auth, POST, GET, GraphQL)
  system-prompt.ts      # Claude system prompt with dispatch workflow
```

## Precisely APIs Used

| Tool | Endpoint | Purpose |
|------|----------|---------|
| `verify_address` | `POST /v1/verify` | Standardize address, get PreciselyID + confidence |
| `geocode_address` | `POST /v1/geocode` | Convert address to lat/lon coordinates |
| `lookup_emergency_contacts` | `POST /v1/emergency-info/psap-ahj/address` | PSAP dispatch center + AHJ agencies |
| `lookup_psap_by_location` | `POST /v1/emergency-info/psap/location` | PSAP lookup by GPS coordinates |
| `enrich_property` | `POST /data-graph/graphql` | Building profile, property data, business info |
| `calculate_route` | `GET /v1/direction/location` | Driving route ETA + distance |

## Setup

### Prerequisites

- Node.js 18+
- Precisely API credentials ([Data Integrity Suite](https://www.precisely.com/product/data-integrity-suite))
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Install

```bash
git clone https://github.com/db-anthropic/psap-dispatch-console.git
cd psap-dispatch-console
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
PRECISELY_API_KEY=your_precisely_api_key
PRECISELY_API_SECRET=your_precisely_api_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and select a demo scenario.

### Deploy

The app is configured for Vercel deployment. Push to `main` to trigger automatic deploys.

```bash
npm run build    # Verify production build
git push         # Deploy via Vercel
```

## Architecture Notes

- **Streaming tool use**: Claude calls tools during streaming via AI SDK v6's `streamText` + `toUIMessageStreamResponse`. Tool status pills update in real-time as each API call completes.
- **Parallel API calls**: After address verification and geocoding (sequential), PSAP lookup and property enrichment run in parallel via Claude's parallel tool calling.
- **Chat/Intelligence separation**: All Claude text (briefings, analysis) renders exclusively in the Dispatch Intelligence panel. The chat panel shows only caller messages, dispatcher follow-up questions, and tool status pills.
- **Auth**: Precisely OAuth2 bearer tokens are cached server-side with automatic refresh 60s before expiry.
- **Sentinel filtering**: Precisely's `-9999` "no data" sentinel values are filtered to null before display.
