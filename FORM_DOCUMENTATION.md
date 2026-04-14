# LAHMP Wizard — Form Documentation

Complete reference for every user-facing input form in the wizard. Each entry follows the structure:
**Purpose** · **How to fill it out** · **What happens next**

---

## Step 1 — Landscape Profile

Step 1 collects the context of your landscape: where it is, what land systems are present, what pressures are active, and which land health challenges and ecosystem services matter most. The information entered here drives all subsequent recommendations and output.

---

### Block 1 — Location

**Purpose**
Establishes the identity of the landscape and the monitoring programme. This information appears throughout the monitoring plan output and is used to personalise narrative text.

**How to fill it out**

| Field | What to enter |
|---|---|
| Landscape name | The recognised local or project name for the landscape unit being assessed (e.g. "Skoura M'Daz", "PK-17 Rangeland Site"). This name will appear in the monitoring plan header and document title. |
| Country | The country in which the landscape is located. |
| Administrative region | The province, region, or administrative division (optional but recommended — used for geographic context in narrative output). |
| Monitoring programme name | The formal name of the monitoring initiative, if one exists (e.g. "IUCN LHMF Pilot — Skoura Oasis Agropastoral System"). If no programme name exists yet, leave blank or enter a working title. |

**What happens next**
The landscape name immediately updates the browser tab title and the header bar for the duration of the session. The country and region appear in the Step 4 personalised narrative. All four fields are saved automatically to the session.

---

### Block 1.2 — Land System

**Purpose**
Characterises the physical and ecological composition of the landscape. These three dimensions — total area, IPCC land use categories, and Global Ecosystem Functional Groups (EFGs) — control which practices and indicators are eligible for recommendation in Steps 2 and 4. Soil types provide additional context for indicator selection.

**How to fill it out**

**Total area (hectares)**
Enter the approximate total area of the landscape unit being monitored. If the boundary is not precisely defined, use a best estimate. This value is used to contextualise land use proportions and scale recommendations.

**IPCC Land Use Categories**
Check all categories that are present within the landscape boundary. These are broad FAO/IPCC classifications. Select all that apply — most landscapes contain two or more. Examples:
- *Intensive Annual Cropland* — regular monoculture or simplified rotation cereal/vegetable production
- *Grassland and Pasture* — permanent pasture, communal rangeland, hay meadows
- *Mixed Crop-Livestock System* — integrated crop and grazing, seasonal rotation between arable and pasture
- *Agroforestry* — trees systematically combined with crops or livestock
- *Wetland* — seasonal or permanent flooding, paddy systems, floodplain

**Global Ecosystem Functional Groups (EFGs)**
Select all EFG codes that describe ecosystem types present in the landscape. EFGs are the IUCN Global Ecosystem Typology codes used by the LAHMP framework to classify ecosystems by structure and function. The selector is organised by realm (Terrestrial, Freshwater, etc.); agricultural land-use realms are expanded by default. The most commonly relevant codes for agricultural landscapes are:

| Code | Name | Typical context |
|---|---|---|
| T7.1 | Annual croplands | Intensively cultivated annual crop systems |
| T7.2 | Sown pastures and fields | Improved or sown grasslands, pastoral systems |
| T7.3 | Plantations | Tree crop monocultures (oil palm, timber, fruit) |
| T7.4 | Urban and industrial ecosystems | (rarely selected in agricultural landscapes) |
| T7.5 | Derived semi-natural pastures and old fields | Degraded or rangeland grasslands, Sahelian pastures |
| F3.3 | Rice paddies | Flooded rice cultivation |

If multiple EFG types co-occur in the landscape (e.g. T7.1 cropland and T7.5 degraded pasture), select all of them.

**Soil types**
Check all soil types identified in the landscape. These are IPCC soil classification categories. Soil type selection improves the relevance of indicator recommendations (some biological indicators respond differently across soil types). If soil survey data are not available, leave this blank.

**What happens next**
IPCC land use categories and EFG codes are used in two places:
1. In Step 2, practices are filtered by EFG relevance and primary land use applicability — only practices relevant to your ecosystem types are shown.
2. In Step 4, indicator profiles are filtered by EFG and IPCC land use — only indicators relevant to your landscape type are included in the monitoring plan.

---

### Block 1.3 — Landscape Description

**Purpose**
Captures free-text context about the landscape's history, current state, and monitoring objectives. This is a qualitative supplement to the structured fields above — it helps reviewers and future users understand the landscape without having to infer everything from checkboxes.

**How to fill it out**
Write a short paragraph (3–10 sentences) describing:
- What the landscape is (location, dominant vegetation or land use, scale)
- What challenges or degradation are visible
- Any relevant history (past land use changes, restoration interventions, drought, fire, etc.)
- The purpose or context of the monitoring programme

There is no minimum or maximum length. The description is not processed algorithmically — it appears as contextual background in the monitoring plan output.

**What happens next**
The description is saved to the session record and reproduced verbatim in the monitoring plan document as contextual background text.

---

### Block 2 — Land Uses Present

**Purpose**
Identifies the active land uses within the landscape. This is distinct from the IPCC categories in Block 1.2, which describe ecosystem type at a broad classification level. Block 2 captures more specific, practice-relevant land use designations — the categories used by the practice recommendation algorithm to determine which practices are applicable.

**How to fill it out**
Use the tag-picker search field to find and select all land uses present. Type a keyword (e.g. "grassland", "crop", "forest") to filter the list. Click to add a land use; click the × on a tag to remove it. Select all land uses that occupy a meaningful portion of the landscape.

Examples of land use entries:
- Permanent grassland / pasture / rangeland
- Mixed crop–livestock systems
- Agroforestry or silvopastoral systems
- Natural or semi-natural grassland, savanna or shrub-steppe
- Intensive annual cropland
- Irrigated cropland

**What happens next**
Land uses selected here populate the rows of the composition table in Block 3.3. They also directly control practice eligibility filtering in Step 2: practices whose applicability lists have no overlap with the land uses entered here will not appear in recommendations.

---

### Block 3 — Agricultural Context

Block 3 has three sub-sections, all of which can be left partially complete if the information is not available.

---

#### Block 3.1 — Crops Grown

**Purpose**
Records the crops present in the landscape. Crop information refines indicator selection in Step 4 (some indicators are linked to specific crop associations) and contributes to the completeness of the landscape profile.

**How to fill it out**
Use the tag-picker to search and select crops from the reference list. Type the common name or part of the botanical name. If no crops are grown (pure pastoral or rangeland landscape), leave this blank.

**What happens next**
Crop selections are stored in the assessment record. They are used in Step 4 as a secondary filter on biological indicator profiles that specify crop or livestock associations (e.g. pollinators linked to flowering crop systems, earthworm profiles linked to cereal systems).

---

#### Block 3.2 — Livestock Present

**Purpose**
Records the livestock categories present in the landscape. Livestock information enables conditionality checks in Step 4 — several indicator profiles (dung beetles, soil macrofauna, bat monitoring) are conditionally included only when livestock are present.

**How to fill it out**
Use the tag-picker to search and select livestock categories. Common entries include: Cattle, Sheep, Goats, Camels, Pigs, Poultry, Horses/Donkeys. If no livestock are present, leave this blank.

**What happens next**
In Step 4, indicators with a conditionality requirement such as "livestock/dung present" are only included if at least one livestock category has been selected here.

---

#### Block 3.3 — Land Use Composition (%)

**Purpose**
Assigns approximate area percentages to each land use entered in Block 2. This allows the algorithm to apply area weighting when pre-populating challenges from pressures: if a pressure is primarily relevant to cropland but cropland covers less than 10% of the landscape, the associated challenges are given lower confidence.

**How to fill it out**
A table is automatically generated from the land uses selected in Block 2. For each row, enter the approximate percentage of the total landscape area occupied by that land use. Percentages should sum to approximately 100%; the running total is displayed below the table. Exact values are not required — estimates are sufficient.

If Block 2 is empty, this table will not appear. Complete Block 2 first.

**What happens next**
The percentage values are used in the pressure-to-challenge pre-population logic (Block 4 → Block 5). A pressure whose relevant land use category covers less than 10% of the landscape triggers a one-level confidence reduction in the challenges it maps to.

---

### Block 4 — Pressures

**Purpose**
Systematically records which degradation pressures are active, past, or uncertain in the landscape. This is the primary driver of the Block 5 challenge pre-population: the platform uses a curated mapping table to translate confirmed pressures into a pre-selected set of land health challenges, weighted by pressure status and land use coverage.

**How to fill it out**
For each of the 28 pressures, select the status that best describes its current relevance to your landscape:

| Status | Meaning |
|---|---|
| **Ongoing** | The pressure is currently active and contributing to degradation. |
| **Past** | The pressure was active previously but has since been reduced or ceased. Its legacy effects may still be present. |
| **Not sure** | There is uncertainty about whether the pressure is active — it may be occurring at low levels or intermittently. |
| **Not relevant** | The pressure does not apply to this landscape or land use system. |

Pressures are grouped by category (e.g. Tillage and Soil Disturbance, Grazing and Biomass Removal, Landscape and Land-Use Change). Review all groups even if most pressures in a group are not relevant. "Not relevant" is the default; you are confirming absence as much as presence.

**What happens next**
As soon as a pressure is changed from "Not relevant" to any other status, the platform immediately recalculates the challenge pre-population in Block 5 and updates the subtitle to show the number of pre-filled challenges. Block 5 will flash green to indicate it has been updated.

The confidence weight applied to each linked challenge depends on pressure status:
- **Ongoing** → applies the full confidence from the mapping table (high/medium/low)
- **Past** or **Not sure** → confidence is reduced by one level (high→medium, medium→low, low→not selected)
- Area weighting applies additionally: if the relevant land use covers less than 10% of the landscape, confidence is reduced by a further level.

---

### Block 5 — Challenges

**Purpose**
Identifies which land health challenges apply to the landscape and at what confidence level. The challenge list bridges the diagnostic (Block 4 pressures) to the prescriptive (Step 2 practices and Step 4 indicators): practices and indicators are linked to specific challenge IDs, so the confirmed challenge set directly shapes what is recommended.

**How to fill it out**
Block 5 shows up to 35 land health challenges, organised by category (Soil Health, Water, Biodiversity, etc.). Challenges pre-filled from Block 4 are highlighted with a "Pre-filled" badge and a confidence level badge (High / Medium / Low).

**For pre-filled challenges:** Check the box to confirm that the challenge applies to your landscape. Uncheck to reject it. The confidence level shown reflects the platform's inferred assessment based on your pressure responses — you can confirm it even if you would characterise the severity differently.

**For challenges not pre-filled:** Any challenge in the list can be added manually by checking its box. This is appropriate when a challenge exists but was not triggered by the pressure mapping (e.g. a recent localised pollution event that was not captured in Block 4).

Review all groups before proceeding, even if most challenges are pre-filled. Some challenges in the list may not be pre-populated but are still relevant to your landscape.

**What happens next**
Confirmed challenges (checked boxes) trigger service pre-population in Block 6. Block 6 will update immediately after each change and flash green to indicate the update. In Step 2, practice relevance scores are partly calculated from challenge matches — practices addressing your confirmed challenges score higher. In Step 4, indicator groups are selected partly on the basis of challenge linkages.

---

### Block 6 — Ecosystem Services

**Purpose**
Records which ecosystem services the monitoring programme should track and prioritises the three services that matter most. Priority ranking directly increases the relevance scores of practices (and therefore the visibility of those practices in Step 2 recommendations) linked to those services.

**How to fill it out**
Block 6 shows up to 37 ecosystem services, pre-filtered based on confirmed challenges from Block 5. Services pre-filled from challenges are highlighted with a "Pre-filled" badge.

**Selecting services:** Check the box next to each service you want to monitor or that is important to the landscape. You may select as many as relevant. Unchecked services are excluded from practice scoring and narrative output.

**Setting priority ranks:** For your three most important services, assign a priority rank using the dropdown (1 = highest priority, 2 = second, 3 = third). Priority rank affects practice scoring:
- Rank 1 service: +3 points to practices that address it
- Rank 2 service: +2 points
- Rank 3 service: +1 point

Assign each rank to only one service. The form does not enforce uniqueness — if the same rank is assigned to multiple services, they will each receive the corresponding points, which increases scores for all practices linked to those services equally.

**What happens next**
The top three prioritised services appear in the Step 4 narrative paragraph. Services also appear in the monitoring plan output as context for why specific practices and indicators were selected.

---

## Step 2 — Practice Selection

Step 2 presents a filtered and scored set of sustainable land management practices relevant to your landscape. You review the recommendations and confirm which practices you are implementing or plan to implement.

---

### Block 2.0 — Pre-Screen

**Purpose**
Establishes whether four broad categories of transformative practice — tree integration, livestock integration, land set-aside, and input reduction — are feasible at this landscape. "Transformative" practices in these categories are only shown as recommendations if the relevant pre-screen question is answered as open or conditionally open. This prevents the platform from recommending practices that are not contextually feasible.

**How to fill it out**
Answer all four questions honestly, reflecting actual constraints on the ground. Each question has three options:

| Option | Meaning |
|---|---|
| **Yes — open to this now** | This type of change is actively being considered or is already underway. Transformative practices in this category will be shown normally. |
| **Yes — open in the longer term / conditionally** | This type of change may be possible in future or under specific conditions (e.g. tenure, market, or climate improvements). Transformative practices will be shown with a longer-term framing. |
| **Not currently possible** | Structural, tenure, economic, or cultural constraints make this type of change infeasible. Transformative practices in this category will be hidden from the recommendations. |

**Q1 — Trees:** Governs agroforestry, hedgerow planting, windbreaks, and silvopastoral practices.
**Q2 — Livestock integration:** Governs rotational grazing, mixed farming, and pasture restoration practices.
**Q3 — Land set-aside:** Governs habitat creation, wildflower margins, buffer strips, and fallow practices.
**Q4 — Input reduction:** Governs reduction of synthetic fertilisers, pesticides, and herbicides.

**What happens next**
Changing any answer immediately re-renders the Block 2.1 practice list. Practices governed by a "not currently possible" response are removed from the list. Changing from "not currently possible" to "open" will add those practices back.

---

### Block 2.1 — Practice Recommendations

**Purpose**
Presents the full set of eligible practices — filtered by your landscape context and pre-screen answers, scored by relevance to your pressures, challenges, and ecosystem services — for you to review and confirm. The confirmed selection becomes the basis for the monitoring plan in Step 4.

**How to read the practice cards**
Each practice card shows:
- **Practice code** (P01–P43) and **name**
- **Tier badge**: *Standard* (broadly applicable, lower implementation barrier) or *Transformative* (higher impact but more change required)
- **Scale badge**: Field, Farm, or Landscape — the primary scale at which monitoring occurs
- **Relevance score** (▲ N): total relevance points calculated from your Step 1 data. Hover over the score to see the breakdown (Pressure points + Challenge points + Service points). Practices with score 0 are still eligible but have no direct linkage to your identified pressures, challenges, or services.
- **Rationale**: A brief statement explaining why this practice is recommended.
- **Field guidance** (expandable): Additional guidance including implementation constraints, field observation checklist, evidence of correct implementation, evidence of non-implementation, TAPE framework alignment, and IUCN NBS approach code badges.

Practices are grouped by theme (e.g. Soil Management, Water Management, Livestock and Pasture Management). Within each theme, practices are sorted by relevance score (highest first), then alphabetically for equal scores.

**How to fill it out**
Check the box on each practice card you are implementing or plan to implement. You can select as many as relevant. There is no minimum or maximum; however, selecting no practices will result in an empty monitoring plan in Step 4.

Practices with a score of 0 are shown at the bottom of each theme group — they are eligible for your landscape type but are not directly linked to any of your confirmed pressures, challenges, or priority services. You can still select them if they are relevant.

**What happens next**
Each checked practice is added to `step2.selected_practices`. The selection count updates in real time. In Step 4, the selected practices drive:
1. Which indicator groups appear in the monitoring plan (B2 primary verifiers and B1 supporting indicators)
2. Which abiotic indicators are selected
3. How indicator groups are grouped into monitoring chains by theme
4. The narrative text describing which practices and themes are being monitored

---

## Step 3 — Capacity Assessment

Step 3 characterises the monitoring team's human resources, time, equipment, budget, and site constraints. The answers are used to compute a capacity profile that determines which protocol level (1, 2, or 3) can be assigned to each indicator group, and which groups must be deferred if total monitoring demand exceeds available capacity.

---

### Q1a — Monitoring Team Composition

**Purpose**
Records the types and number of people who will carry out monitoring. Team type determines the maximum protocol level achievable. Protocol Level 1 (community observer) requires no specialist training; Level 2 (technician) requires field biology or agronomy skills; Level 3 (research) requires scientific training or specialist contractors.

**How to fill it out**
Check the box next to each team type that will participate in monitoring. For each checked type, enter the number of people of that type. Team types are:

| Code | Type | Protocol level |
|---|---|---|
| A | Land managers / farmers | Level 1 |
| B | Extension officers | Level 1 |
| C | Field technicians / agronomists | Level 2 |
| D | Biologists / ecologists | Level 2 |
| E | Research scientists | Level 3 |
| F | External contracted specialists | Level 3 |

If the same individual has qualifications in multiple types, count them under the highest applicable type. The platform uses the highest protocol level achievable across all checked types to set the overall ceiling for the monitoring plan.

**What happens next**
The team composition is used in two ways: (1) the maximum protocol level for the plan is set from the highest-level team type checked; (2) the total available days is calculated from Q2a inputs. If the team includes only Types A and B, all indicators will be assigned Level 1 protocols. If Type D, E, or F is included, Level 2 or 3 protocols become available.

---

### Q1b — Willingness to Recruit Additional Capacity

**Purpose**
Records whether the organisation is open to expanding the team, and if so, in which roles. This informs the capacity profile's willingness flags and is referenced in the monitoring plan narrative.

**How to fill it out**
Select one option:
- **Yes — any role**: Willing to recruit any additional team member types needed.
- **Yes — specific roles**: Willing to recruit, but only specific roles. A text field appears — describe which roles (e.g. "Field technician (Type C) for soil sampling").
- **No**: No capacity expansion is possible.

**What happens next**
The willingness to recruit flag is stored in the capacity profile. It does not directly change the protocol assignment or indicator selection in the prototype, but appears as context in enhancement recommendations when higher-level protocols have been deferred due to team type constraints.

---

### Q2a — Field Days Per Year

**Purpose**
Quantifies how much time each team type can dedicate to field monitoring per year. This is used to calculate total available monitoring days and per-site days, which are compared against estimated monitoring demand to determine whether the full indicator set fits within capacity.

**How to fill it out**
A table is automatically generated showing only the team types checked in Q1a. For each type, enter the total number of days per year that team members of that type can contribute to monitoring fieldwork (not including travel, data entry, or report writing).

Enter per-person days if numbers vary significantly; enter a combined total if the team works as a unit. The platform sums all entries across all types to produce a total available days figure.

If you are unsure, use the following rough benchmarks:
- A land manager who monitors one day per month: ~12 days/year
- A field technician on a dedicated monitoring project: 20–60 days/year
- A research scientist conducting intensive biodiversity surveys: 30–100 days/year

**What happens next**
Total available days ÷ number of monitoring sites = per-site days. This value is used in Step 4 Operation 4 (capacity fitting) to determine whether the full set of selected indicator groups can be accommodated. If total estimated monitoring demand exceeds available days, the lowest-priority indicator groups are deferred to the Enhancement Recommendations section.

---

### Q2b — Willingness to Extend Monitoring Time

**Purpose**
Records whether monitoring time could be increased if needed. This informs the willingness flags in the capacity profile and is referenced in enhancement recommendations.

**How to fill it out**
Select one option:
- **Yes, significantly**: Time could be substantially increased — additional survey days, longer field seasons, additional personnel time.
- **Yes, modestly**: A moderate increase is possible (e.g. a few extra days per year or occasional additional trips).
- **No**: No increase is possible given current commitments.

**What happens next**
Stored in the willingness profile. Used as context in enhancement recommendations when groups have been trimmed due to time constraints.

---

### Q3a — Equipment and Analytical Capabilities

**Purpose**
Records which equipment and laboratory facilities the team has access to. Equipment availability is used to check whether higher-level protocols (Level 2 or 3) that require specific instruments can actually be carried out. If required equipment is not available, the protocol is downgraded to the highest level achievable with available equipment.

**How to fill it out**
Check all equipment categories that the team has access to or can reliably access through partners or shared facilities:

| Equipment or capability | Relevant for |
|---|---|
| Basic field kit (tape measure, compass, stakes, clipboard) | Level 1 protocols universally |
| Soil sampling tools (auger, bulk density cores, trowel) | Soil physical and chemical indicators |
| Water quality meters (pH, EC, dissolved oxygen) | Water quality indicators |
| Camera / photo-documentation (DSLR or smartphone with macro) | Visual monitoring protocols |
| GPS / GIS device or smartphone with mapping app | Site location and spatial monitoring |
| Insect sampling equipment (sweep nets, pitfall traps, Malaise trap) | Invertebrate indicators |
| Bioacoustic recorder (bat detector, bird / frog recorder) | Bat and acoustic biodiversity indicators |
| eDNA sampling kit (filters, sterile containers, field kit) | eDNA-based biodiversity protocols |
| Soil laboratory access (pH, texture, bulk density, SOC) | Abiotic soil indicators at Level 2 |
| Molecular laboratory access (PCR, sequencing, PLFA/NLFA) | Microbial and eDNA Level 3 protocols |
| Microscopy (light or compound microscope) | Nematode and micro-invertebrate Level 3 protocols |
| Spectrophotometer or colorimeter (nutrient analysis) | Nutrient chemistry Level 3 protocols |
| Access to external analytical laboratory (contract services) | Outsourced specialist analyses |

Do not check equipment that requires significant new procurement — that is captured in Q3b. Only check equipment currently accessible.

**What happens next**
The equipment list is cross-referenced against the equipment requirements of each indicator protocol in Step 4. If a Level 2 or 3 protocol requires equipment not available, the assigned protocol level is downgraded to the highest level where all required equipment is available.

---

### Q3b — Willingness to Acquire Additional Equipment

**Purpose**
Records whether the team could acquire equipment they do not currently have. Used in enhancement recommendations.

**How to fill it out**
Select one option:
- **Yes — any equipment**: Open to purchasing or sourcing any equipment required.
- **Yes — specific items**: Open to acquiring specific equipment only (record which items in your programme notes).
- **No**: No new equipment can be acquired.

**What happens next**
Stored in the willingness profile. Referenced in enhancement recommendations when higher-level protocols have been downgraded due to missing equipment.

---

### Q4 — Annual Budget for External Analytical Services

**Purpose**
Records the approximate annual budget available for external analytical services — laboratory analyses, specialist surveys, or contracted fieldwork. Budget tier is used to prevent Level 3 protocols (which typically require laboratory processing) from being assigned when no external budget exists.

**How to fill it out**
Select the budget tier that best reflects annual spending available for external analytical services (not including team salaries or travel):

| Tier | Range |
|---|---|
| 0 | No external budget |
| 1 | Less than €5,000 per year |
| 2 | €5,000 – €20,000 per year |
| 3 | €20,000 – €50,000 per year |
| 4 | More than €50,000 per year |

If the currency is not Euro, select the tier closest to the equivalent in local terms. This is an order-of-magnitude input, not a precise budget figure.

**What happens next**
If Budget Tier 0 is selected, any Level 3 protocol that requires laboratory processing is automatically downgraded to Level 2 in Step 4. A warning is also shown if the team includes research-level staff (Types E or F) who imply laboratory costs, but the budget tier is 0 — this combination warrants attention before proceeding.

---

### Q5a — Number of Monitoring Sites

**Purpose**
Records how many distinct monitoring sites are included in the programme. Site count is used to calculate per-site monitoring days (total available days ÷ site count), which is the primary unit for capacity fitting in Step 4.

**How to fill it out**
Select the category that best matches the number of sites:

| Option | Typical midpoint used internally |
|---|---|
| 1 site | 1 |
| 2–5 sites | 3 |
| 6–20 sites | 13 |
| 21–100 sites | 60 |
| More than 100 sites | 100 |

A "monitoring site" is a fixed location where biological and abiotic samples are collected consistently across survey visits. Select the category for sites already established or firmly planned — do not include aspirational future sites.

**What happens next**
The midpoint of the selected category is used as the denominator in the per-site days calculation. For example, selecting "6–20 sites" with 25 total available days yields ~1.9 days per site, which is a tight capacity and will likely result in some indicator groups being deferred.

---

### Q5b — Site Distribution

**Purpose**
Records how the monitoring sites are distributed geographically. This contextual information appears in the capacity profile and is used to inform logistics assumptions in the narrative.

**How to fill it out**
Select the option that best describes your site network:
- **All in one landscape**: All sites are within a single contiguous landscape unit or farm (travel between sites is minimal).
- **Across one region**: Sites are distributed across a broader region (same administrative area, up to ~100 km range).
- **Across multiple regions**: Sites span multiple regions, countries, or widely separated areas (significant travel between sites).

**What happens next**
Stored in the capacity profile. Wider distribution may imply proportionally more travel time and less actual monitoring time per day — this is noted in enhancement recommendations when capacity is tight.

---

### Q6 — Seasonal Access Calendar

**Purpose**
Records which months have constrained or uncertain field access. The calendar is used in Step 4 Operation 5 to build the monitoring calendar: each indicator group is assigned a monitoring window that avoids constrained months wherever possible.

**How to fill it out**
For each of the 12 months, select one status:
- **OK** (green): Field access is reliable during this month. Normal monitoring activities can proceed.
- **Limited** (amber): Field access is possible but constrained — due to extreme weather, seasonal flooding, high agricultural workload, or other factors. Monitoring may be possible with reduced scope or earlier/later in the day.
- **Unknown** (grey): Access status in this month is not yet known (applicable for new programmes or sites not yet visited in all seasons).

When "Limited" is selected for a month, a reason field appears — use this to briefly note the constraint (e.g. "Extreme heat — fieldwork unsafe after 10am", "Rainy season — road access unreliable").

By default, all months are set to OK. Only change months where access is genuinely constrained or uncertain.

**What happens next**
The access calendar is overlaid against indicator seasonal windows in Step 4 to determine the best monitoring periods. If an indicator's primary monitoring window falls in constrained months, the platform attempts to use a secondary window. If both primary and secondary windows are constrained, the indicator is still included but flagged with a note to schedule on a case-by-case basis.

---

*This documentation covers all user-facing input forms in Steps 1, 2, and 3 of the LAHMP Wizard. Step 4 (Monitoring Plan) has no user input forms — it is a read-only output generated automatically from Steps 1–3.*
