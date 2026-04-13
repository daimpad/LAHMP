# LAHMP Wizard — Prototype

**Land Health Monitoring Platform · IUCN NBS Hub**  
Vanilla HTML / JavaScript / JSON · GitHub Pages · No build step · No server

---

## What this repository is

This is a **browser-only functional prototype** of the LAHMP wizard — a four-step self-assessment tool that guides land managers, NGOs, and project coordinators through designing a biodiversity monitoring programme for agricultural landscapes.

The prototype implements the **complete conditional logic and scoring algorithms** of all four steps, fed by static JSON files exported from the canonical Excel knowledge bases. It produces a rendered monitoring plan summary in the browser. No APIs, no authentication, no PDF generation, no server of any kind.

The full production platform (LAHMP v1) is specified in a separate document set and will be built as a Laravel + Vue.js application. This prototype serves as:

1. A **logic validator** — does the algorithm produce scientifically sensible output for known test landscapes?
2. A **demonstration tool** — shareable with Simon (IUCN project lead), Mercedes (biodiversity expert), and funders via a simple URL
3. A **development testbed** — contributors can verify JSON data structure correctness against algorithm output

Live URL: `https://[username].github.io/lahmp-wizard`

---

## Repository structure

```
lahmp-wizard/
├── index.html              ← Single-page wizard, all four steps
├── wizard.js               ← All state management and algorithm logic
├── styles.css              ← Styling (IUCN brand colours, wizard layout)
├── data/
│   ├── practices.json      ← Practice Matrix (43 practices, exported from Excel)
│   ├── indicators.json     ← Indicator Linkage Matrix (populated profiles only)
│   ├── abiotic.json        ← Abiotic Reference Table (16 indicators)
│   └── reference.json      ← Block 4/5/6 lists, pre-population mapping tables
├── export/
│   └── convert.py          ← Python script: Excel → JSON export (run locally, not in browser)
└── CLAUDE.md               ← This file
```

**All logic lives in `wizard.js`. All content lives in `data/`. `index.html` is presentation only.**

---

## What is deliberately out of scope for this prototype

Do not implement these. They belong to LAHMP v1 (Laravel application), not this prototype.

| Out of scope | Reason |
|---|---|
| GEO API (globalecosystems.org) polygon query | Requires server, API key, CORS handling |
| ABC Map / FAO API (IPCC land use by polygon) | Same |
| Leaflet polygon drawing | Prototype uses manual text inputs for location |
| User accounts and saved assessments | No server |
| PDF generation | Use `window.print()` with print CSS instead |
| Persistent storage between sessions | `localStorage` is acceptable for UX convenience only — not a data store |
| LLM / OpenAI integration | IUCN AI policy clearance pending |
| Darwin Core field alignment | v2 feature |

The prototype collects landscape context via **manual form inputs only** — typed location name, dropdown land use selection, checkbox pressures. This corresponds exactly to the failsafe / manual fallback mode specified in the Step 1 Developer Specification for when the GEO and ABC Map APIs are unavailable.

---

## Scientific and specification context

LAHMP operationalises the **IUCN Land Health Monitoring Framework (LHMF)**. The framework connects sustainable agricultural practices to measurable changes in soil condition, vegetation communities, animal communities, and ecosystem services, across four analytical scales (Field/Soil, Farm, Landscape, National/Global) and three biodiversity dimensions (Belowground, Aboveground, Habitat).

The authoritative specification documents are:
- `LAHMP_Master_Developer_Document.docx` — platform architecture, data flow, v1/v2 boundary
- `LAHMP_Step1_Developer_Specification.docx` — landscape profile, all input lists, pre-population logic
- `LAHMP_Step2_Developer_Specification.docx` — practice recommendation algorithm (4 operations)
- `LAHMP_Step3_Developer_Specification.docx` — capacity assessment, 6 questions, capacity profile
- `LAHMP_Step4_Developer_Specification.docx` — monitoring plan algorithm (5 operations), output structure

These documents are the single source of truth. When in doubt, the spec overrides any assumption in this file.

---

## IUCN brand colours

```css
--iucn-navy:  #003478;
--iucn-yellow: #FDC82F;   /* action/accent only — never decorative */
--iucn-green:  #1A7A52;
```

Fonts: IBM Plex Sans (body), IBM Plex Serif (headings), IBM Plex Mono (data values, IDs, codes). Load via Google Fonts or CDN.

---

## Assessment state object

All wizard state is held in a single JavaScript object `window.assessment`. It is the exact same structure as the production assessment record JSON, deliberately, so that prototype data can be used to test the production algorithm later.

```js
window.assessment = {
  assessment_id: null,       // uuid — generated on first load
  landscape_name: '',        // Step 1 Block 1.1
  created_at: null,
  last_updated: null,

  step1: {
    // Block 1 — Location
    landscape_name: '',
    country: '',
    admin_region: '',
    monitoring_programme_name: '',

    // Block 1.2 — entered manually (no API in prototype)
    area_ha: null,
    ipcc_land_use_categories: [],  // array of IPCC category strings from reference.json
    soil_types: [],                // array of IPCC soil type strings

    // Block 1.2 — EFG (manual selection in prototype)
    efg_codes: [],                 // e.g. ['T7.1', 'T7.3']

    // Block 1.3
    description: '',

    // Block 2 — Land uses present
    land_uses: [],                 // e.g. ['Intensive Annual Cropland', 'Grassland and Pasture']

    // Block 3.1 — Crops
    crops: [],                     // FAO ICC codes or plain names from reference.json

    // Block 3.2 — Livestock
    livestock: [],                 // FAO livestock categories from reference.json

    // Block 3.3 — Land use composition
    land_use_composition: [],      // [{ category: 'T7.1', ipcc_category: '...', area_pct: 40 }, ...]

    // Block 4 — Pressures (28 pressures)
    pressures: [],
    // Each item: { id: 1, name: '...', status: 'ongoing'|'past'|'not_sure'|'not_relevant', confidence: 'high'|'medium'|'low' }

    // Block 5 — Challenges (34 challenges) — pre-populated from Block 4, user-editable
    challenges: [],
    // Each item: { id: 1, name: '...', confidence: 'high'|'medium'|'low', pre_populated: true|false, confirmed: true|false }

    // Block 6 — Ecosystem services (37 services) — pre-populated from Block 5, user-ranked
    services: [],
    // Each item: { id: 1, name: '...', selected: true|false, priority_rank: 1|2|3|null, pre_populated: true|false }
  },

  step2: {
    // Block 2.0 — Pre-screen (4 questions)
    prescreen: {
      q1_trees: 'open'|'open_conditionally'|'not_currently',
      q2_livestock: 'open'|'open_conditionally'|'not_currently',
      q3_set_aside: 'open'|'open_conditionally'|'not_currently',
      q4_inputs: 'open'|'open_conditionally'|'not_currently',
    },

    // Block 2.1 — Confirmed practice selection
    selected_practices: [],
    // Each item: { p_code: 'P01', name: '...', theme: '...', tier: 'standard'|'transformative', score: 12 }

    practice_count: 0,
    theme_counts: {},   // { 'Soil Management': 3, 'Crop Diversity': 2, ... }
    standard_count: 0,
    transformative_count: 0,
  },

  step3: {
    // Q1 — Team composition
    team_types: [],       // [{ type: 'A', count: 2 }, { type: 'C', count: 1 }, ...]
    willingness_recruit: 'yes_any'|'yes_specific'|'no',
    willingness_recruit_roles: '',  // free text if yes_specific

    // Q2 — Time availability
    days_by_type: {},     // { 'A': 20, 'C': 30 }
    willingness_time: 'yes_significantly'|'yes_modestly'|'no',

    // Q3 — Equipment
    equipment_capabilities: [],  // array of integers 1–13 (equipment category IDs)
    willingness_equipment: 'yes_any'|'yes_specific'|'no',
    willingness_equipment_categories: [],

    // Q4 — Budget
    budget_tier: 0,       // integer 0–4

    // Q5 — Sites
    site_count_category: '1'|'2-5'|'6-20'|'21-100'|'100+',
    site_count: 1,        // resolved integer used in calculations
    site_distribution: 'single_landscape'|'single_region'|'multi_region',

    // Q6 — Seasonal access (12 months)
    access_calendar: [],  // [{ month: 'January', access: 'accessible'|'constrained'|'unknown', reason: '' }, ...]

    // Derived capacity profile (computed from above on Step 3 completion)
    capacity_profile: {
      max_protocol_level: 1,    // 1, 2, or 3 — highest achievable by team
      available_days_total: 0,
      per_site_days: 0,         // available_days_total / site_count
      equipment_ids: [],
      budget_tier: 0,
      willingness_profile: {
        recruit: false,
        time: false,
        equipment: false,
      },
    },
  },

  step4_outputs: {
    // Populated by the Step 4 algorithm after Step 3 completion
    practice_chains: [],         // Operation 1 output
    selected_indicator_groups: [], // Operation 2 output
    selected_abiotic: [],        // Operation 2 output (abiotic branch)
    protocol_assignments: [],    // Operation 3 output
    trimmed_groups: [],          // Operation 4 output (capacity-fitted exclusions)
    calendar: [],                // Operation 5 output
    narrative: {                 // Personalised text blocks
      paragraph1: '',
      paragraph2: '',
      paragraph3: '',
      paragraph4: '',
    },
  },
};
```

---

## Data files — JSON structure

### `data/reference.json`

Contains all static reference lists used in Step 1. **Do not hardcode any of these in `wizard.js`.**

```json
{
  "block4_pressures": [
    { "id": 1, "name": "Soil tillage and mechanical disturbance", "tooltip": "..." },
    { "id": 2, "name": "Use of synthetic fertilisers", "tooltip": "..." },
    ...
  ],
  "block5_challenges": [
    { "id": 1, "name": "Soil structure degradation", "tooltip": "..." },
    { "id": 2, "name": "Soil organic matter depletion", "tooltip": "..." },
    ...
  ],
  "block6_services": [
    { "id": 1, "name": "Crop provisioning services", "tooltip": "..." },
    ...
  ],
  "ipcc_land_use_categories": [
    "Intensive Annual Cropland",
    "Extensive Annual Cropland",
    "Permanent Cropland",
    "Grassland and Pasture",
    "Mixed Crop-Livestock System",
    "Agroforestry",
    "Plantation Forestry",
    "Irrigated Cropland",
    ...
  ],
  "ipcc_soil_types": [
    "Mineral Soils — High Activity Clay (HAC)",
    "Mineral Soils — Low Activity Clay (LAC)",
    ...
  ],
  "efg_options": [
    { "code": "T7.1", "name": "Annual croplands", "biome": "Intensive land-use biome" },
    { "code": "T7.2", "name": "Sown pastures and fields", "biome": "Intensive land-use biome" },
    { "code": "T7.3", "name": "Plantations", "biome": "Intensive land-use biome" },
    { "code": "T7.5", "name": "Derived semi-natural pastures and old fields", "biome": "Intensive land-use biome" },
    { "code": "F3.3", "name": "Rice paddies", "biome": "Intensive land-use biome" },
    ...
  ],
  "pressure_to_challenge_mapping": {
    "1": [
      { "challenge_id": 2, "confidence": "high" },
      { "challenge_id": 3, "confidence": "high" },
      { "challenge_id": 4, "confidence": "medium" }
    ],
    "2": [ ... ],
    ...
  },
  "challenge_to_service_mapping": {
    "1": [
      { "service_id": 11, "confidence": "high" },
      { "service_id": 15, "confidence": "medium" }
    ],
    ...
  }
}
```

### `data/practices.json`

43 practices. Exported from `LAHMP_Practice_Matrix.xlsx`, sheet `Practice Matrix`.

```json
[
  {
    "p_code": "P01",
    "name": "Reduce or eliminate tillage",
    "theme": "Soil Management",
    "rationale": "Mechanical soil disturbance is one of the primary drivers of...",
    "approach_origins": "1.1, 2.6, 2.8, 6.1, 7.1, 8.1, 13.2",
    "block4_pressures": [1, 2],
    "block5_challenges": [2, 3, 4, 7, 10, 21],
    "block6_services": [11, 15, 16],
    "hard_prerequisites": "None",
    "primary_applicability": ["Intensive Annual Cropland", "Extensive Annual Cropland", "Permanent Cropland"],
    "transformative_applicability": ["Grassland and Pasture transitioning to crop-livestock"],
    "prescreen_question": "Q4",
    "applicable_scale": "Field",
    "relevant_efgs": ["T7.1", "T7.3"],
    "implementation_constraints": "Requires adapted seeding equipment...",
    "tape_mapping": "Element 1 — Diversity (Index 2: Temporal and spatial diversification of crops and livestock)",
    "field_observation_checklist": "1. Has soil been mechanically inverted or tilled...",
    "evidence_correct": "Soil surface shows continuous residue or living cover...",
    "evidence_non_implementation": "Fresh tillage lines, turned soil..."
  },
  ...
]
```

### `data/indicators.json`

41 profiles. Exported from `LAHMP_Indicator_Linkage_Matrix.xlsx`, sheet `Indicator Linkage Matrix`. **Content columns (protocol names, output metrics) will be null for unpopulated profiles — the algorithm must handle this gracefully.**

```json
[
  {
    "profile_number": 6,
    "profile_name": "Earthworms",
    "category": "Soil macrofauna",
    "tier": "Universal",
    "conditionality_criteria": null,
    "hard_prerequisite": null,
    "primary_monitoring_role": "Ecological indicator",
    "monitoring_stage": "Fast (Stage 2, Year 2-5)",
    "response_timescale": "1-2 seasons",
    "block4_pressures": [1, 2, 5, 8, 9],
    "block5_challenges": [2, 3, 4, 7, 10],
    "block6_services": [11, 15, 16, 20],
    "relevant_efgs": ["T7.1", "T7.2", "T7.3", "T7.5"],
    "relevant_ipcc_land_use": ["Intensive Annual Cropland", "Extensive Annual Cropland", "Grassland and Pasture"],
    "soil_type_associations": ["Mineral Soils — High Activity Clay (HAC)"],
    "crop_livestock_associations": ["Annual cereals", "Legumes", "Cattle"],
    "b1_practices_that_benefit": ["P01", "P02", "P05", "P07"],
    "b2_practices_primarily_verified": ["P01", "P02", "P07"],
    "linkage_c_connected_groups": [1, 3, 4],
    "level1_protocol_name": "Earthworm presence and abundance count (mustard extraction)",
    "level2_protocol_name": "Earthworm abundance and community composition (hand-sorting + mustard)",
    "level3_protocol_name": "Earthworm diversity with molecular verification",
    "level1_output_metric": "Earthworms per m²",
    "level2_output_metric": "Earthworms per m², community composition by morphospecies",
    "level3_output_metric": "Species richness, Shannon diversity index",
    "primary_reference": "Ecdysis 1000 Farms Protocol; ISO 23611-1",
    "monitoring_task_type": "Biological count-based",
    "b2_expected_direction_of_change": "Increase in abundance and species richness following adoption of P01, P02, P07",
    "validation_status": "VALIDATED",
    "populated": true
  },
  {
    "profile_number": 1,
    "profile_name": "Soil bacteria",
    "category": "Soil microbial and fungal communities",
    "tier": "Universal",
    "conditionality_criteria": null,
    "hard_prerequisite": null,
    "primary_monitoring_role": "Ecological indicator",
    "monitoring_stage": "Fast (Stage 2, Year 2-5)",
    "response_timescale": "1-2 seasons",
    "block4_pressures": null,
    "block5_challenges": null,
    "block6_services": null,
    "relevant_efgs": null,
    "relevant_ipcc_land_use": null,
    "soil_type_associations": null,
    "crop_livestock_associations": null,
    "b1_practices_that_benefit": null,
    "b2_practices_primarily_verified": null,
    "linkage_c_connected_groups": null,
    "level1_protocol_name": null,
    "level2_protocol_name": null,
    "level3_protocol_name": null,
    "level1_output_metric": null,
    "level2_output_metric": null,
    "level3_output_metric": null,
    "primary_reference": null,
    "monitoring_task_type": "Biological count-based",
    "b2_expected_direction_of_change": null,
    "validation_status": "DRAFT - Unvalidated",
    "populated": false
  },
  ...
]
```

### `data/abiotic.json`

16 abiotic indicators. Exported from `LAHMP_Abiotic_Reference_Table.xlsx`.

```json
[
  {
    "indicator_id": "AB01",
    "indicator_name": "Soil organic carbon (SOC)",
    "block4_pressures": [1, 2, 5, 8],
    "block5_challenges": [2, 3, 4],
    "block6_services": [11, 15],
    "linked_practices": ["P01", "P02", "P07", "P08"],
    "hard_prerequisite_land_use": null,
    "universal_baseline": true,
    "protocol_name": "SOC field measurement (loss-on-ignition or Walkley-Black)",
    "monitoring_frequency": "Annual",
    "equipment_required": [9],
    "protocol_level": 2,
    "interpretation_notes": "Increasing SOC indicates improved soil biological function..."
  },
  ...
]
```

---

## Step 1 — Landscape Profile

### What the user does
Fills in six logical blocks describing their landscape. In the prototype, all inputs are manual (no map drawing, no API calls).

### Block 4 → Block 5 pre-population logic

This is the core intelligence of Step 1. When the user confirms a pressure in Block 4, the platform pre-selects related challenges in Block 5 using the `pressure_to_challenge_mapping` table in `reference.json`.

**Rules (from Step 1 Developer Spec Section 10.1):**

```
confidence_weight:
  'ongoing' status  → apply full confidence from mapping table
  'past' status     → reduce confidence one level (high→medium, medium→low, low→not selected)
  'not_sure' status → reduce confidence one level from 'ongoing'
  'not_relevant'    → suppress pre-selection entirely

area_weighting:
  if land_use_composition for the relevant category < 10% of total area
  → reduce confidence one level

union logic:
  multiple pressures mapping to same challenge → union; highest confidence wins
```

Implementation:

```js
function prepopulateChallenges(pressures, landUseComposition) {
  const mapping = referenceData.pressure_to_challenge_mapping;
  const challengeMap = {}; // challenge_id → highest confidence so far

  for (const pressure of pressures) {
    if (pressure.status === 'not_relevant') continue;

    const baseMappings = mapping[pressure.id] || [];
    for (const m of baseMappings) {
      let confidence = m.confidence;

      // Status reduction
      if (pressure.status === 'past' || pressure.status === 'not_sure') {
        confidence = reduceConfidence(confidence);
      }
      if (confidence === null) continue;

      // Area weighting (if land use context available)
      // ... reduce one level if relevant land use < 10%

      // Union: keep highest confidence
      const existing = challengeMap[m.challenge_id];
      if (!existing || confidenceRank(confidence) > confidenceRank(existing)) {
        challengeMap[m.challenge_id] = confidence;
      }
    }
  }

  return Object.entries(challengeMap).map(([id, confidence]) => ({
    id: parseInt(id),
    confidence,
    pre_populated: true,
    confirmed: false, // user must confirm
  }));
}

function reduceConfidence(c) {
  if (c === 'high') return 'medium';
  if (c === 'medium') return 'low';
  return null; // low → not selected
}

function confidenceRank(c) {
  return { high: 3, medium: 2, low: 1 }[c] ?? 0;
}
```

### Block 5 → Block 6 pre-population logic

Same pattern: `challenge_to_service_mapping` in `reference.json`. Validated challenges (confirmed by user) trigger service pre-selection. Confidence reduction same rules apply.

---

## Step 2 — Practice Recommendation and Selection

### Block 2.0 Pre-Screen (4 questions)

Shown before any practice recommendations. Each question has three options:
- `open` — transformative tier practices for this category are shown normally
- `open_conditionally` — shown with longer-term framing / reduced scope
- `not_currently` — transformative tier practices for this category are hidden

Questions govern these practice categories:
- **Q1** — Tree integration (agroforestry, hedgerows, shade trees)
- **Q2** — Livestock integration
- **Q3** — Land set-aside and habitat creation
- **Q4** — Input reduction and low-external-input transitions

Each practice in `practices.json` has a `prescreen_question` field (e.g. `"Q4"`) indicating which pre-screen question governs its transformative tier display.

### Block 2.1 — Recommendation Algorithm (4 operations)

**Operation 1 — Eligibility Filtering**

Filter all 43 practices. Remove a practice if any of the following:

```
1. Hard prerequisites not met:
   practice.hard_prerequisites specifies a feature not in step1
   (e.g. P19 requires irrigation — exclude if no irrigated cropland in step1.land_uses)

2. EFG relevance fail:
   practice.relevant_efgs has zero overlap with step1.step1.efg_codes

3. Land use eligibility fail:
   practice.primary_applicability has zero overlap with step1.land_uses
   AND practice.transformative_applicability has zero overlap with step1.land_uses
```

**Operation 2 — Relevance Scoring**

For each eligible practice, compute a relevance score:

```js
function scorePractice(practice, step1) {
  let score = 0;

  // Block 4 pressure matches (weight: 1 point per match)
  const userPressureIds = step1.pressures
    .filter(p => p.status !== 'not_relevant')
    .map(p => p.id);
  score += practice.block4_pressures.filter(id => userPressureIds.includes(id)).length;

  // Block 5 challenge matches (weight: 2 points per high-confidence match, 1 per medium)
  for (const challengeId of practice.block5_challenges) {
    const userChallenge = step1.challenges.find(c => c.id === challengeId && c.confirmed);
    if (!userChallenge) continue;
    if (userChallenge.confidence === 'high') score += 2;
    else if (userChallenge.confidence === 'medium') score += 1;
  }

  // Block 6 service matches (weight: by priority rank — rank 1 = 3pts, rank 2 = 2pts, rank 3 = 1pt)
  for (const serviceId of practice.block6_services) {
    const userService = step1.services.find(s => s.id === serviceId && s.selected);
    if (!userService) continue;
    if (userService.priority_rank === 1) score += 3;
    else if (userService.priority_rank === 2) score += 2;
    else if (userService.priority_rank === 3) score += 1;
  }

  return score;
}
```

**Operation 3 — Tier Assignment**

For each eligible practice, determine tier:

```js
function assignTier(practice, prescreen) {
  const q = practice.prescreen_question; // e.g. 'Q4'
  if (!q) return 'standard';

  const answer = prescreen[`${q.toLowerCase()}_${getTopic(q)}`]; // e.g. prescreen.q4_inputs
  if (answer === 'open') return 'transformative';
  if (answer === 'open_conditionally') return 'transformative'; // shown with different framing
  return null; // 'not_currently' → hide this practice's transformative version
}
```

**Operation 4 — Theme Grouping and Sort**

Group practices by `practice.theme`. Within each group, sort by score descending, then alphabetically for ties. Practices with score 0 are still shown but at the bottom (user can add them manually).

### Output

User reviews recommendations and confirms a final selection. Selected practices are stored in `step2.selected_practices`.

---

## Step 3 — Capacity Assessment

### Six questions

| ID | Question | Type | Key output field |
|---|---|---|---|
| Q1a | Who is in your monitoring team? | Multi-select + count per type | `team_types` |
| Q1b | Willing to recruit additional capacity? | Single select | `willingness_recruit` |
| Q2a | Field days per year per team type? | Numeric matrix | `days_by_type` |
| Q2b | Could monitoring time be increased? | Single select | `willingness_time` |
| Q3a | Which equipment/analytical capabilities do you have? | Multi-select (13 categories) | `equipment_capabilities` |
| Q3b | Willing to acquire additional equipment? | Single select | `willingness_equipment` |
| Q4 | Annual budget for external services? | Single select (5 tiers) | `budget_tier` |
| Q5a | How many monitoring sites? | Single select | `site_count_category` |
| Q5b | How are sites distributed? | Single select (if > 1 site) | `site_distribution` |
| Q6 | Which months have access constraints? | 12-month toggle | `access_calendar` |

### Team type to protocol level mapping

```js
const TEAM_PROTOCOL_LEVEL = {
  'A': 1,   // Land managers, farmers — community observer
  'B': 1,   // Extension officers — community observer to basic technician
  'C': 2,   // Field technicians, agronomists — technician level
  'D': 2,   // Biologists, ecologists — specialist (can do Level 2-3)
  'E': 3,   // Research scientists — research level
  'F': 3,   // External contracted specialists — highest available
};
```

Team type D can access Level 2–3; use `max(levels achievable by all team types present)` as the overall `max_protocol_level`.

### Capacity profile computation

```js
function computeCapacityProfile(step3) {
  const maxLevel = Math.max(
    ...step3.team_types.map(t => TEAM_PROTOCOL_LEVEL[t.type] ?? 1)
  );

  const totalDays = Object.values(step3.days_by_type).reduce((a, b) => a + b, 0);
  const siteCount = resolveSiteCount(step3.site_count_category); // e.g. '2-5' → 3 (midpoint)
  const perSiteDays = totalDays / siteCount;

  return {
    max_protocol_level: maxLevel,
    available_days_total: totalDays,
    per_site_days: perSiteDays,
    equipment_ids: step3.equipment_capabilities,
    budget_tier: step3.budget_tier,
    willingness_profile: {
      recruit: step3.willingness_recruit !== 'no',
      time: step3.willingness_time !== 'no',
      equipment: step3.willingness_equipment !== 'no',
    },
  };
}
```

**Budget mismatch check:** if `budget_tier === 0` but team types include E or F (which imply laboratory/specialist costs), warn the user before proceeding to Step 4.

---

## Step 4 — Monitoring Plan Algorithm

Five sequential operations. Triggered automatically on Step 3 completion.

### Operation 1 — Practice Grouping

Group `step2.selected_practices` by `theme`. Map themes to chain labels:

```js
const THEME_TO_CHAIN = {
  'Soil Management': 'Soil recovery and biological function chain',
  'Crop Diversity and Rotation': 'Crop system diversity and soil health chain',
  'Pest, Disease, and Weed Management': 'Natural regulation and IPM chain',
  'Water Management': 'Water quality and hydrology chain',
  'Livestock Management': 'Grazing management and pasture recovery chain',
  'Trees, Agroforestry, and Landscape Structure': 'Woody cover and landscape connectivity chain',
  'Habitat and Biodiversity Management': 'Above-ground habitat recovery chain',
  'Nutrient and Waste Management': 'Nutrient cycling and soil chemistry chain',
  'Restoration and Rehabilitation': 'Land restoration chain',
  'Holistic and Systems Approaches': null, // integrated across existing chains, no separate chain
};
```

### Operation 2 — Indicator Group Selection

For each indicator in `indicators.json`, apply filters to determine inclusion:

```js
function selectIndicatorGroups(indicators, step1, step2) {
  const selectedPCodes = step2.selected_practices.map(p => p.p_code);
  const userEFGs = step1.efg_codes;
  const userLandUses = step1.land_uses;
  const userChallengeIds = step1.challenges
    .filter(c => c.confirmed).map(c => c.id);

  return indicators
    .filter(ind => ind.populated) // only include profiles with content
    .filter(ind => {
      // EFG relevance — must overlap
      if (ind.relevant_efgs && !ind.relevant_efgs.some(e => userEFGs.includes(e))) return false;
      // IPCC land use — must overlap
      if (ind.relevant_ipcc_land_use && !ind.relevant_ipcc_land_use.some(l => userLandUses.includes(l))) return false;
      // Hard prerequisite
      if (ind.hard_prerequisite && !hardPrerequisiteMet(ind.hard_prerequisite, step1)) return false;
      // Conditionality
      if (ind.tier === 'Conditional' && !conditionalityMet(ind.conditionality_criteria, step1)) return false;
      return true;
    })
    .map(ind => {
      // Determine inclusion reason and priority
      const b2Match = ind.b2_practices_primarily_verified?.some(p => selectedPCodes.includes(p));
      const b1Match = ind.b1_practices_that_benefit?.some(p => selectedPCodes.includes(p));
      const challengeMatch = ind.block5_challenges?.some(id => userChallengeIds.includes(id));
      const included = b2Match || b1Match || challengeMatch;

      return included ? {
        ...ind,
        inclusion_reason: b2Match ? 'B2 primary verifier' : b1Match ? 'B1 supporting' : 'A2 challenge signal',
        priority: b2Match ? 3 : b1Match ? 2 : 1,
      } : null;
    })
    .filter(Boolean);
}
```

Also select abiotic indicators from `abiotic.json` using same P-code linkage logic. Always include all indicators with `universal_baseline: true`.

### Operation 3 — Protocol Assignment

For each selected indicator group:

```js
function assignProtocol(group, capacityProfile) {
  let level = Math.min(
    capacityProfile.max_protocol_level,
    group.level3_protocol_name ? 3 : group.level2_protocol_name ? 2 : 1
  );

  // Equipment override: check if required equipment is available
  // (requires an equipment_requirements lookup per group/level — populate from indicator profiles)
  // For prototype: skip equipment override if equipment_requirements data not yet available

  // Budget override: if level 3 requires external lab and budget is tier 0, downgrade
  if (level === 3 && capacityProfile.budget_tier === 0) level = 2;

  const protocolName = level === 3 ? group.level3_protocol_name
    : level === 2 ? group.level2_protocol_name
    : group.level1_protocol_name;

  const outputMetric = level === 3 ? group.level3_output_metric
    : level === 2 ? group.level2_output_metric
    : group.level1_output_metric;

  return { ...group, assigned_level: level, assigned_protocol: protocolName, assigned_metric: outputMetric };
}
```

### Operation 4 — Capacity Fitting

Estimate total monitoring days required. If exceeds capacity, trim lowest-priority groups.

**Priority scoring (higher = keep):**
```js
function priorityScore(group, step2, step1) {
  let score = 0;
  const selectedPCodes = step2.selected_practices.map(p => p.p_code);
  const top3Challenges = step1.challenges
    .filter(c => c.confirmed)
    .sort((a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence))
    .slice(0, 3).map(c => c.id);
  const top3Services = step1.services
    .filter(s => s.selected && s.priority_rank)
    .sort((a, b) => a.priority_rank - b.priority_rank)
    .slice(0, 3).map(s => s.id);

  // B2 practice linkages: 3 pts each
  score += (group.b2_practices_primarily_verified || [])
    .filter(p => selectedPCodes.includes(p)).length * 3;

  // A2 challenge signals: 2 pts each
  score += (group.block5_challenges || [])
    .filter(id => top3Challenges.includes(id)).length * 2;

  // A3 service support: 1 pt each
  score += (group.block6_services || [])
    .filter(id => top3Services.includes(id)).length * 1;

  // Universal tier: 2 pts
  if (group.tier === 'Universal') score += 2;

  // Fast-responding: 1 pt
  if (group.monitoring_stage?.startsWith('Fast')) score += 1;

  return score;
}
```

Trimmed groups are stored in `step4_outputs.trimmed_groups` and displayed in the output as "Enhancement recommendations — what you could add with additional capacity."

### Operation 5 — Calendar Construction

For each retained group, assign a monitoring season based on the group's primary monitoring window (from indicator profile). Cross-reference against `step3.access_calendar`. If constrained, use secondary window. If both constrained, flag.

For the prototype: if seasonal window data is not yet in `indicators.json`, output a simplified calendar with "Season: Specify based on local conditions" for each group.

---

## Output rendering (Step 4 display)

The output is rendered as a structured HTML summary in the browser — not a PDF. It uses `window.print()` with print CSS for a printable version.

Sections to render:
1. **Personalised narrative** — 4 paragraphs using template strings filled from `step4_outputs.narrative`
2. **Practice verification chains** — grouped list of selected practices by theme
3. **Biological monitoring programme** — table of retained indicator groups with assigned protocol, output metric, monitoring season
4. **Abiotic monitoring programme** — table of selected abiotic indicators with protocol and frequency
5. **Monitoring calendar** — 12-month view with monitoring tasks per month
6. **Enhancement recommendations** — trimmed groups with explanation of why excluded and what would be needed to include them

### Personalised narrative template

Paragraph 1 (from Step 4 Spec Section 5.1):
```
"Your monitoring programme has been designed specifically for [LANDSCAPE_NAME], a [EFG_TIER1_NAME] 
landscape [GEOGRAPHIC_CONTEXT]. In Step 1, you identified [PRESSURE_COUNT] pressures currently 
affecting your land — particularly [PRESSURE_1], [PRESSURE_2], and [PRESSURE_3]. These pressures 
are contributing to [CHALLENGE_COUNT] land health challenges, with [CHALLENGE_1], [CHALLENGE_2], 
and [CHALLENGE_3] being the most significant. The ecosystem services you most want to see recover 
are [SERVICE_1], [SERVICE_2], and [SERVICE_3]."
```

Fill variables from `window.assessment.step1`. Top pressures = sorted by confidence weight (high first).

---

## Export script: Excel → JSON

`export/convert.py` reads the three Excel workbooks and writes the four JSON files. Run locally before committing updated data.

```bash
pip install pandas openpyxl
python export/convert.py
```

The script maps the multi-line Excel column headers to the JSON field names defined above. It must be idempotent and must handle null cells in the Indicator Linkage Matrix gracefully (content columns for unpopulated profiles → `null`, `populated: false`).

---

## Test landscapes

Use these to validate end-to-end algorithm output. Expected outputs for each are documented in comments in `wizard.js`.

| ID | Name | Location | Primary EFG | Key pressures | Notes |
|---|---|---|---|---|---|
| TEST-01 | Skoura M'Daz | Morocco | T7.2 (Sown pastures) | Overgrazing, soil erosion, drought | Pilot case study from IUCN LHMF |
| TEST-02 | PK-17 | Mauritania | T7.5 (Semi-natural pastures) | Desertification, invasive species | Sahelian rangeland context |
| TEST-03 | Vietnam VSA | Vietnam | T7.1 (Annual croplands) + F3.3 (Rice paddies) | Pesticide use, water pollution | Mixed crop-aquaculture system |

Fixture files for these assessments are in `data/test_fixtures/` as pre-filled `assessment` objects. Load a fixture via the URL parameter `?fixture=TEST-01`.

---

## Contributing

### Adding a new indicator profile

1. Author the profile content in the Word template (`LAHMP_Indicator_Profile_Template.docx`)
2. Add the profile data to `LAHMP_Indicator_Linkage_Matrix.xlsx` (the canonical source)
3. Run `python export/convert.py` to regenerate `data/indicators.json`
4. Test with `?fixture=TEST-01` — verify the profile appears in Step 4 output when its P-code linkages match the test landscape's selected practices
5. Set `"populated": true` in the JSON entry

### Updating a knowledge base file

All three Excel workbooks are the canonical source of truth. Always edit the Excel, then re-export to JSON. Never edit the JSON files directly.

### Code style

- Vanilla JavaScript only. No frameworks, no build tools, no npm.
- All algorithm logic in `wizard.js`, clearly sectioned with comments matching the step and operation numbers from the spec docs.
- All content (labels, tooltips, option lists) loaded from JSON, never hardcoded in JS or HTML.
- Functions named to match spec terminology: `prepopulateChallenges`, `scorePractice`, `assignProtocol`, `computeCapacityProfile`, `selectIndicatorGroups`, etc.

---

## Key decisions and open items

| Item | Decision | Status |
|---|---|---|
| EFG selection in prototype | Manual dropdown from `reference.json` efg_options list — no GEO API | Confirmed for prototype |
| IPCC land use in prototype | Manual multi-select — no ABC Map API | Confirmed for prototype |
| PDF output | `window.print()` with print CSS — no Puppeteer | Confirmed for prototype |
| Session persistence | `localStorage` for UX convenience (resume wizard after page reload) | Acceptable — not a data store |
| Indicator profiles populated | Earthworms (Profile 06) and Grassland (Profile F03 / Profile 28) are fully populated. 39 profiles pending. | Ongoing — profiles added as IUCN team authors them |
| Scoring algorithm tie-breaking | Alphabetical by group name | Confirmed (per Step 4 spec) |
| Equipment cross-reference | Equipment requirements per group/level are in indicator profiles — not yet extracted to `indicators.json`. Prototype skips equipment override. | Open — add when profile data available |
| Seasonal windows | Not yet in `indicators.json`. Prototype shows "Specify based on local conditions." | Open — add when profile data available |

---

## Contact and governance

**IUCN project lead:** Simon — scientific content, strategic decisions, external partnerships.  
**Biodiversity/agricultural expert:** Mercedes — field-level validation of ecological logic.  
**Developer/consultant:** Daim — technical implementation, platform architecture.

Questions about scientific content → Simon or Mercedes.  
Questions about data structure or algorithm logic → raise a GitHub issue with the `question: science` label.  
Questions about code → raise a GitHub issue with the `question: code` label.

The canonical specification documents are maintained by the IUCN team. If you find a discrepancy between this `CLAUDE.md` and the spec documents, **the spec documents take precedence**. Flag it as a GitHub issue with the label `spec-conflict`.
