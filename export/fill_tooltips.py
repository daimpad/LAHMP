"""
Fill tooltip fields in data/reference.json.
Targets: block4_pressures (28), block5_challenges (35), block6_services (37).
All tooltips were empty strings — this script provides the authored content.
Run from the repo root: python export/fill_tooltips.py
"""
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('data/reference.json', encoding='utf-8') as f:
    data = json.load(f)

# ── Block 4 — Pressures ───────────────────────────────────────────────────
P4 = {
    1:  "Repeated mechanical inversion or disruption of soil layers. Breaks up soil aggregates, destroys fungal networks, and accelerates organic matter decomposition — a primary driver of soil biodiversity loss and erosion.",
    2:  "Weight of farm vehicles and equipment compresses soil pores, reducing water infiltration and root penetration. Directly reduces earthworm and soil fauna activity and increases surface runoff.",
    3:  "Application of mineral nitrogen, phosphorus, or potassium at rates exceeding crop uptake. Accelerates soil acidification, disrupts microbial communities, and drives nitrate leaching and eutrophication of water bodies.",
    4:  "Use of broad-spectrum insecticides beyond target pest populations. Causes collateral mortality in beneficial insects — pollinators, natural pest predators, and soil-dwelling invertebrates.",
    5:  "Use of herbicides at rates or frequencies that suppress non-target vegetation. Reduces plant diversity in field margins and hedgerows, diminishing habitat for invertebrates and farmland birds.",
    6:  "Fungicide use beyond disease management thresholds. Can suppress mycorrhizal fungi essential for plant nutrient uptake and reduce soil fungal community diversity.",
    7:  "Application of nematicides to control plant-parasitic nematodes. Also kills beneficial free-living nematodes that regulate soil food webs and serve as sensitive indicators of soil health.",
    8:  "Use of rodent-control chemicals at landscape scale. Can cause secondary poisoning in raptors, owls, and small carnivores, and disrupt small mammal communities.",
    9:  "Use of slug and snail control products beyond threshold levels. Can kill non-target invertebrates including ground beetles, which are natural slug predators.",
    10: "Injection of volatile biocides into soil to control soil-borne pathogens and pests. Effectively sterilises the soil biota; broad-spectrum soil microbial and invertebrate communities can take years to recover.",
    11: "Application of organic matter at rates exceeding soil absorption capacity. Can cause nutrient runoff, ammonia volatilisation, and localised soil chemistry imbalance despite beneficial effects at optimal rates.",
    12: "Water application beyond evapotranspiration demand. Leads to waterlogging, secondary salinisation in arid contexts, and leaching of nutrients and agrochemicals to groundwater.",
    13: "Continuous cultivation of a single crop species or variety over large areas. Reduces plant diversity, simplifies soil food webs, and increases vulnerability to specialist pests and diseases.",
    14: "Harvesting or burning above-ground plant material after the main crop. Reduces organic matter inputs to soil, exposes surface to erosion, and removes overwintering habitat for invertebrates.",
    15: "Extraction of surface or groundwater at rates exceeding natural recharge. Lowers water tables, reduces stream baseflows, and can permanently alter wetland and riparian habitats.",
    16: "Installation, removal, or alteration of ditches, canals, pipes, or water control structures. Can permanently change hydrological connectivity, wetland extent, and habitat for aquatic species.",
    17: "Contamination of surface or groundwater originating within the landscape — e.g. agrochemical runoff, effluent from livestock facilities, or silage leachate. Directly degrades aquatic biodiversity.",
    18: "Livestock density exceeding pasture productivity. Removes vegetation cover, compacts soil, reduces plant diversity, and can cause erosion and desertification in vulnerable dryland contexts.",
    19: "Clearing of hedgerows, field margins, scrub, riparian strips, or other semi-natural vegetation. Directly reduces habitat area and connectivity for farmland wildlife.",
    20: "Harvesting of woody biomass, deadwood, or non-timber forest products at rates exceeding natural renewal. Removes habitat structure for cavity-nesting species and deadwood-dependent invertebrates.",
    21: "Establishment of non-native plant, animal, or pathogen species that outcompete native biodiversity. Can fundamentally alter vegetation structure, soil chemistry, or food web dynamics.",
    22: "Conversion between major land use types — e.g. grassland to cropland, forest to pasture. Typically the most severe pressure, causing rapid and often irreversible biodiversity loss.",
    23: "Division of formerly continuous habitat by roads, field enlargement, or built development. Isolates wildlife populations, restricts dispersal, and reduces genetic connectivity.",
    24: "Uncontrolled or poorly timed burning. Effects vary by system: in fire-adapted landscapes, fire exclusion can itself be a pressure; in non-fire-adapted systems, burning causes direct habitat loss.",
    25: "Contamination by persistent organic pollutants (PCBs, dioxins) or heavy metals (cadmium, lead) from historic industrial activity, sewage sludge application, or atmospheric deposition.",
    26: "Pollution originating outside the landscape boundary — pesticide drift, river contamination from upstream agriculture, or atmospheric nitrogen deposition. Difficult to manage locally.",
    27: "Cessation of low-intensity traditional practices — hay cutting, transhumance, coppicing — that maintained semi-natural habitats. Can lead to scrub encroachment and loss of open-habitat specialists.",
    28: "Any significant pressure not covered by the categories above. Describe it briefly — it will be noted in your assessment but will not contribute to automated indicator recommendations.",
}

# ── Block 5 — Challenges ──────────────────────────────────────────────────
P5 = {
    1:  "Reduction in the soil's capacity to supply nutrients to crops and support biological productivity. Indicated by declining organic matter, reduced earthworm activity, and falling yields without increased inputs.",
    2:  "Loss of the organic fraction of soil — plant residues, microbial biomass, humus. Reduces water-holding capacity, aggregate stability, nutrient cycling, and overall biological activity.",
    3:  "Physical removal of topsoil by wind or water. Removes the most biologically active soil layer, reducing fertility and increasing downstream sedimentation in water bodies.",
    4:  "Increased bulk density and reduced pore space in soil, limiting root penetration, water infiltration, and gas exchange. Directly reduces the habitat available to soil fauna.",
    5:  "Accumulation of soluble salts in the root zone, reducing plant-available water and causing toxicity to sensitive crops. Most common in irrigated landscapes in arid and semi-arid regions.",
    6:  "Acidification (from nitrogen fertilisers or acid rain) or alkalinisation (from irrigation water or overliming) outside the optimal range for plant growth and soil biological activity.",
    7:  "Breakdown of the aggregated, porous structure of healthy soil into a dense, structureless mass. Reduces infiltration, aeration, and the three-dimensional complexity on which soil biodiversity depends.",
    8:  "Presence of chemicals at concentrations harmful to plants, soil organisms, or human health — including pesticide residues, industrial contaminants, heavy metals, and excess nutrients.",
    9:  "Insufficient plant-available water during critical growth periods. Can be climate-driven or accelerated by loss of soil water retention capacity, reduced catchment interception, or overabstraction.",
    10: "Decline in the soil's ability to hold and slowly release water, linked to organic matter loss and structural degradation. Amplifies drought stress in dry periods and surface runoff in wet periods.",
    11: "Prolonged inundation or soil saturation creating anaerobic conditions that damage roots and kill most soil organisms. Can follow drainage modification, extreme rainfall, or impeded infiltration.",
    12: "Decline in water table level below the root zone and below the recharge threshold. Indicates long-term unsustainable extraction, with consequences for dependent vegetation and wetland habitats.",
    13: "Degradation of water quality in streams, rivers, ponds, and ditches by nutrients, pesticides, sediment, or pathogen contamination originating from the landscape or adjacent land uses.",
    14: "Loss of nitrogen and phosphorus from the landscape via surface runoff or subsurface drainage. Contributes to eutrophication of receiving waters and indirect greenhouse gas emissions.",
    15: "Presence of harmful bacteria, viruses, or parasites — typically from livestock manure — in soil, irrigation water, or harvested produce. Both an ecological and food safety concern.",
    16: "Reduction in area, permanence, or ecological condition of ponds, ditches, marshes, or seasonal water bodies. Directly reduces aquatic biodiversity and connected terrestrial species that depend on water.",
    17: "Reduction in the diversity or abundance of species living in or dependent on water bodies — invertebrates, fish, amphibians, waterbirds. Often a downstream indicator of multiple terrestrial pressures.",
    18: "Nutrient enrichment leading to excessive algal or plant growth in water and competitive exclusion of stress-tolerant plant communities in terrestrial habitats. Reduces ecological diversity in both realms.",
    19: "Reduction in the variety and abundance of species — plants, animals, microorganisms — across the landscape as a whole. Often a cumulative symptom of multiple other individual challenges.",
    20: "Reduction in physical linkages between habitat patches — hedgerows, field margins, riparian strips — that allow species to disperse, recolonise after local extinction, and maintain viable populations.",
    21: "Reduction in the diversity and abundance of wild bees, hoverflies, butterflies, and other pollinating insects. Directly reduces pollination services and signals poor invertebrate habitat quality.",
    22: "Reduction in the diversity and abundance of soil organisms — bacteria, fungi, nematodes, earthworms, arthropods — that drive nutrient cycling, decomposition, and soil structure formation.",
    23: "Reduction in plant species richness in farmed habitats — field margins, grasslands, arable weed communities, hedgerow understories. Simplifies food web structure and reduces specialist invertebrate habitat.",
    24: "Reduction in the diversity of cultivated plant varieties and livestock breeds. Increases vulnerability to disease, pests, and climate variability, and erodes agricultural cultural heritage.",
    25: "Reduction in populations of natural predators and parasitoids — ground beetles, parasitic wasps, spiders, predatory birds — that suppress pest populations. Increases reliance on pesticide inputs.",
    26: "Episodes of exceptionally high pest population density causing significant crop damage. Often a consequence of disrupted natural regulation and loss of predator habitat or genetic diversity.",
    27: "Recurrent or severe outbreaks of crop pathogens — fungi, bacteria, viruses. Often linked to reduced genetic diversity in crop varieties, weakened plant immunity, or pathogen evolution under pesticide pressure.",
    28: "Episodes of disease in livestock or wildlife populations associated with landscape management factors — stress from habitat quality, veterinary chemical residues, or immunological compromise.",
    29: "Persistent weed populations competing with crops or degrading pasture quality, including biotypes with evolved herbicide resistance. Typically indicates simplified rotations and inadequate diversified weed management.",
    30: "Successful colonisation and expansion of non-native species — plants, animals, pathogens — beyond their original introduction point. Can displace native communities, alter water regimes, or introduce novel disease.",
    31: "Declining ability of the landscape to buffer or recover from variable weather — drought, flooding, late frost, heat stress. Often linked to reduced biodiversity, degraded soils, and structural simplification.",
    32: "Greater susceptibility to damage from extreme events — storms, heatwaves, flash floods. Structural indicators include bare soil, sparse vegetation cover, and absence of shelterbelts or riparian buffers.",
    33: "Loss or simplification of the diverse mosaic of habitats — orchards, flower-rich meadows, copses, wet corners — that characterise traditionally managed cultural landscapes. Reduces overall landscape beta-diversity.",
    34: "Rising reliance on purchased fertilisers, pesticides, feed, and water to maintain productivity. Indicates declining ecosystem function and reduced self-regulation capacity — a measure of system brittleness.",
    35: "Increasing year-to-year variation in crop yields or livestock productivity, often alongside a declining trend. An early indicator of underlying soil degradation, ecological simplification, or climate sensitivity.",
}

# ── Block 6 — Ecosystem services ─────────────────────────────────────────
P6 = {
    1:  "The capacity of the landscape to produce food crops for human consumption or animal feed — including yield quantity, nutritional quality, and year-to-year stability.",
    2:  "The capacity of pastures and grasslands to produce sufficient forage through direct grazing. Includes sward quality, palatability, nutritional value, and seasonal availability.",
    3:  "The capacity of the landscape to support livestock production — meat, milk, eggs, fibre — as a downstream product of forage supply and animal husbandry practices.",
    4:  "The capacity of water bodies within or adjacent to the landscape to support farmed aquatic species — fish, shellfish, crustaceans — as a food and livelihood resource.",
    5:  "The capacity of woody vegetation on the landscape to supply timber, fuelwood, poles, or other wood products sustainably alongside agricultural production.",
    6:  "The capacity of natural water bodies to support harvestable wild fish and other aquatic organisms as a direct food, protein, or livelihood resource for local communities.",
    7:  "The capacity of the landscape to provide wild-harvested non-timber forest products, game, wild fruits, mushrooms, and other biomass for subsistence or commercial use.",
    8:  "The contribution of landscape biodiversity — wild relatives of crops, traditional varieties, native microbes — to genetic resources available for plant and animal breeding and biotechnology.",
    9:  "The capacity of the landscape to capture, store, and deliver fresh water through vegetation interception, soil infiltration, and groundwater recharge for agricultural and domestic use.",
    10: "Any provisioning service — direct production of food, water, energy, or raw materials — not captured by the categories above.",
    11: "The capacity of vegetation and soils to capture and store atmospheric carbon, contributing to climate change mitigation. Includes soil organic carbon accumulation and woody biomass storage.",
    12: "The influence of vegetation cover and evapotranspiration on regional and local precipitation patterns. In some dryland contexts, loss of tree cover measurably reduces local rainfall.",
    13: "The moderating effect of trees, hedgerows, and water bodies on local air temperature and humidity — providing cooling through transpiration, shading, and wind buffering that reduces crop thermal stress.",
    14: "The capacity of vegetation, soils, and water surfaces to intercept and absorb airborne pollutants, dust, ammonia, and particulates generated by agricultural operations or adjacent sources.",
    15: "The self-maintaining capacity of the soil biological community to sustain fertility through nutrient cycling, organic matter decomposition, and aggregate formation — reducing dependence on external inputs.",
    16: "The capacity of plant cover, root systems, and biological soil crusts to retain topsoil and prevent its detachment and transport by rainfall, runoff, or wind.",
    17: "The capacity of vegetation root systems and soil biological structure to stabilise slopes and reduce mass movement risk. Relevant in hilly, montane, and terraced agricultural landscapes.",
    18: "The capacity of soil microbial communities and plant uptake to degrade, bind, or immobilise organic wastes, contaminants, and excess nutrients applied to or deposited on the landscape.",
    19: "The capacity of soils, riparian vegetation, and wetlands to capture, transform, or retain nitrogen and phosphorus before they enter rivers, lakes, or groundwater.",
    20: "The capacity of soils and vegetation to intercept and degrade or sequester pesticides, heavy metals, pathogens, and other non-nutrient chemical pollutants in water.",
    21: "The capacity of the landscape to release stored water gradually, maintaining stream baseflows and groundwater levels during dry seasons. Depends on soil infiltration and vegetation water uptake.",
    22: "The capacity of soils, vegetation, and wetlands to absorb and delay surface runoff during intense rainfall events, reducing peak flows and downstream flood risk.",
    23: "The capacity of coastal vegetation and geomorphological features to reduce wave energy, shoreline erosion, and storm surge impacts. Relevant for coastal and estuarine agricultural landscapes.",
    24: "The capacity of floodplain habitats, wetlands, and riparian vegetation to store and attenuate floodwaters, reducing peak inundation levels and the economic cost of river flooding.",
    25: "The capacity of hedgerows, shelterbelts, and woodland to reduce wind speed and protect crops, livestock, and soils from physical storm damage and desiccation.",
    26: "The capacity of hedges, tree belts, and topographic features to attenuate noise propagation from roads, farm machinery, or livestock operations. Contributes to rural amenity.",
    27: "The capacity of wild pollinators — bees, hoverflies, butterflies — and wind to transfer pollen between flowers, enabling crop fruit set and seed production. Essential for many fruiting crops and wild plant reproduction.",
    28: "The capacity of natural predators, parasitoids, and microbial pathogens — ground beetles, spiders, parasitic wasps, predatory birds — to suppress agricultural pest populations below economic damage thresholds.",
    29: "The capacity of biodiversity and landscape structure to reduce the prevalence of plant or animal diseases — including dilution effects, host diversity, and competition with pathogens.",
    30: "The capacity of habitats within the landscape to support the early life stages of species that use other habitats as adults — including fish spawning areas, insect pupation sites, and overwintering habitat.",
    31: "Any regulating or maintenance ecosystem service — self-sustaining processes that maintain ecological conditions — not covered by the specific categories above.",
    32: "The capacity of the landscape to provide opportunities for walking, cycling, birdwatching, angling, and other outdoor recreation that contribute to human health and rural economies.",
    33: "The aesthetic and scenic quality of the landscape as experienced by residents, visitors, and the wider public. Contributes to quality of life and sense of place.",
    34: "The capacity of the landscape and its biodiversity to support environmental education programmes, citizen science monitoring, and formal ecological research.",
    35: "The cultural, spiritual, and artistic significance of the landscape and its biodiversity for local communities, indigenous peoples, and creative practitioners.",
    36: "Any cultural service — non-material benefits that people derive from ecosystems through enrichment, recreation, or spiritual experience — not covered by the specific categories above.",
    37: "The existence value placed on the landscape's biodiversity and ecological processes by people who may never directly use it — a primary motivation for conservation funding and public support.",
}

# Apply to reference.json
for item in data['block4_pressures']:
    if item['id'] in P4:
        item['tooltip'] = P4[item['id']]

for item in data['block5_challenges']:
    if item['id'] in P5:
        item['tooltip'] = P5[item['id']]

for item in data['block6_services']:
    if item['id'] in P6:
        item['tooltip'] = P6[item['id']]

# Write
with open('data/reference.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Report
p4_filled = sum(1 for i in data['block4_pressures'] if i.get('tooltip'))
p5_filled = sum(1 for i in data['block5_challenges'] if i.get('tooltip'))
p6_filled = sum(1 for i in data['block6_services'] if i.get('tooltip'))
print(f"block4_pressures:  {p4_filled}/{len(data['block4_pressures'])} tooltips filled")
print(f"block5_challenges: {p5_filled}/{len(data['block5_challenges'])} tooltips filled")
print(f"block6_services:   {p6_filled}/{len(data['block6_services'])} tooltips filled")
print(f"Total: {p4_filled + p5_filled + p6_filled} tooltips written")
print("data/reference.json updated.")
