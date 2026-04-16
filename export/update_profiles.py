"""
Update indicators.json:
- Profiles 37/38: extract full protocol content + propose A1/A2/B1/B2/A4 from analogues
- Profiles 14/19/22/23: add missing B1 + B2 direction text from analogues
"""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

VAL_LINK  = "DRAFT - Linkages proposed by system from analogous profiles, requires expert validation"

with open('data/indicators.json', encoding='utf-8') as f:
    data = json.load(f)

idx = {ind['profile_number']: ind for ind in data}

# ── Profile 37 — Termites ─────────────────────────────────────────────────
# Analogues: Earthworms (#06) A1=[1,2,3,4,9,10,13,14] A2=[21,2,7,4,1]
#            Ants (#08)       A1=[1,2,4,18,20]         A2=[21,7,19]
# Proposed: A1 = pressures common to soil macrofauna + vegetation-removal + land-use-change
#           A2 = soil structure/OM/nutrient/biodiversity challenges from Earthworms
t37 = idx[37]
t37.update({
    "block4_pressures": [1, 2, 4, 19, 20, 22],
    "block5_challenges": [1, 2, 4, 7, 21],
    "block6_services": [15, 11],
    "relevant_efgs": ["T7.1", "T7.2", "T7.5"],
    "b1_practices_that_benefit": ["P01", "P08", "P13", "P19"],
    "b2_practices_primarily_verified": ["P08", "P01"],
    "b2_expected_direction_of_change": (
        "P08: Increase in active mound density and colony activity following agroforestry "
        "canopy establishment and litter accumulation. "
        "P01: Recovery of termite colony density under no-till; mound restoration within "
        "2-5 seasons of tillage cessation."
    ),
    "level1_protocol_name": "Termite mound count transect and activity assessment",
    "level1_output_metric": (
        "Active mound density (mounds per hectare per mound type); activity score per mound; "
        "proportion of mound types (fungus-grower, grass-harvester, wood-feeder where distinguishable)"
    ),
    "level1_seasonal_primary": (
        "Wet season peak or immediately post-rainy season - when colony activity is highest "
        "and foraging galleries are visible. Avoid mid-dry season when surface activity may be suppressed."
    ),
    "level1_seasonal_secondary": None,
    "level1_equipment": (
        "Field datasheet; tape measure; camera; sturdy boot for gentle surface tap to confirm "
        "colony activity (audio response). Regional mound type ID guide if available."
    ),
    "level1_reference": "Eggleton P et al. (2002) - see References.",
    "level1_reference_link": None,
    "level2_protocol_name": (
        "Transect mound count with pitfall traps and soil core extraction for functional group assessment"
    ),
    "level2_output_metric": (
        "Termite species/morphospecies richness; functional group proportions (fungus-growers, "
        "grass-harvesters, wood-feeders, soil-feeders); biomass estimate per group; colony density index"
    ),
    "level2_seasonal_primary": (
        "Wet season peak - same as Level 1. Pitfall traps require deployment during active "
        "foraging period; minimum 48-hour deployment."
    ),
    "level2_seasonal_secondary": None,
    "level2_equipment": (
        "Pitfall traps; soil coring equipment; regional termite identification key (soldier head "
        "morphology); 70% ethanol collection vials; white sorting tray; field datasheet."
    ),
    "level2_reference": "Eggleton P et al. (2002); Jouquet P et al. (2011) Soil Biol. Biochem. - see References.",
    "level2_reference_link": None,
    "level3_protocol_name": (
        "Full termite community assessment with molecular species identification and service quantification"
    ),
    "level3_output_metric": (
        "Full species list; functional group ecosystem service rates (infiltration improvement factor; "
        "N-fixation rate proxy; organic matter decomposition index); colony density by species"
    ),
    "level3_seasonal_primary": (
        "Wet season - as Levels 1 and 2. Multiple seasonal visits required for full functional "
        "group turnover capture."
    ),
    "level3_seasonal_secondary": None,
    "level3_equipment": (
        "As Level 2 plus: molecular laboratory access (DNA barcoding COI/16S); infiltration ring "
        "and water source for service quantification; balance for biomass estimation."
    ),
    "level3_reference": (
        "Eggleton P et al. (2002); Jouquet P et al. (2011); Bignell DE et al. (2011) "
        "Biology of Termites - see References."
    ),
    "level3_reference_link": None,
    "primary_reference": "Eggleton P et al. (2002); Jouquet P et al. (2011) Soil Biol. Biochem.",
    "populated": "draft",
    "validation_status": VAL_LINK,
})
print("Updated #37 Termites -> populated: draft")

# ── Profile 38 — Freshwater Turtles ──────────────────────────────────────
# Analogues: Aquatic macroinvertebrates (#17) A1=[17,3,1,16,15,4] A2=[17,13,14,16]
#            Fish (#18)                       A1=[17,16,15,18,4]  A2=[17,13,11]
# Proposed: A1 = aquatic analogue pressures + invasive species
#           A2 = macroinvertebrate challenges (long-lived aquatic organism)
t38 = idx[38]
t38.update({
    "block4_pressures": [17, 16, 15, 18, 4, 21],
    "block5_challenges": [17, 13, 14, 16],
    "block6_services": [19, 6],
    "relevant_efgs": ["T7.1", "T7.2", "T7.5", "F3.3"],
    "b1_practices_that_benefit": ["P13", "P16", "P17", "P19"],
    "b2_practices_primarily_verified": ["P13", "P16"],
    "b2_expected_direction_of_change": (
        "P13: Increase in basking population index and juvenile recruitment following riparian "
        "buffer strip establishment and reduced bank erosion. "
        "P16: Increase in CPUE and size-class diversity following wetland and water body management."
    ),
    "level1_protocol_name": "Freshwater turtle basking count survey - community observer population index",
    "level1_output_metric": (
        "Maximum basking count per survey; size class proportions (juvenile/sub-adult/adult); "
        "species list; basking site occupancy ratio (sites occupied / total counted)"
    ),
    "level1_seasonal_primary": (
        "Warm season - when turtles are most active and basking most frequently. "
        "In tropical contexts: dry season when water bodies contract and turtles concentrate. "
        "In temperate contexts: late spring to early autumn (April-October)."
    ),
    "level1_seasonal_secondary": None,
    "level1_equipment": (
        "Binoculars (10x); field datasheet; camera with zoom lens; photographic turtle "
        "identification guide (regional); GPS or sketch map of water body."
    ),
    "level1_reference": (
        "IUCN Freshwater Turtle and Tortoise Specialist Group survey guidelines (regional editions); "
        "Platt SG et al. (2001) basking count methodology."
    ),
    "level1_reference_link": None,
    "level2_protocol_name": "Hoop trap survey - quantitative turtle abundance and population structure assessment",
    "level2_output_metric": (
        "Capture per unit effort (CPUE); size class proportions; male:female ratio; "
        "species composition; mean mass by size class."
    ),
    "level2_seasonal_primary": (
        "Warm season - when turtles are most active and trapping efficiency is highest. "
        "Morning trap checks essential for welfare (prevent drowning)."
    ),
    "level2_seasonal_secondary": None,
    "level2_equipment": (
        "Floating hoop traps with float collar (critical welfare requirement); sardine bait; "
        "measuring tape; spring balance; callipers for carapace measurement; field datasheet; camera."
    ),
    "level2_reference": "Gibbons JW & Semlitsch RD (1982) hoop trap methodology; IUCN Freshwater Turtle survey guidelines.",
    "level2_reference_link": None,
    "level3_protocol_name": "Mark-recapture population estimation with PIT tagging and eDNA",
    "level3_output_metric": (
        "Population size estimate (Jolly-Seber) with 95% CI; survival probability; "
        "eDNA concentration (copies/L); nest site count and success rate."
    ),
    "level3_seasonal_primary": (
        "Warm season. Multiple trapping sessions across season for robust mark-recapture. "
        "eDNA sampling in early warm season for optimal detection."
    ),
    "level3_seasonal_secondary": None,
    "level3_equipment": (
        "As Level 2 plus: PIT tag applicator and tags; eDNA sampling kit "
        "(sterile 1L bottles, 0.45um filters, field preservation buffer); molecular laboratory access."
    ),
    "level3_reference": (
        "Caswell H (2001) mark-recapture methodology; "
        "Thomsen PF et al. (2012) eDNA methodology - see References."
    ),
    "level3_reference_link": None,
    "primary_reference": (
        "IUCN Freshwater Turtle and Tortoise Specialist Group survey guidelines; "
        "Gibbons JW & Semlitsch RD (1982)"
    ),
    "populated": "draft",
    "validation_status": VAL_LINK,
})
print("Updated #38 Freshwater Turtles -> populated: draft")

# ── Profiles 14, 19, 22, 23 — add B1 + B2 direction ─────────────────────
# Profile 14 Hoverflies -> analogue #13 Wild Bees B1=[P23, P20, P02]
t14 = idx[14]
t14["b1_practices_that_benefit"] = ["P23", "P20", "P11"]
if not t14.get("relevant_efgs"):
    t14["relevant_efgs"] = ["T7.1", "T7.2", "T7.3", "T7.5"]
t14["b2_expected_direction_of_change"] = (
    "P23: Increase in hoverfly flower-visitor count at flowering strips within 1-2 seasons "
    "of establishment; guild shift toward aphidophagous species. "
    "P14: Increase in hoverfly abundance and morphotype richness at uncut field margin areas."
)
t14["validation_status"] = VAL_LINK
print("Updated #14 Hoverflies - added B1, B2 direction")

# Profile 19 Bats -> analogue #20 Farmland Birds B1=[P08, P11, P16]
t19 = idx[19]
t19["b1_practices_that_benefit"] = ["P08", "P11", "P16", "P19"]
if not t19.get("relevant_efgs"):
    t19["relevant_efgs"] = ["T7.1", "T7.2", "T7.5"]
t19["b2_expected_direction_of_change"] = (
    "P11: Increase in bat activity passes per minute at hedgerow transects within 2-4 seasons "
    "of hedgerow restoration; pipistrelles show fastest response. "
    "P19: Increase in bat roost availability and emergence counts following mature tree establishment."
)
t19["validation_status"] = VAL_LINK
print("Updated #19 Bats - added B1, B2 direction")

# Profile 22 Small mammal insectivores -> analogue #25 Small Carnivores B1=[P11, P16, P14]
t22 = idx[22]
t22["b1_practices_that_benefit"] = ["P11", "P14", "P16"]
if not t22.get("relevant_efgs"):
    t22["relevant_efgs"] = ["T7.2", "T7.5", "T7.1"]
t22["b2_expected_direction_of_change"] = (
    "P14: Increase in hedgehog detection rate in track tubes along uncut field margins "
    "within 2-4 seasons; corridor colonisation detectable within 1 season. "
    "P11: Increase in hedgehog footprint density adjacent to restored hedgerows."
)
t22["validation_status"] = VAL_LINK
print("Updated #22 Small mammal insectivores - added B1, B2 direction")

# Profile 23 Lizards -> analogue #24 Snakes B1=[P17, P04, P19]
t23 = idx[23]
t23["b1_practices_that_benefit"] = ["P14", "P17", "P19"]
if not t23.get("relevant_efgs"):
    t23["relevant_efgs"] = ["T7.5", "T7.2", "T7.1"]
t23["b2_expected_direction_of_change"] = (
    "P14: Increase in lizard refugia occupancy rate at uncut field margin artificial refugia "
    "within 1-2 seasons; maximum count index increases detectable in Year 1."
)
t23["validation_status"] = VAL_LINK
print("Updated #23 Lizards - added B1, B2 direction")

# Save
with open('data/indicators.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("\nindicators.json written successfully")

# Status summary
from collections import defaultdict
buckets = defaultdict(list)
for ind in sorted(data, key=lambda x: x['profile_number']):
    p = ind.get('populated')
    key = 'true' if p is True else str(p) if p else 'false'
    buckets[key].append(f"#{ind['profile_number']:02d} {ind['profile_name'][:25]}")

print("\n=== Final populated status ===")
for key in ['true', 'draft', 'partial', 'false']:
    names = buckets[key]
    print(f"  {key!r:10s}: {len(names):2d} profiles")
    for n in names:
        print(f"             {n}")
