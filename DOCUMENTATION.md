# LAHMP Wizard — Technical Documentation

> Plain-language guide: architecture, data interconnections, and algorithm locations

---

## Table of Contents

1. [What is LAHMP?](#1-what-is-lahmp)
2. [Repository Structure](#2-repository-structure)
3. [The Four Data Files and How They Connect](#3-the-four-data-files-and-how-they-connect)
4. [How the Four Steps Fit Together](#4-how-the-four-steps-fit-together)
5. [Step 1 — Landscape Profile](#5-step-1--landscape-profile)
6. [Step 2 — Practice Recommendation](#6-step-2--practice-recommendation)
7. [Step 3 — Capacity Assessment](#7-step-3--capacity-assessment)
8. [Step 4 — Monitoring Plan](#8-step-4--monitoring-plan)
9. [Where is Each Piece of Logic in wizard.js?](#9-where-is-each-piece-of-logic-in-wizardjs)
10. [End-to-End Data Flow](#10-end-to-end-data-flow)
11. [How Data is Stored](#11-how-data-is-stored)
12. [Export Scripts (Python)](#12-export-scripts-python)

---

## 1. What is LAHMP?

**LAHMP** stands for *Land Health Monitoring Platform*. It is a **browser-only tool** (no server, no database) that guides farmers, NGOs, and project coordinators through four steps:

1. Describe their landscape (pressures, challenges, ecosystem services)
2. Receive and select recommended land management practices
3. Assess their monitoring capacity (team, time, equipment, budget)
4. Automatically generate a personalised **biodiversity monitoring plan**

The tool runs **entirely in the browser**. There are no API calls, no login, no database. Everything comes from four JSON files in the `data/` folder.

**Live URL:** `https://daimpad.github.io/LAHMP`

---

## 2. Repository Structure

```
lahmp/
│
├── index.html          ← Single HTML page. Presentation only (scaffolding, no content)
├── wizard.js           ← The core: all algorithms and UI logic
├── styles.css          ← Styling (IUCN brand colours, wizard layout)
│
├── data/               ← The four JSON data files (exported from Excel)
│   ├── reference.json  ← Reference lists (pressures, challenges, services, mappings)
│   ├── practices.json  ← 43 land management practices
│   ├── indicators.json ← 41 biological indicator profiles
│   └── abiotic.json    ← 16 abiotic indicators (soil, water)
│
├── raw/                ← Source files (Excel + CSV) — never edit directly
│   ├── LAHMP_Practice_Matrix.xlsx
│   ├── LAHMP_Indicator_Linkage_Matrix_Populated.xlsx
│   ├── LAHMP_Abiotic_Reference_Table.xlsx
│   └── IUCN - LHMT - *.csv
│
├── indicators/         ← DOCX profiles (one Word document per indicator)
│   ├── LAHMP_Profile_01_Soil_Bacteria.docx
│   └── ... (profiles 01–41)
│
├── export/             ← Python scripts to regenerate the JSON files
│   ├── convert.py      ← Excel → JSON (practices, indicators, abiotic)
│   └── extract_indicators.py ← DOCX profiles → indicators.json
│
└── data/test_fixtures/ ← Pre-filled test assessments for development
    ├── TEST-01.json    ← Skoura M'Daz, Morocco
    ├── TEST-02.json    ← PK-17, Mauritania
    └── TEST-03.json    ← Vietnam VSA
```

### The Core Rule

| File | Purpose |
|---|---|
| `index.html` | HTML scaffolding only — no content, no logic |
| `wizard.js` | **All** algorithms, rendering, and state management |
| `data/*.json` | **All** content — never hardcode in JS or HTML |
| `raw/*.xlsx` | Canonical source — always edit Excel first, then export |

---

## 3. The Four Data Files and How They Connect

The four JSON files use **numeric IDs** as a shared language. A pressure ID in `reference.json` is the same ID in `practices.json`, `indicators.json`, and `abiotic.json`.

### Overview

```
reference.json                practices.json
──────────────────            ──────────────────
block4_pressures  ─── IDs ──► block4_pressures
block5_challenges ─── IDs ──► block5_challenges
block6_services   ─── IDs ──► block6_services
                              relevant_efgs
                              p_code (e.g. "P01")
                                    │
              ┌─────────────────────┘
              ▼
indicators.json               abiotic.json
──────────────────            ──────────────────
block4_pressures              block4_pressures
block5_challenges             block5_challenges
block6_services               block6_services
relevant_efgs                 linked_practices  ─── p_code
b1_practices_that_benefit ─── p_code
b2_practices_primarily_verified ─ p_code
```

### `reference.json` — The Control Centre

Contains all reference lists and the **two mapping tables** that power the wizard:

| Content | Description |
|---|---|
| `block4_pressures` | 28 pressures (e.g. "Intensive tillage", ID 1) |
| `block5_challenges` | 35 challenges (e.g. "Soil structure degradation") |
| `block6_services` | 37 ecosystem services |
| `ipcc_land_use_categories` | Land use types (e.g. "Intensive Annual Cropland") |
| `efg_options` | Ecosystem typologies (e.g. T7.1 Annual croplands) |
| `ipcc_soil_types` | Soil types |
| `pressure_to_challenge_mapping` | **Core mapping**: pressure ID → list of challenges + confidence |
| `challenge_to_service_mapping` | **Core mapping**: challenge ID → list of services |

**Example** — what the mapping looks like:

```json
"pressure_to_challenge_mapping": {
  "1": [
    { "challenge_id": 2, "confidence": "high" },
    { "challenge_id": 3, "confidence": "high" },
    { "challenge_id": 4, "confidence": "medium" }
  ]
}
```

→ When pressure 1 ("Intensive tillage") is marked as *ongoing*, challenges 2 and 3 (high confidence) and challenge 4 (medium confidence) are automatically pre-selected in Block 5.

### `practices.json` — 43 Practices

Each practice has:
- `p_code` — unique identifier (P01–P43)
- `theme` — theme group (e.g. "Soil Management")
- `block4_pressures`, `block5_challenges`, `block6_services` — arrays of IDs from `reference.json`
- `relevant_efgs` — which ecosystem types this practice applies to
- `prescreen_question` — which pre-screen question (Q1–Q4) governs this practice

### `indicators.json` — 41 Biological Indicator Profiles

Each profile has:
- `profile_number`, `profile_name` (e.g. "Earthworms")
- `block4_pressures`, `block5_challenges`, `block6_services` — IDs from `reference.json`
- `b1_practices_that_benefit` and `b2_practices_primarily_verified` — P-codes from `practices.json`
- `level1_protocol_name` / `level2_protocol_name` / `level3_protocol_name` — three protocol tiers
- `level1_output_metric` / `level2_output_metric` / `level3_output_metric` — what gets measured
- `populated: true/false` — whether the profile has been fully authored

### `abiotic.json` — 16 Abiotic Indicators

For soil and water measurements (e.g. soil organic carbon, pH):
- `indicator_id` (AB01–AB16)
- `universal_baseline: true/false` — recommended universally, regardless of practices
- `protocol_level` — always a fixed protocol level
- `linked_practices` — P-codes from `practices.json`

### ID Linkage: A Concrete Example

```
Pressure 1 ("Intensive tillage") appears in:
  reference.json  → block4_pressures[0].id = 1
  practices.json  → P01.block4_pressures contains 1
  indicators.json → Profile 1 (Soil bacteria).block4_pressures contains 1
  abiotic.json    → AB01 (SOC).block4_pressures contains 1

All four files "talk about" the same thing via ID = 1.
```

---

## 4. How the Four Steps Fit Together

```
╔══════════════╗     ╔══════════════╗     ╔══════════════╗     ╔══════════════╗
║    STEP 1    ║────►║    STEP 2    ║────►║    STEP 3    ║────►║    STEP 4    ║
║  Landscape   ║     ║  Practice    ║     ║  Capacity    ║     ║  Monitoring  ║
║  Profile     ║     ║  Selection   ║     ║  Assessment  ║     ║  Plan        ║
╚══════════════╝     ╚══════════════╝     ╚══════════════╝     ╚══════════════╝
      │                     │                    │                    │
   step1{}               step2{}             step3{}          step4_outputs{}
      │                     │                    │                    │
      ▼                     ▼                    ▼                    ▼
 28 pressures         Filtered &           Capacity             Personalised
 35 challenges        scored               profile              monitoring plan
 37 services          practices            (max_level,          (protocols,
 land uses            selected             days, budget)        calendar,
 EFG codes                                                       recommendations)
```

**Everything lives in a single JavaScript object:** `window.assessment`

```javascript
window.assessment = {
  assessment_id: "...",
  step1: { pressures: [...], challenges: [...], services: [...], ... },
  step2: { prescreen: {...}, selected_practices: [...] },
  step3: { team_types: [...], budget_tier: 2, capacity_profile: {...} },
  step4_outputs: { practice_chains: [...], calendar: [...], ... }
}
```

This object is automatically saved to `localStorage` on every change.

---

## 5. Step 1 — Landscape Profile

### What the user fills in (6 blocks)

| Block | Content | Stored in |
|---|---|---|
| Block 1 | Name, country, region | `step1.landscape_name`, `.country`, ... |
| Block 1.2 | Area, IPCC land use, ecosystem types (EFG), soil types | `step1.area_ha`, `.ipcc_land_use_categories`, `.efg_codes`, `.soil_types` |
| Block 1.3 | Free-text description | `step1.description` |
| Block 2 | Which land uses are present? | `step1.land_uses` |
| Block 3 | Crops, livestock, land use composition (% per category) | `step1.crops`, `.livestock`, `.land_use_composition` |
| Block 4 | 28 pressures: ongoing / past / not_sure / not_relevant | `step1.pressures` |
| Block 5 | 35 challenges (auto-prepopulated + manually confirmed) | `step1.challenges` |
| Block 6 | 37 ecosystem services (auto-prepopulated, priority 1–3) | `step1.services` |

### The Key Algorithm: `prepopulateChallenges()`

**Location:** `wizard.js`, line ~238

**What it does:** As soon as a pressure is set in Block 4, matching challenges in Block 5 are automatically pre-selected.

```
Block 4: User marks pressure 1 ("Intensive tillage") as "ongoing"
         │
         ▼
reference.json: pressure_to_challenge_mapping["1"]
         │ → Challenge 2: "high"
         │ → Challenge 3: "high"
         └ → Challenge 4: "medium"
         │
         ▼
Block 5: Challenge 2 appears with green "HIGH" badge
         Challenge 3 appears with green "HIGH" badge
         Challenge 4 appears with amber "MEDIUM" badge
```

**Confidence rules:**

| Pressure status | Effect on confidence |
|---|---|
| `ongoing` | Full confidence from the mapping table |
| `past` or `not_sure` | Reduce one level (high→medium, medium→low, low→not selected) |
| `not_relevant` | Not pre-selected at all |

**Area weighting** (additional rule):  
If a pressure is only relevant to a specific land use type (e.g. "Intensive tillage" only affects cropland), and that land use covers less than 10% of total area → reduce confidence one level.

**Union logic:** If multiple pressures map to the same challenge → the highest confidence wins.

### `prepopulateServices()` — Step 5→6

**Location:** `wizard.js`, line ~261

Same logic, different mapping table: `challenge_to_service_mapping`. Confirmed challenges → ecosystem services are pre-selected.

---

## 6. Step 2 — Practice Recommendation

### Block 2.0 — Pre-Screen (4 questions)

Before any recommendations are shown, the user is asked whether they are open to certain directions:

| Question | Governs |
|---|---|
| Q1: Open to integrating trees / agroforestry? | Agroforestry practices |
| Q2: Open to integrating or diversifying livestock? | Livestock practices |
| Q3: Open to setting aside land for habitat? | Habitat practices |
| Q4: Open to reducing external inputs? | Pesticide / fertiliser reduction |

Answer options: `open` / `open_conditionally` / `not_currently`

→ `not_currently` = these practices are **hidden entirely**

### Block 2.1 — Scoring Algorithm: `scorePractice()`

**Location:** `wizard.js`, line ~278

Each practice receives a relevance score based on the user's Step 1 answers:

```
Score calculation:
  +1 point  per matching pressure (Block 4, status ≠ "not_relevant")
  +2 points per confirmed challenge with high confidence (Block 5)
  +1 point  per confirmed challenge with medium confidence
  +3 points per selected service at priority 1 (Block 6)
  +2 points per selected service at priority 2
  +1 point  per selected service at priority 3
```

### Eligibility Filter: `getEligiblePractices()`

**Location:** `wizard.js`, line ~295

Practices are **filtered out before scoring** if:
1. **EFG mismatch**: the practice targets different ecosystem types than the user's landscape
2. **Land use mismatch**: no overlap with the user's land uses
3. **Prescreen = `not_currently`**: the relevant pre-screen question was answered negatively

### Result

Practices are **grouped by theme** and within each group **sorted by score descending**. The user can select or deselect individual practices.

---

## 7. Step 3 — Capacity Assessment

### The 6 questions

| Question | What is captured | Stored in |
|---|---|---|
| Q1a | Team types and headcount (A–F) | `step3.team_types` |
| Q1b | Willingness to recruit? | `step3.willingness_recruit` |
| Q2a | Field days per year per team type | `step3.days_by_type` |
| Q2b | Could monitoring time increase? | `step3.willingness_time` |
| Q3a | Available equipment (13 categories) | `step3.equipment_capabilities` |
| Q3b | Willingness to acquire equipment? | `step3.willingness_equipment` |
| Q4 | Annual budget (0 / <€5k / €5–20k / €20–50k / >€50k) | `step3.budget_tier` |
| Q5a | Number of monitoring sites | `step3.site_count_category` |
| Q5b | Distribution of sites | `step3.site_distribution` |
| Q6 | Monthly access (12-month toggle grid) | `step3.access_calendar` |

### Team Type → Protocol Level

| Team type | People | Max protocol level |
|---|---|---|
| A | Land managers / farmers | Level 1 |
| B | Extension officers | Level 1 |
| C | Field technicians / agronomists | Level 2 |
| D | Biologists / ecologists | Level 2 |
| E | Research scientists | Level 3 |
| F | External contracted specialists | Level 3 |

### `computeCapacityProfile()` — Calculating the Capacity Profile

**Location:** `wizard.js`, line ~336

```javascript
max_protocol_level  = highest level achievable by any team type present
available_days_total = sum of field days across all team types
per_site_days        = available_days_total / number of sites
```

Example: Team with Type A (2 people × 15 days) + Type D (1 person × 30 days) = 60 days total across 3 sites → 20 days/site, max protocol level 2.

**Budget warning:** If team types E or F are present and budget = 0 → confirmation dialog (external specialists have costs).

---

## 8. Step 4 — Monitoring Plan

Step 4 runs **fully automatically** after Step 3 is completed. No further user input required. Five operations run in sequence.

### Operation 1 — Group Practices by Theme

**Location:** `wizard.js` (inside the Step 4 render function)

Selected practices are grouped by `theme` and each theme is mapped to a monitoring chain label:

| Practice theme | Monitoring chain |
|---|---|
| Soil Management | Soil recovery and biological function chain |
| Crop System Diversification | Crop system diversity and soil health chain |
| Water Management | Water quality and hydrology chain |
| Livestock and Pasture Management | Grazing management and pasture recovery chain |
| Agroforestry and Tree Integration | Woody cover and landscape connectivity chain |
| ... | ... |

**Constant in wizard.js:** `THEME_TO_CHAIN`, line ~86

### Operation 2 — Select Indicator Groups: `selectIndicatorGroups()`

**Location:** `wizard.js`, line ~356

For each of the 41 indicators, the algorithm checks:
1. **EFG filter**: Does the indicator have EFG codes overlapping with the user's landscape?
2. **Land use filter**: Does the indicator match the user's land uses?
3. **Inclusion logic** (at least one must apply):

| Condition | Priority | Inclusion reason |
|---|---|---|
| Indicator is in `b2_practices_primarily_verified` of a selected practice | 3 (highest) | "B2 primary verifier" |
| Indicator is in `b1_practices_that_benefit` of a selected practice | 2 | "B1 supporting" |
| Indicator's challenges overlap with confirmed challenges | 1 | "Challenge signal" |

Additionally: abiotic indicators with `universal_baseline: true` are **always** included.

### Operation 3 — Assign Protocol Level: `assignProtocol()`

**Location:** `wizard.js`, line ~387

```
Assigned level = min(capacity max_level, highest level available in the profile)

Exception: If level 3 would be assigned + budget_tier = 0 → downgrade to level 2
```

Each indicator then has:
- `assigned_level` (1, 2, or 3)
- `assigned_protocol` (protocol name, e.g. "Earthworm presence count (mustard extraction)")
- `assigned_metric` (what gets measured, e.g. "Earthworms per m²")

### Operation 4 — Capacity Fitting (Trimming)

If too many indicators are planned for the available field days, the lowest-priority groups are trimmed. Priority scoring:

| Criterion | Points |
|---|---|
| B2 linkage to selected practices | +3 per match |
| Challenge signal (top 3 challenges) | +2 per match |
| Service signal (top 3 services) | +1 per match |
| Universal tier | +2 |
| Fast response time (Fast stage) | +1 |

Trimmed groups appear in the output under "Enhancement Recommendations — what becomes possible with additional capacity."

### Operation 5 — Monitoring Calendar: `buildMonitoringCalendar()`

**Location:** `wizard.js`, line ~514

For each indicator, an optimal monitoring window is determined:

1. **Seasonal text** from the indicator profile (`level{N}_seasonal_primary`) is parsed
2. **`parseSeasonalWindow()`** recognises:
   - Explicit month ranges ("May–August")
   - Individual month names
   - Season keywords ("spring", "early autumn", etc.)
3. The result is cross-referenced against the **access calendar** from Step 3
4. Constraints are colour-coded in the calendar output

---

## 9. Where is Each Piece of Logic in wizard.js?

```
wizard.js — Section Overview
─────────────────────────────────────────────────────────────────
Lines    1–  8   ─ File header
Lines    9– 98   ─ CONSTANTS (SITE_COUNT_MIDPOINT, TEAM_PROTOCOL_LEVEL,
                   EQUIPMENT_CATEGORIES, PRESCREEN_LABELS, PRESCREEN_ANSWERS,
                   PRESSURE_LAND_USE_KEYWORDS, THEME_TO_CHAIN, MONTHS)
Lines   99–110   ─ Global variables (practicesData, indicatorsData, etc.)
Lines  111–173   ─ window.assessment object (state definition)
Lines  174–188   ─ loadData() — load JSON files
Lines  189–213   ─ saveState() / loadSavedState() — localStorage
Lines  214–260   ─ STEP 1 ALGORITHMS
                   ├ reduceConfidence()
                   ├ confidenceRank()
                   ├ pressureAreaFraction()   ← area weighting
                   └ prepopulateChallenges()  ← Block 4→5
Lines  261–276   ─ prepopulateServices()     ← Block 5→6
Lines  277–293   ─ scorePractice()           ← Step 2 scoring
Lines  294–334   ─ getEligiblePractices()    ← Step 2 filter
Lines  335–354   ─ computeCapacityProfile()  ← Step 3
Lines  355–401   ─ selectIndicatorGroups()   ← Step 4 Op. 2
                   assignProtocol()          ← Step 4 Op. 3
Lines  402–501   ─ parseSeasonalWindow()     ← calendar parser
                   splitIntoWindows()
Lines  502–600+  ─ buildMonitoringCalendar() ← Step 4 Op. 5
     ...         ─ UI rendering (renderStep1, renderStep2, renderStep3, renderStep4)
     ...         ─ Event handlers (handleNext, handleBack, handleChange)
     ...         ─ Validation functions
     ...         ─ Narrative generation (generateNarrative)
     ...         ─ Initialisation (DOMContentLoaded, loadData, init)
```

### Function Quick Reference

| Function | Step | What it does |
|---|---|---|
| `prepopulateChallenges(pressures, landUseComposition)` | 1 | Block 4→5: derive challenges from pressures |
| `prepopulateServices(challenges)` | 1 | Block 5→6: derive services from challenges |
| `scorePractice(practice, step1)` | 2 | Calculate relevance score for a practice |
| `getEligiblePractices()` | 2 | Filter out practices that don't apply |
| `computeCapacityProfile(step3)` | 3 | Compute capacity profile (max level, days, budget) |
| `selectIndicatorGroups(step1, step2)` | 4 | Which indicators should be included? |
| `assignProtocol(group, cap)` | 4 | Which protocol level should be assigned? |
| `buildMonitoringCalendar(groups, accessCalendar)` | 4 | Build the 12-month monitoring calendar |
| `parseSeasonalWindow(text)` | 4 | Parse free text → array of month indices |
| `generateNarrative(step1, step2, step3, step4)` | 4 | Generate personalised 4-paragraph summary |

---

## 10. End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER INPUTS                                                          │
│                                                                      │
│  Step 1: land uses, EFGs, 28 pressures → confirmed → 35 challenges │
│           35 challenges → confirmed → 37 services                   │
│  Step 2: 4 pre-screen answers                                        │
│  Step 3: team, days, equipment, budget, sites, access calendar      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ALGORITHMS (wizard.js)                                               │
│                                                                      │
│  prepopulateChallenges()  ←── reference.json (pressure_mapping)    │
│  prepopulateServices()    ←── reference.json (challenge_mapping)   │
│                                                                      │
│  getEligiblePractices()   ←── practices.json (43 practices)        │
│  scorePractice()          ←── step1.pressures / challenges / svcs  │
│                                                                      │
│  computeCapacityProfile() ←── step3.team_types / days / budget     │
│                                                                      │
│  selectIndicatorGroups()  ←── indicators.json (41 profiles)        │
│  assignProtocol()         ←── capacity_profile                     │
│  buildMonitoringCalendar()←── abiotic.json + access_calendar       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ OUTPUT (Step 4)                                                       │
│                                                                      │
│  • Personalised narrative (4 paragraphs)                            │
│  • Practice verification chains (grouped by theme)                  │
│  • Biological monitoring programme (indicator / protocol table)     │
│  • Abiotic monitoring programme                                     │
│  • 12-month monitoring calendar                                     │
│  • Enhancement recommendations (trimmed groups with reason)         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 11. How Data is Stored

The tool has **no backend**. Data is stored exclusively in the browser:

### localStorage — Session Persistence

On **every change** (`saveState()`), the complete `window.assessment` object is serialised as JSON to `localStorage`. On the next page load, it is automatically restored.

```javascript
// Save
localStorage.setItem('lahmp_assessment', JSON.stringify(window.assessment));
localStorage.setItem('lahmp_step', String(currentStep));

// Restore
const saved = localStorage.getItem('lahmp_assessment');
if (saved) { /* merge into window.assessment */ }
```

**Note:** localStorage is not permanent storage — it can be cleared by the browser. For real persistence → LAHMP v1 (Laravel backend, planned).

### Test Fixtures — Development Shortcuts

Pre-filled assessments can be loaded via URL parameter:

```
?fixture=TEST-01           → Skoura M'Daz, Morocco (T7.2)
?fixture=TEST-02           → PK-17, Mauritania (T7.5)
?fixture=TEST-03           → Vietnam VSA (T7.1 + F3.3)
?fixture=TEST-01&step=4    → Jump directly to Step 4 output
```

The fixture files are in `data/test_fixtures/` as complete `assessment` objects.

---

## 12. Export Scripts (Python)

The JSON files in `data/` are **never edited directly**. Instead:

1. Edit the Excel file in `raw/`
2. Run the Python script → JSON is regenerated

### `export/convert.py`

```bash
pip install pandas openpyxl
python export/convert.py
```

Reads:
- `raw/LAHMP_Practice_Matrix.xlsx` → `data/practices.json`
- `raw/LAHMP_Indicator_Linkage_Matrix_Populated.xlsx` → `data/indicators.json`
- `raw/LAHMP_Abiotic_Reference_Table.xlsx` → `data/abiotic.json`

### `export/extract_indicators.py`

```bash
pip install python-docx requests
python export/extract_indicators.py
```

Reads all `.docx` files from `indicators/` and writes detailed protocol content into `data/indicators.json`.

**3-tier file resolution:**
1. First `indicators/` (tracked in the repository)
2. Then `indicators_dl/` (local cache, not tracked)
3. Then downloads from GitHub

---

## Quick Reference: "What do I do when..."

### ...I want to find a bug in a recommendation?
→ Logic is in `wizard.js`: `scorePractice()` (line ~278), `getEligiblePractices()` (line ~295)

### ...I want to add or update an indicator?
→ Edit `raw/LAHMP_Indicator_Linkage_Matrix_Populated.xlsx` → `python export/convert.py`

### ...I want to understand why challenge X was pre-selected?
→ Check `reference.json` → `pressure_to_challenge_mapping`; logic in `prepopulateChallenges()` (line ~238)

### ...I want to debug the monitoring calendar?
→ `parseSeasonalWindow()` (line ~431), `buildMonitoringCalendar()` (line ~514)

### ...I want to add a new practice?
→ Edit `raw/LAHMP_Practice_Matrix.xlsx` → `python export/convert.py` → `data/practices.json` is regenerated

### ...I want to test the tool locally?
→ Start a local HTTP server (the Fetch API requires HTTP, not `file://`):
```bash
python -m http.server 8080
# Then open: http://localhost:8080/?fixture=TEST-01
```
