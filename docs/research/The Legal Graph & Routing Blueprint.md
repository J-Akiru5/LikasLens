# PHASE 1: MAP PHILIPPINE / LOCAL LAWS (PILOT LAYER)

# 1A · Identify Target Hazards

`1A · Identify Target Hazards` 

### **`1. Primary Hazard Categories for the Pilot`**

`To ensure an effective vision-based and environmental pilot deployment, we define the following 6 primary target hazard categories selected from the initial scope. These are explicitly chosen based on their high visual/spatial footprint, making them ideal for computer vision or regional geospatial tracking.`

* **`Illegal Dumping (Solid Waste):`** `Unauthorized disposal of municipal, commercial, or plastic waste on land, riverbanks, or coastal areas.`  
* **`Water Discharge (Visible Pollution):`** `Discolored, turbid, or scum-lined effluents released into water bodies, alongside structural indicators like unpermitted drainpipes.`  
* **`Deforestation / Slash-and-Burn (Kaingin):`** `Clear-cutting of forest canopy, localized land conversion, or active burn-clearing in protected watersheds.`  
* **`Hazardous Waste:`** `Visual indicators of industrial or toxic hazards, such as abandoned chemical drums, medical waste bypasses, or electronic waste piles.`  
* **`Coral Damage / Marine Encroachment:`** `Physical scarring, siltation blankets, or illegal coastal structures (e.g., destructive fishing or unpermitted shoreline extensions) impacting marine protected areas.`  
* **`Wildlife Poaching / Encroachment:`** `Illegal equipment placement (e.g., traps, unauthorized nets) or unauthorized human structures encroaching into declared wildlife sanctuaries or marine reserves.`

**`Scope Adjustment Note:`** `Air emission and Noise have been excluded from the primary computer vision pilot scope. Noise cannot be visually detected, and air emissions (smoke plumes) suffer from high ambient variance and are better monitored via static air quality index (AQI) sensors.`

### **`2. Regional Prioritization (Iloilo & Western Visayas)`**

`Based on current local environmental data, stakeholder feedback (such as the Iloilo-Batiano River Development Council reports), and regional geographic profiles, the hazards are prioritized below by frequency and critical impact:`

| `Priority` | `Hazard Category` | `Regional Context & Frequency` | `Primary Hotspots in Region VI` |
| :---- | :---- | :---- | :---- |
| `1` | `Water Discharge & Pollution` | `Critical / Highest. Massive urban and industrial runoff, lack of centralized septage/sewer systems, and visible coliform/effluent issues.` | `Iloilo River, Batiano River, Jalaur River, Guimaras Strait` |
| `2` | `Illegal Dumping` | `High / Chronic. Widespread solid waste accumulation on riverbanks and isolated shores due to gaps in local municipal solid waste systems.` | `Carles (Isla Gigantes), Iloilo City coastal barangays, coastal areas of Antique/Capiz` |
| `3` | `Deforestation (Kaingin)` | `Moderate to High. Driven by agricultural expansion, charcoal making, and upland shifting cultivation.` | `Tigum-Aganan Watershed, Central Panay Mountain Range` |
| `4` | `Coral Damage` | `Moderate. Threatened by illegal blast/cyanide fishing remnants, tourism infrastructure runoff, and climate-induced siltation.` | `Northern Iloilo (Carles/Estancia), Sicogon Island, Boracay/Aklan marine borders` |
| `5` | `Hazardous Waste` | `Low to Moderate. Tied heavily to urban healthcare facilities, electronic waste, and small-scale industrial hubs.` | `Metro Iloilo urban center, commercial ports` |
| `6` | `Wildlife Encroachment` | `Low. Found primarily in strictly protected zones experiencing illegal hunting or unauthorized coastal structures.` | `Panay Conic Forest, local marine sanctuaries` |

### 

### **`3. YOLOv8 Model Class Cross-Reference`**

`The pre-trained YOLOv8 COCO model supports 80 generic classes. While it contains some baseline classes applicable to environmental monitoring (such as boat, bird, or basic container objects like bottle), it does not natively support complex environmental hazard classes.`

`To successfully run the pilot, the baseline model must be adapted through transfer learning using custom annotated datasets. Below is the mapping of how native COCO classes cross-reference with our targeted custom classes:`

| `Target Hazard Category` | `Existing Pre-trained YOLOv8 COCO Classes` | `Required Custom YOLOv8 Model Classes (To be trained)` | `Detection Proxy / Strategy` |
| :---- | :---- | :---- | :---- |
| `Illegal Dumping` | `bottle, cup, handbag, backpack` | `garbage_pile, plastic_waste_clump, scraped_land` | `Detect localized dense clusters of discarded items or large land-based trash piles.` |
| `Water Discharge` | `boat` | `drainpipe, wastewater_plume, discolored_water` | `Identify point-source discharge pipes along rivers and high-contrast effluent plumes.` |
| `Deforestation` | `potted plant (poor proxy)` | `stump, logged_area, charcoal_pit, smoke_plume` | `Segment canopy gaps, freshly cleared land, or illegal charcoal-making kilns.` |
| `Hazardous Waste` | `refrigerator` | `chemical_drum, e_waste, medical_waste_bag` | `Target high-risk shapes like 55-gallon industrial drums or distinctive hazardous containers.` |
| `Coral Damage` | `boat` | `silt_plume, bleached_coral, illegal_structure` | `Use aerial/drone imagery to spot coastal construction encroachment or severe silt runoffs over reefs.` |
| `Wildlife Encroachment` | `bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe` | `illegal_net, wildlife_trap, unauthorized_shack` | `Monitor protected areas for unauthorized human-made structures or illegal harvesting equipment.` |

**`SOURCES:`**  
[`https://r6.emb.gov.ph/emb-ncr-benchmarks-iloilos-water-quality-management-initiatives/#:~:text=The%20benchmarking%20activities%20included%20an,Quality%20Management%20Area%20Action%20Plan`](https://r6.emb.gov.ph/emb-ncr-benchmarks-iloilos-water-quality-management-initiatives/#:~:text=The%20benchmarking%20activities%20included%20an,Quality%20Management%20Area%20Action%20Plan)`.`

[`https://ncr.emb.gov.ph/emb-ncr-conducts-immersive-learning-activity-at-the-iloilo-batiano-river-system-wqma/#:~:text=With%20its%20three%20major%20tributaries,the%20pollution%20of%20the%20waterbody`](https://ncr.emb.gov.ph/emb-ncr-conducts-immersive-learning-activity-at-the-iloilo-batiano-river-system-wqma/#:~:text=With%20its%20three%20major%20tributaries,the%20pollution%20of%20the%20waterbody)`.`

[`https://iloilo.gov.ph/en/taxonomy/term/2423#:~:text=Jan%2014%2C%202026,Nov%2008%2C%202025`](https://iloilo.gov.ph/en/taxonomy/term/2423#:~:text=Jan%2014%2C%202026,Nov%2008%2C%202025)

[`https://www.iloilo.gov.ph/en/environment-news/iloilo-issues-crackdown-illegal-roadside-wastes#:~:text=Based%20on%20the%20trash%20audit,food%20packaging%2C%20and%20aluminum%20cans`](https://www.iloilo.gov.ph/en/environment-news/iloilo-issues-crackdown-illegal-roadside-wastes#:~:text=Based%20on%20the%20trash%20audit,food%20packaging%2C%20and%20aluminum%20cans)`.`

[`https://www.iloilo.gov.ph/en/environment-news/aid-estancias-solid-waste-management#:~:text=Create%3A%20Thu%2C%2002%2F13,recovery%20facility%20in%20the%20town`](https://www.iloilo.gov.ph/en/environment-news/aid-estancias-solid-waste-management#:~:text=Create%3A%20Thu%2C%2002%2F13,recovery%20facility%20in%20the%20town)`.`

# 1B · Map National Laws per Hazard

**`1B · Map National Laws per Hazard`** 

1. **ENVIRONMENTAL LAWS(NATIONAL LAWS AND REGULATION)**

**Presidential Decree (PD) No. 1151 – Philippine Environmental Policy(1977) \-** Establishes the national policy for environmental protection and sustainable development. 

**Presidential Decree (PD) No. 1152 – Philippine Environment Code(1977)** \- Provides guidelines for managing air, water, land, and natural resources. 

**Presidential Decree (PD) No. 1586 – Environmental Impact Statement (EIS) System(1978)** \- Requires environmentally critical projects to undergo environmental impact assessment before implementation. 

**Presidential Decree (PD) No. 705 – Revised Forestry Code(1975)** \- Governs the protection, management, and utilization of forest resources. 

**Presidential Decree (PD) No. 1067 – Water Code of the Philippines(1976)** \- Regulates the ownership, use, and conservation of water resources. 

**`Presidential Decree (PD) No. 979`** `— Marine Pollution Decree -  marine dumping, oil spill, coral damage`.

**Republic Act (RA) No. 6969 – Toxic Substances and Hazardous and Nuclear Wastes Control Act(1990)** \- Regulates the importation, manufacture, use, transport, and disposal of toxic and hazardous substances and wastes. 

**Republic Act (RA) No. 7586 – National Integrated Protected Areas System (NIPAS) Act (1992)** \- Establishes and manages protected areas to conserve biodiversity. 

**Republic Act (RA) No. 7942 – Philippine Mining Act (1995)** \- Regulates mineral exploration, development, and utilization while ensuring environmental protection. 

**Republic Act (RA) No. 8749 – Philippine Clean Air Act (1999)** \- Provides a comprehensive policy for air pollution control and air quality management. 

**Republic Act (RA) No. 9003 – Ecological Solid Waste Management Act (2000)** \- Establishes a systematic and ecological solid waste management program. 

**Republic Act (RA) No. 9072 – National Caves and Cave Resources Management and Protection Act (2001)** \- Protects and conserves caves and cave resources. 

**Republic Act (RA) No. 9147 – Wildlife Resources Conservation and Protection Act (2001)** \- Protects wildlife species and their habitats from exploitation and destruction. 

**Republic Act (RA) No. 9275 – Philippine Clean Water Act (2004)** \- Protects water bodies from pollution and promotes water quality management. 

**Republic Act (RA) No. 9512 – Environmental Awareness and Education Act (2008)** \- Promotes environmental education in schools and communities. 

**Republic Act (RA) No. 9513 – Renewable Energy Act (2008)** \- Encourages the development and use of renewable energy resources. 

**Republic Act (RA) No. 9729 – Climate Change Act (2009)** \- Creates the Climate Change Commission and mainstreams climate change policies. 

**Republic Act (RA) No. 10121 – Disaster Risk Reduction and Management Act (2010)** \- Strengthens disaster preparedness and climate resilience. 

**Republic Act (RA) No. 11038 – Expanded NIPAS Act (2018)** \- Expands and strengthens the country's protected areas system.

# 1C · Identify Enforcing Agencies per Law

**`1C · Identify Enforcing Agencies per Law`** 

### **`MENRO — Municipal Environment and Natural Resources Office`**

* **`Classification:`** `Local Government (LGU) Office (Reports directly to the Municipal Mayor).`  
* **`Meaning:`** `The primary arm of a line municipality tasked with localized environmental protection under the mandate of the Local Government Code of 1991 (RA 7160).`  
* **`Key Responsibilities:`**  
  * **`Solid Waste Operations:`** `Direct implementation of RA 9003 (segregation, collection, and running municipal sanitary landfills or materials recovery facilities).`  
  * **`Ordinance Enforcement:`** `Catching and penalizing local violators of anti-littering, plastic bans, and open burning (siga).`  
  * **`Local Conservation:`** `Managing communal forests, local watersheds, municipal tree nurseries, and greenbelts.`  
  * **`Business Clearance:`** `Inspecting local commercial establishments for environmental compliance before the LGU issues or renews a business permit.`

### **`CENRO — Community Environment and Natural Resources Office`**

* **`Classification:`** `National Government Field Office (The lowest line unit of the national DENR).`  
* **`Meaning:`** `The front-line implementing office of the DENR at the community/multi-municipal level, headed by a Community Environment and Natural Resources Officer.`  
* **`Key Responsibilities:`**  
  * **`Permitting Operations:`** `Conducting actual field inspections for public land titling, surveys, and processing cutting permits for naturally growing trees.`  
  * **`First-Line Enforcement:`** `Confiscating illegally cut timber, monitoring local mineral/quarry operations, and apprehending wildlife poachers.`  
  * **`National Programs:`** `Executing community-level targets for national frameworks like the National Greening Program (NGP).`

### **`PENRO — Provincial Environment and Natural Resources Office`**

* **`Classification:`** `National Government Field Office (The provincial supervisor of the national DENR).`  
* **`Meaning:`** `The provincial-level division of the DENR that oversees and supervises all CENROs operating within that specific province.`  
* **`Key Responsibilities:`**  
  * **`Supervision & Administration:`** `Serving as the tactical "field commander" over provincial environmental targets, managing budgets, and monitoring CENRO performances.`  
  * **`High-Level Permitting:`** `Reviewing and approving land patent applications, foreshore leases, and forest product transport clearances endorsed by CENROs.`  
  * **`Legal & Seizures:`** `Issuing administrative confiscation orders for seized illegal forest or mineral products within the province.`

## **`2. Overarching National Agencies & Bureaus`**

`These national offices hold technical jurisdiction across the country and provide the scientific guidelines that LGUs enforce locally.`

### **`DENR — Department of Environment and Natural Resources`**

* **`Meaning:`** `The executive department of the Philippine government responsible for governing the conservation, management, development, and proper use of the country’s environment and natural resources.`  
* **`Responsibilities:`** `Formulates national environmental policies, enacts administrative orders, and exercises ultimate jurisdiction over public lands, forests, and wildlife.`

### **`EMB — Environmental Management Bureau`**

* **`Meaning:`** `A line bureau under the DENR responsible for the implementation of national pollution control laws.`  
* **`Responsibilities:`** `Issues Environmental Compliance Certificates (ECC) for development projects, monitors industrial air and water quality emissions, and regulates hazardous chemical waste.`

### **`FMB — Forest Management Bureau`**

* **`Meaning:`** `A staff bureau under the DENR that provides technical backing for forest lands.`  
* **`Responsibilities:`** `Recommends policies for the protection, development, and sustainable logging regulations of forest lands, watersheds, and reforestation programs.`

### **`MGB — Mines and Geosciences Bureau`**

* **`Meaning:`** `A line bureau under the DENR tasked with the administration and disposition of mineral lands.`  
* **`Responsibilities:`** `Grants mining permits, monitors safety and environmental compliance of large-scale extraction operations, and conducts geological hazard mapping (such as landslide and flood vulnerability maps).`

## **`3. Frontline Community & Maritime Enforcement`**

### **`Barangay Captain / Barangay Council`**

* **`Meaning:`** `The primary political unit and grassroots leadership of the Philippine government.`  
* **`Responsibilities:`** `First point-of-contact for neighborhood environmental disputes. They manage village-level waste segregation (MRFs), stop local open burning, and enforce clean-up drives under the direct supervision of the municipality.`

### **`PCG (Philippine Coast Guard) & PFDA (Philippine Fisheries Development Authority)`**

* **`Meaning:`** `National agencies managing maritime safety and fish port infrastructures.`  
* **`Responsibilities:`**  
  * **`PCG:`** `Responds directly to marine pollution incidents, ship oil spills, and enforces environmental marine laws in open waters.`  
  * **`PFDA:`** `Manages post-harvest fish port facilities, enforcing sanitation and environmental compliance regarding fish waste at landing ports.`

`In the Philippines, the implementation of environmental laws is a shared responsibility. Under the Local Government Code of 1991 (RA 7160), national environmental laws are devolved to Local Government Units (LGUs)—meaning provinces, cities, and municipalities are mandated to enforce them locally by passing their own local legislation called Municipal or City Ordinances (often consolidated into a local Environment Code).`

`The breakdown below highlights the primary environmental mandates implemented across municipalities, the corresponding local ordinances usually passed, and the specific agencies responsible for enforcing them:`

## **`1. Solid Waste Management & Plastic Regulation`**

`This is the most visible environmental law implemented at the municipal level.`

* **`National Framework:`** `Ecological Solid Waste Management Act of 2000 (RA 9003) and its recent amendment, the Extended Producer Responsibility (EPR) Act (RA 11898).`  
* **`Typical Local Ordinances:`**  
  * **`"No Segregation, No Collection" Policy:`** `Mandating households and commercial spaces to separate biodegradable, recyclable, residual, and special wastes.`  
  * **`Plastic Ban / Regulation Ordinances:`** `Banning or regulating single-use plastics and styrofoam, and charging fees for paper bags.`  
  * **`Anti-Littering Ordinances:`** `Penalizing individuals throwing garbage in public places.`  
* **`Implementing Agencies:`**  
  * **`Municipal Environment and Natural Resources Office (MENRO) / City ENRO (CENRO):`** `The primary local office handling municipal-wide collection, operation of sanitary landfills, and monitoring business compliance.`  
  * **`Municipal Solid Waste Management Board (MSWMB):`** `A multi-sectoral board chaired by the Municipal Mayor that formulates the local 10-year solid waste management plan.`  
  * **`Barangay Solid Waste Management Committee:`** `Responsible for sorting and collecting biodegradable and recyclable wastes at the village level, often managing the local Materials Recovery Facility (MRF).`

## **`2. Clean Water, Septage, and Sanitation`**

`Ensuring localized protection of water bodies, public markets, and household sewage treatment.`

* **`National Framework:`** `Philippine Clean Water Act of 2004 (RA 9275) and the Code on Sanitation of the Philippines (PD 856).`  
* **`Typical Local Ordinances:`**  
  * **`Septage Management Ordinance:`** `Requiring all households and commercial buildings to have standard, non-leaching, three-chamber septic tanks and mandatory desludging (emptying) every 3 to 5 years.`  
  * **`Zonified Wastewater Ordinances:`** `Regulating commercial establishments (like car washes, restaurants, and public markets) to install oil/water separators or wastewater treatment facilities before getting a business permit.`  
* **`Implementing Agencies:`**  
  * **`Rural Health Unit (RHU) / Municipal Health Office:`** `Inspects businesses, food establishments, and homes to issue Sanitary Permits and ensure compliance with wastewater and septage laws.`  
  * **`MENRO / Business Permits and Licensing Office (BPLO):`** `Coordinates to ensure compliance before renewing local business permits.`  
  * **`Environmental Management Bureau (EMB - DENR Regional Office):`** `A national body that steps in for larger commercial operations to issue Discharge Permits.`

## **`3. Air Quality and Anti-Smoke Belching`**

`Regulating localized emissions from transport and small-scale industries.`

* **`National Framework:`** `Philippine Clean Air Act of 1999 (RA 8749).`  
* **`Typical Local Ordinances:`**  
  * **`Anti-Smoke Belching Ordinances:`** `Setting emission testing limits for vehicles passing through municipal roads, particularly local public utility vehicles like tricycles and jeepneys.`  
  * **`Open Burning (Siga) Ban:`** `Strictly penalizing the burning of leaves, trash, and agricultural agricultural waste in residential areas.`  
* **`Implementing Agencies:`**  
  * **`Municipal Traffic Management Office / LGU Smoke Belching Unit:`** `Conducts roadside inspection and emission testing with the assistance of the local Philippine National Police (PNP).`  
  * **`MENRO & Barangay Officials:`** `Monitor and enforce the absolute ban on open burning within communities.`

## **`4. Coastal, Fisheries, and Aquatic Resource Management`**

`For coastal, lakeside, or river-bound municipalities, managing local waters is critical.`

* **`National Framework:`** `Philippine Fisheries Code of 1998 (RA 8550) as amended by RA 10654.`  
* **`Typical Local Ordinances:`**  
  * **`Municipal Fisheries Ordinance:`** `Delineating boundaries of municipal waters (up to 15 kilometers from the shoreline), regulating fishing gear, banning destructive fishing methods (dynamite, cyanide, fine-mesh nets), and declaring closed fishing seasons.`  
  * **`Marine Protected Area (MPA) / Fish Sanctuary Ordinances:`** `Designating specific zones strictly off-limits to fishing to allow marine life reproduction.`  
* **`Implementing Agencies:`**  
  * **`Municipal Agriculture Office (MAO) / Agricultural Technologists for Fisheries:`** `Manages fisherfolk registration, boat licensing, and technical support.`  
  * **`Municipal Fisheries and Aquatic Resources Management Council (MFARMC):`** `A collaborative advisory body composed of local municipal officials and marginalized fisherfolk representatives.`  
  * **`Bantay Dagat (Sea Patrol) / Bantay Ilog:`** `Community-based volunteers and local law enforcement tasked with patrolling waters and arresting illegal fishers.`

## **`5. Local Forestry, Tree-Cutting, and Green Space Conservation`**

`Preserving local watersheds, communal forests, and public green parks.`

* **`National Framework:`** `Revised Forestry Code of the Philippines (PD 705).`  
* **`Typical Local Ordinances:`**  
  * **`Tree Conservation Ordinances:`** `Requiring local permits before cutting trees even within private properties, and mandating replacement seedlings (e.g., planting 10 seedlings for every 1 tree cut).`  
  * **`Communal Forest Management:`** `Governing community-based forestry programs and watershed protection.`  
* **`Implementing Agencies:`**  
  * **`MENRO:`** `Manages local municipal nurseries, seedling distribution, and tree-planting activities.`  
  * **`Community Environment and Natural Resources Office (CENRO - DENR):`** `A national sub-office under the DENR. Note: While the LGU monitors, the actual processing of legal tree-cutting permits for naturally growing trees remains under the strict jurisdiction of the national DENR-CENRO.`

| `Agency Level` | `Office / Entity` | `Primary Role` |
| :---- | :---- | :---- |
| `Local Government (LGU)` | `Sangguniang Bayan (Municipal Council)` | `Enacts the local environmental ordinances and policies.` |
| `Local Government (LGU)` | `MENRO / Office of the Mayor` | `Executes the laws, issues local clearances, and conducts direct inspections.` |
| `Community Level` | `Barangay Council & Multi-sectoral Boards` | `Serves as the immediate front-line enforcement (garbage monitoring, local disputes, small-scale violations).` |
| `National Agencies` | `DENR (EMB / PENRO / CENRO)` | `Provides overarching technical guidelines, checks LGU compliance, handles larger industrial pollution cases, and controls forest resource permits.` |

**`SOURCES:`**

[`https://rkcmpd-eria.org/the-philippines/national-laws-and-regulation#:~:text=In%202022%2C%20RA%209003%20was,Responsibility%20on%20Plastic%20Packaging%20Waste`](https://rkcmpd-eria.org/the-philippines/national-laws-and-regulation#:~:text=In%202022%2C%20RA%209003%20was,Responsibility%20on%20Plastic%20Packaging%20Waste)`.`

[`https://greendevsolutions.com/environmental-laws-and-policies-in-the-philippines/`](https://greendevsolutions.com/environmental-laws-and-policies-in-the-philippines/)

[`https://www.scribd.com/document/325320698/A-Compilation-of-Philippine-Environmental-Laws#:~:text=1.,delegation%20and%20effective%20coordination%20of`](https://www.scribd.com/document/325320698/A-Compilation-of-Philippine-Environmental-Laws#:~:text=1.,delegation%20and%20effective%20coordination%20of)

[`https://www.cagayandeoro.gov.ph/index.php/news/the-city-hall/the-departments-and-offices/103-city-local-environment-and-natural-resources-office.html#:~:text=To%20establish%2C%20maintain%2C%20protect%20and,farms%20and%20agro%2Dforestry%20projects`](https://www.cagayandeoro.gov.ph/index.php/news/the-city-hall/the-departments-and-offices/103-city-local-environment-and-natural-resources-office.html#:~:text=To%20establish%2C%20maintain%2C%20protect%20and,farms%20and%20agro%2Dforestry%20projects)

[`https://chanrobles.com/denrdilgjmcno9801.htm#:~:text=4.2%20Community%20Environment%20and%20Natural,enforcement%20of%20ENR%20laws%20and`](https://chanrobles.com/denrdilgjmcno9801.htm#:~:text=4.2%20Community%20Environment%20and%20Natural,enforcement%20of%20ENR%20laws%20and)

[`https://sibalom.gov.ph/menro-2/#:~:text=2%2C%20Series%20of%202004%20creates,government%20agencies%20for%20the%20effective`](https://sibalom.gov.ph/menro-2/#:~:text=2%2C%20Series%20of%202004%20creates,government%20agencies%20for%20the%20effective)

[`https://malita.gov.ph/directory/municipal-environment-and-natural-resources-office/#:~:text=The%20MENRO%20shall%20take%20charge,VISION%3A`](https://malita.gov.ph/directory/municipal-environment-and-natural-resources-office/#:~:text=The%20MENRO%20shall%20take%20charge,VISION%3A)

[`https://www.scribd.com/document/704158893/Menro-Ordinance#:~:text=Section%206%20%E2%80%93%20GENERAL%20FUNCTIONS.,solid%20waste%20management%20policies%20and&text=In%20addition%20to%20the%20foregoing,commercial%20forest%20like%20industrial%20tree`](https://www.scribd.com/document/704158893/Menro-Ordinance#:~:text=Section%206%20%E2%80%93%20GENERAL%20FUNCTIONS.,solid%20waste%20management%20policies%20and&text=In%20addition%20to%20the%20foregoing,commercial%20forest%20like%20industrial%20tree)

[`https://penrokiosk.penropalawan.com/Pages/About#:~:text=The%20Department%20is%20the%20primary,domain%20as%20well%20as%20the`](https://penrokiosk.penropalawan.com/Pages/About#:~:text=The%20Department%20is%20the%20primary,domain%20as%20well%20as%20the)

# 1D · Document Violation Categories & Penalties

`1D · Document Violation Categories & Penalties`

## **`1. Republic Act No. 9003 (Ecological Solid Waste Management Act of 2000)`**

`RA 9003 establishes the overarching legal framework for solid waste management, devolving implementation directly to Local Government Units (LGUs).`

### **`Violation Categories & Penalties`**

* **`Littering, throwing, and dumping of waste matter in public places`** `(e.g., roads, sidewalks, canals, parks).`  
  * **`Fine:`** `₱300 to ₱1,000`  
  * **`Imprisonment:`** `1 to 15 days`  
  * *`Alternative:`* `Community service of 1 to 15 days in the LGU where the violation was committed.`  
* **`Open burning of solid waste`** `(e.g., pagsunog of leaves, plastics, household trash).`  
  * **`Fine:`** `₱300 to ₱1,000`  
  * **`Imprisonment:`** `1 to 15 days`  
* **`Open dumping, burying of biodegradable or non-biodegradable materials in flood-prone areas.`**  
  * **`Fine:`** `Minimum ₱1,000 to Maximum ₱3,000`  
  * **`Imprisonment:`** `15 days to 6 months`  
* **`Non-segregation of solid waste`** `(Failure to implement source separation into compostable, recyclable, non-recyclable, and special wastes).`  
  * **`Fine:`** `₱1,000 to ₱3,000 (for individuals/households)`  
  * **`Imprisonment:`** `15 days to 6 months`  
* **`Operation of open or controlled dumpsites`** `(Applicable to LGUs or entities maintaining unpermitted sites).`  
  * **`Fine:`** `₱500,000 plus an additional 5% of the initial fine for every day of violation.`  
  * **`Imprisonment:`** `1 to 3 years`

### 

### **`Escalating Penalty Tiers`**

`For individual and commercial violators, subsequent offenses default to the maximum limits of the prescribed fine ranges and imprisonment terms. If the violator is a commercial establishment, corporation, or juridical entity, the business license/permit is revoked upon the third offense.`

### **`LGU-Level Ordinance Overrides`**

* **`Iloilo City Regulation Ordinance No. 2004-149 (Anti-Littering Ordinance):`** `Overrides the national baseline for local enforcement within the metro. It imposes strict fines ranging from ₱500 (First Offense) to ₱5,000 or community service/imprisonment for repeat offenses, specifically penalizing littering, spitting, urinating, and improper disposal in public public utility vehicles (PUVs) or major thoroughfares.`  
* **`Dingle Municipal Level Rules:`** `Often adapt lower-tier environmental enforcement, mapping community service tasks (e.g., cleanups along local waterways or public markets) to first-time residential infractions instead of immediate cash collections.`

## **`2. Republic Act No. 8749 (Philippine Clean Air Act of 1999)`**

`This law focuses on comprehensive air pollution control policy, targeting both mobile sources (vehicles) and stationary sources (factories, heavy burning).`

### **`Violation Categories & Penalties`**

* **`Smoke Belching (Mobile Source Violations)`** `(Vehicles exceeding allowable emission standards).`  
  * **`First Offense:`** `Fine of ₱1,000`  
  * **`Second Offense:`** `Fine of ₱3,000`  
  * **`Third Offense:`** `Fine of ₱5,000 plus suspension of the vehicle registration for up to 1 year.`  
* **`Industrial/Stationary Source Emissions without Permit`** `(Operating manufacturing or industrial plants discharging unpermitted air pollutants).`  
  * **`Fine:`** `Up to ₱100,000 for every day of violation until standards are met.`  
  * **`Imprisonment:`** `Gross violations can lead to 1 to 6 years imprisonment for responsible officers.`

| `Violation Category` | `Baseline Fine Range (PHP)` | `Imprisonment Term` | `Escalate/Notes` |
| :---- | :---- | :---- | :---- |
| `Littering / Small Dumping` | `₱300 – ₱1,000` | `1 to 15 days` | `Can convert to LGU community service` |
| `Open Trash Burning` | `₱300 – ₱1,000` | `1 to 15 days` | `Strict liability under RA 9003` |
| `Non-Segregation of Waste` | `₱1,000 – ₱3,000` | `15 days to 6 months` | `Targets waste generators at source` |
| `Smoke Belching (Vehicle)` | `₱1,000 – ₱5,000` | `None (Registration suspension)` | `Tiered flat-rate structure` |
| `Operating Open Dumpsites` | `₱500,000 base` | `1 to 3 years` | `Compounding daily 5% accrual` |

**`SOURCES:`**

[`https://pepp.emb.gov.ph/wp-content/uploads/2016/06/RA-9003-Ecological-Solid-Waste-Management-Act-of-2000.pdf`](https://pepp.emb.gov.ph/wp-content/uploads/2016/06/RA-9003-Ecological-Solid-Waste-Management-Act-of-2000.pdf)

[`https://r5.emb.gov.ph/wp-content/uploads/2016/06/IRR-of-Republic-Act-8749.pdf`](https://r5.emb.gov.ph/wp-content/uploads/2016/06/IRR-of-Republic-Act-8749.pdf)

 

# 1E · Map LGU-Specific Ordinances (Iloilo Pilot)

## **`1E · Map LGU-Specific Ordinances (Iloilo Pilot)`** 

## **`Iloilo City Local Environmental Ordinances (Pilot Framework)`**

`The primary legislative framework for local environmental governance in Iloilo City is Regulation Ordinance No. 2004-149 (commonly known as the Iloilo City Environmental Code of 2004), alongside subsequent amendments like Regulation Ordinance No. 2015-305 (Garbage Collection Ordinance). These local policies translate national frameworks—such as RA 9003 (Ecological Solid Waste Management Act) and RA 9275 (Philippine Clean Water Act)—into actionable local rules.`

`Key focus areas under the local framework include:`

* `Strict anti-littering, dumping, and open-burning restrictions.`  
* `Urban land management and protection of the Iloilo-Batiano River System WQMA (Water Quality Management Area).`  
* `Mandatory commercial sanitation standards and domestic waste segregation.`

## **`Primary Local Enforcer: Iloilo City ENRO / CENRO`**

`The City Environment and Natural Resources Office (CENRO / ENRO) serves as the lead enforcement body under the mandate of the local executive.`

### **`Core Operational Powers & Strategies`**

* **`Deputization Authority:`** `CENRO equips and deploys Sanitation Officers, "Green Guards" (primarily focused on public areas, vandalism, and environmental protection), and local task forces to issue official Citation Tickets to violators.`  
* **`Targeted Monitoring:`** `They actively monitor ecological hot zones, including commercial establishments operating near major critical waterways like the Jaro River and Iloilo River Esplanade, ensuring compliance with local wastewater and solid waste guidelines.`

## 

## **`Local Penalties Supplementing National Law`**

`Because local policies operate under the restrictions of the Local Government Code of 1991 (RA 7160), administrative fines issued via local ordinances are capped at a maximum of ₱5,000.00 per violation for cities. However, the LGU supplements national law by tying these fines directly to local operational mechanics and operational licenses.`

| `Violation Type` | `Tiered Ordinance Penalties (RO 2004-149)` | `Supplementary Local Sanctions` |
| :---- | :---- | :---- |
| `Littering, Illegal Dumping, & Public Spitting/Nuisance` | `1st Offense: ₱500.002nd Offense: ₱750.003rd Offense: ₱1,000.00` | `Issuance of immediate local citation tickets by deputized sanitation officers.` |
| `Commercial / Major Industrial River Dumping` | `Administrative fines scaling up to the statutory maximum of ₱5,000.00.` | `Business Permit Sanctions: Legal recommendations for the direct suspension or revocation of Business Permits for repeat commercial offenders.` |

## **`Barangay-Level Jurisdiction Boundaries`**

`While CENRO manages overarching city-wide policies, execution relies heavily on decentralized territorial blocks across the city's primary administrative districts (such as Jaro, City Proper, Molo, Mandurriao, La Paz, Arevalo, and Lapuz).`

### **`Localized Jurisdiction Matrix`**

`[City Executive / CENRO]` 

       `│`

       `└───► [7 Administrative Districts] (e.g., Jaro, La Paz, Mandurriao)`

                   `│`

                   `└───► [180 Barangay Local Government Units (BLGUs)]`

* **`First-Line Enforcement:`** `The 180 individual Barangay Local Government Units (BLGUs) hold direct, frontline jurisdiction over local clean-up drives, initial waste collection segregation at the household level, and the monitoring of community-level illegal dumping.`  
* **`Barangay Sanitation Officers:`** `Local barangay officials and assigned community sanitation officers are authorized to monitor neighborhood-level compliance and work hand-in-hand with CENRO's mobile teams during district-wide river clean-ups and enforcement sweeps.`

**`SOURCES:`**

[`https://www.scribd.com/document/325897880/Iloilo-City-Regulation-Ordinance-2015-305`](https://www.scribd.com/document/325897880/Iloilo-City-Regulation-Ordinance-2015-305)

[`https://www.imtnews.ph/enforcement-of-iloilo-citys-anti-littering-ordinance-intensified/#:~:text=Tre%C3%B1as%20has%20ordered%20the%20strict,the%20enforcement%20of%20the%20ordinance`](https://www.imtnews.ph/enforcement-of-iloilo-citys-anti-littering-ordinance-intensified/#:~:text=Tre%C3%B1as%20has%20ordered%20the%20strict,the%20enforcement%20of%20the%20ordinance)`.`

[`https://www.dailyguardian.com.ph/blog/iloilo-city-to-file-charges-over-jaro-river-trash-dumping`](https://www.dailyguardian.com.ph/blog/iloilo-city-to-file-charges-over-jaro-river-trash-dumping)

[`https://www.manilatimes.net/2026/06/18/regions/iloilo-city-to-file-charges-against-business-for-illegal-dumping-in-jaro-river/2367690`](https://www.manilatimes.net/2026/06/18/regions/iloilo-city-to-file-charges-against-business-for-illegal-dumping-in-jaro-river/2367690)

# PHASE 2: MAP ASEAN COMPARISON LAYER

# 2A · Select Comparison Country

## **`2A · Select Comparison Country`** 

## **`Data Node Mapping: Indonesia`**

`If your graph shifts its geographic coordinates to Indonesia, the nodes seamlessly transition to utilize the country's central environmental framework, which relies heavily on strict criminal liabilities for water pollution.`

| `Graph Entity Type` | `System Data Node Value` | `Description & Technical Context` |
| :---- | :---- | :---- |
| `Hazard / Event` | `Waterway Waste Dumping` | `The physical trigger event (e.g., industrial effluent or solid waste disposal into a river).` |
| `National Law` | `Law No. 32 of 2009 on Environmental Protection and Management (UU PPLH)` | `The umbrella legislation. Specifically, Article 60 (prohibits dumping without a permit) and Article 98/99 (criminalizes actions causing environmental destruction).` |
| `Primary Agency` | `KLHK (Kementerian Lingkungan Hidup dan Kehutanan)` | `The Ministry of Environment and Forestry. They set national standards, issue permits, and handle high-level enforcement.` |
| `Enforcement Arm` | `Gakkum KLHK (Direktorat Jenderal Penegakan Hukum Lingkungan Hidup dan Kehutanan)` | `The specific Law Enforcement Directorate General within KLHK that deploys environmental inspectors (PPLH) and civil servant investigators (PPNS).` |
| `Local Node` | `DLH (Dinas Lingkungan Hidup)` | `The regional/provincial Environmental Agency. Because Indonesia is highly decentralized, the initial field response and monitoring are handled by the local DLH.` |

## **`Data Node Mapping: Vietnam`**

`If you choose Vietnam as your scalability proof, the graph demonstrates how it adapts to a heavily centralized, decree-based regulatory framework designed to police rapid industrial manufacturing.`

| `Graph Entity Type` | `System Data Node Value` | `Description & Technical Context` |
| :---- | :---- | :---- |
| `Hazard / Event` | `Waterway Waste Dumping` | `The physical trigger event.` |
| `National Law` | `Law on Environmental Protection 2020 (LEP - Law No. 72/2020/QH14)` | `The foundational law. Article 6 strictly prohibits the discharge of wastewater or dumping of waste into water sources without proper treatment or permits.` |
| `Regulatory Decree` | `Decree No. 45/2022/ND-CP` | `The crucial administrative enforcement decree that defines specific financial penalties and sanctions for environmental violations.` |
| `Primary Agency` | `MONRE (Ministry of Natural Resources and Environment)` | `The national ministry responsible for water resources and environmental policy management.` |
| `Enforcement Arm` | `Environmental Police Force (Cục Cảnh sát phòng chống tội phạm về môi trường)` | `A specialized branch under the Ministry of Public Security that works alongside MONRE to investigate and criminally prosecute serious illegal dumping.` |
| `Local Node` | `DONRE (Department of Natural Resources and Environment)` | `The provincial-level departments that execute MONRE's directives on the ground and issue local wastewater discharge permits.` |

## **`Visualizing the Neo4j Graph Adaptability`**

`To win over the judges, explain that your ontological model (the schema) remains entirely unchanged. Only the properties inside the vertices alter.`

`![][image1]`

**`SOURCES:`**  
[`https://climate-laws.org/document/law-on-environmental-protection_41ac`](https://climate-laws.org/document/law-on-environmental-protection_41ac)  
[`https://english.luatvietnam.vn/decree-no-45-2022-nd-cp-providing-penalties-for-administrative-violations-against-regulations-on-environmental-225156-doc1.html`](https://english.luatvietnam.vn/decree-no-45-2022-nd-cp-providing-penalties-for-administrative-violations-against-regulations-on-environmental-225156-doc1.html)

# 2B · Map Indonesia Environmental Laws

`2B · Map Indonesia Environmental Laws`

**`Indonesia Environmental Law Framework`** 

| `Law / Regulation` | `Scope & Core Mandate` | `Primary Focus` |
| :---- | :---- | :---- |
| **`Law No. 32/2009 (PPLH)`** | `The foundational umbrella legislation for all environmental protection, sustainability, and management in Indonesia.` | `Environmental licensing, impact assessments (AMDAL), and legal liabilities.` |
| **`Law No. 18/2008`** | `National framework dedicated specifically to household and specific waste handling.` | `Reduction, recycling, and safe management of municipal solid waste.` |
| **`Law No. 31/2009`** | `Broadening of the earlier 2004 Fisheries framework, specifically regulating activities that damage marine ecosystems.` | `Preventing marine pollution, illegal fishing practices, and destructive habits.` |
| `Gov. Regulation No. 22/2021` | `The major implementing regulation spawned by the controversial Omnibus Law (Job Creation Law).` | `Restructuring the environmental approval workflow, emissions standards, and hazardous waste (B3) management.` |

**`Enforcement Architecture`** 

`![][image2]`

### **`1. National Level: KLHK`**

`The Ministry of Environment and Forestry (Kementerian Lingkungan Hidup dan Kehutanan) serves as the central authority.`

* **`Role:`** `Formulates national policy, issues high-level environmental permits, and enforces compliance regarding cross-provincial violations or major industrial breaches.`

### **`2. Local Level: DLH`**

`The Environmental Agency (Dinas Lingkungan Hidup) operates at the Provincial and City/Regency (Kabupaten) levels.`

* **`Role:`** `Executes day-to-day supervision, manages local municipal waste facilities under Law 18/2008, conducts ground-level inspections, and monitors regional compliance with emission and effluent limits.`

**`SOURCE:`**

[`https://greenaccess.law.osaka-u.ac.jp/wp-content/uploads/2019/03/Law-No.32-of-2009-on-The-Management-and-Protection-of-the-Environment.pdf`](https://greenaccess.law.osaka-u.ac.jp/wp-content/uploads/2019/03/Law-No.32-of-2009-on-The-Management-and-Protection-of-the-Environment.pdf)

[`https://faolex.fao.org/docs/pdf/ins97643.pdf`](https://faolex.fao.org/docs/pdf/ins97643.pdf)

[`https://peraturan.bpk.go.id/Details/161852/pp-no-22-tahun-2021`](https://peraturan.bpk.go.id/Details/161852/pp-no-22-tahun-2021)

[`https://www.ecolex.org/details/legislation/government-regulation-no-22-of-2021-on-environmental-protection-organisation-and-management-lex-faoc209753/`](https://www.ecolex.org/details/legislation/government-regulation-no-22-of-2021-on-environmental-protection-organisation-and-management-lex-faoc209753/)`?`

 

# 2C · Side-by-Side Hazard Comparison

**`2C · Side-by-Side Hazard Comparison`**  
**`Environmental Hazard Comparison: PH vs. ID`**  

| `#` | `Hazard` | `Philippines (PH) Law & Agency` | `Indonesia (ID) Law & Agency` | `Key Difference / Focus` |
| :---- | :---- | :---- | :---- | :---- |
| `1` | `Waste Dumping` | `RA 9003 (Ecological Solid Waste Management Act) ➔ ENRO (Environmental and Natural Resources Office / LGUs)` | `Law No. 18/2008 (Waste Management) ➔ KLHK (Ministry of Environment and Forestry) / DLH (Regional Environmental Agency)` | `PH heavily decentralizes enforcement to local government units (LGUs/ENRO), whereas ID shares management between central ministry guidelines and regional agencies (DLH).` |
| `2` | `Air Emission` | `RA 8749 (Clean Air Act) ➔ EMB (Environmental Management Bureau)` | `Law No. 32/2009 (PPLH) (Environmental Protection and Management) ➔ KLHK` | `PH utilizes a dedicated, standalone Clean Air Act managed by EMB, while ID integrates air emission standards under its umbrella environmental protection law (PPLH) enforced by KLHK.` |
| `3` | `Water Pollution` | `RA 9275 (Clean Water Act) ➔ EMB` | `Law No. 32/2009 (PPLH)  ➔ KLHK` | `Similar to air emissions, PH addresses water quality via a specific framework (RA 9275) emphasizing multi-sectoral water quality management areas, while ID relies on PPLH's broad regulatory mandates.` |
| `4` | `Deforestation` | `PD 705 (Revised Forestry Code) ➔ FMB (Forest Management Bureau) / CENRO` | `Law No. 41/1999 (Forestry Law) ➔ KLHK` | `PH operates under an older Presidential Decree (PD 705) with localized implementation via CENRO, while ID's framework handles massive state-owned forest estates (Kawasan Hutan) directly via KLHK.` |
| `5` | `Wildlife Exploitation` | `RA 9147 (Wildlife Resources Conservation and Protection Act) ➔ DENR-BMB (formerly BWBIP)` | `Law No. 5/1990 (Conservation of Living Natural Resources and Ecosystems) ➔ KLHK` | `PH splits jurisdictions between DENR (terrestrial) and DA-BFAR (aquatic). ID centralizes wildlife protection through KLHK's specialized directorates.` |
| `6` | `Marine Pollution` | `PD 979 (Marine Pollution Decree) ➔ PCG (Coast Guard) / PFDA (Fisheries Development Authority)` | `Law No. 31/2004 amended by Law No. 45/2009 (Fisheries Law) ➔ KLHK / KKP (Ministry of Marine Affairs and Fisheries)` | `PH tasks the Coast Guard with active open-water enforcement against dumping. ID coordinates marine compliance through both KLHK and KKP to protect vast archipelagic waters.` |

**`Note:`** `In Indonesia, KLHK (Kementerian Lingkungan Hidup dan Kehutanan) acts as a consolidated mega-ministry covering both environment and forestry, whereas the Philippines separates these functions into specialized bureaus (like EMB and FMB) under the umbrella of the DENR.` 

**`SOURCE:`**   
[`https://faolex.fao.org/docs/pdf/phi45260.pdf`](https://faolex.fao.org/docs/pdf/phi45260.pdf)  
[`https://pepp.emb.gov.ph/wp-content/uploads/2016/06/RA-9003-Ecological-Solid-Waste-Management-Act-of-2000.pdf`](https://pepp.emb.gov.ph/wp-content/uploads/2016/06/RA-9003-Ecological-Solid-Waste-Management-Act-of-2000.pdf)  
[`https://lpr.adb.org/resource/law-waste-management-2008-indonesia`](https://lpr.adb.org/resource/law-waste-management-2008-indonesia)  
[`https://greenaccess.law.osaka-u.ac.jp/wp-content/uploads/2019/03/Law-No.32-of-2009-on-The-Management-and-Protection-of-the-Environment.pdf`](https://greenaccess.law.osaka-u.ac.jp/wp-content/uploads/2019/03/Law-No.32-of-2009-on-The-Management-and-Protection-of-the-Environment.pdf)  
[`https://climate-laws.org/document/law-32-2009-environmental-protection-and-management_80f6`](https://climate-laws.org/document/law-32-2009-environmental-protection-and-management_80f6)

# 2D · Draft Neo4j Cypher Graph Schema for Multi-Country

`2D · Draft Neo4j Cypher Graph Schema for Multi-Country`

## **`1. Schema Definitions & Properties`**

`To ensure optimal performance during traversal filtering, we will treat Country and Jurisdiction as distinct entities (vertices) rather than just flat string properties where deep relational context is required. However, adding a flat country property to the laws and agencies allows for high-performance, single-hop filtering.`

### **`Vertex Labels & Properties`**

| `Vertex Label` | `Properties` | `Description` |
| :---- | :---- | :---- |
| `Law` | `id, name, type, country (ISO 2-letter code)` | `Legal frameworks, regulations, or compliance acts.` |
| `Agency` | `id, name, acronym, country (ISO 2-letter code)` | `Regulatory bodies or enforcement entities.` |
| `Jurisdiction` | `id, name, level (e.g., Federal, State, Regional)` | `The specific legal scope or boundary.` |
| `Country` | `id, name, country_code (ISO 3166-1 alpha-2)` | `The absolute geographic/political country vertex.` |
| `Report` | `id, timestamp, latitude, longitude` | `Incoming field reports or telemetry data.` |

 **`Edge Labels`**

* `Law —[governed_by]→ Jurisdiction`  
* `Jurisdiction —[located_in]→ Country`  
* `Agency —[enforces]→ Law`  
* `Report —[originated_in]→ Country (Dynamically linked via geospatial mapping)`

## **`2. Graph Traversal Examples (Filtering by country_code)`**

`By structuring the graph with both properties (for fast entry points) and vertices (for relational context), you can traverse the graph efficiently at query time.`

### **`Query A: Get all Laws filtered by a specific country property (Fastest)`**

`If you just need a quick lookup of laws explicitly tagged for a country:`

`MATCH (l:Law {country: 'PH'}) RETURN l`

### **`Query B: Traverse from Law through Jurisdiction to a Country vertex`**

`If you need to validate structural relationships (ensuring the Law's jurisdiction is properly localized in the target country):`

`MATCH (l:Law)-[:governed_by]->(j:Jurisdiction)-[:located_in]->(c:Country {country_code: 'PH'})`

  `RETURN l.name`

**`Query C: Find Agencies enforcing Laws within a specific Country`** 

`MATCH (a:Agency)-[:enforces]->(l:Law)-[:governed_by]->(j:Jurisdiction)-[:located_in]->(c:Country {country_code: 'US'})`

  `RETURN DISTINCT a.name, a.acronym`

## **`3. Mapping Report GPS Coordinates to the Country Layer`**

`Because Neo4j is natively a graph engine and not a GIS (Geospatial Information System) engine, mapping raw GPS coordinates (latitude, longitude) from an incoming report to a Country vertex requires a hybrid ingest pipeline.`

`Here is the operational workflow for mapping coordinates to the correct graph layer:`

`![][image3]`

### 

### **`Step-by-Step Architecture`**

1. **`Resolution at Ingestion (Recommended)`**  
   * `When a Report vertex is created, its raw coordinates are passed to an external GIS utility or microservice (e.g., using PostGIS, Python's Shapely/Geopandas, or a reverse-geocoding API).`  
   * `The GIS service performs a Point-in-Polygon (PIP) query against a standardized ISO country boundary dataset to determine the country code (e.g., PH, US, SG).`  
2. **`Graph Localization`**  
   * `Once the GIS tool returns the country code, the ingest worker looks up the existing Country vertex using that code.`  
   * `The worker then creates a direct edge between the new report and the country:`  
     `MATCH (r:Report {id: reportId}), (c:Country {country_code: $resolvedCountryCode})`

     `CREATE (r)-[:originated_in]->(c)`

**`Why not do this natively inside Neo4j?`**

* `While Neo4j does not natively support complex polygon point-in-polygon queries, offloading the geometric heavy-lifting to a spatial engine (PostGIS, Shapely) keeps your graph queries ultra-fast and deterministic.`

# PHASE 3: RESOLUTION WORKFLOW & ESCALATION

`PHASE 3: RESOLUTION WORKFLOW & ESCALATION`

## **`1. Happy-Path Workflow`**

`The standard, ideal lifecycle of a reported environmental issue operates on a high-velocity automated pipeline:`

* **`Step 1: Report Intake:`** `A citizen submits an incident (e.g., illegal dumping, localized deforestation) via the app, uploading geotagged, time-stamped media.`  
* **`Step 2: AI Triage:`** `The system runs computer vision to confirm anomaly detection, extracts metadata, cross-references with historical reports, and assigns a baseline severity score.`  
* **`Step 3: Graph Routing:`** `The system maps the issue against the municipal graph database to automatically identify the precise Local Government Unit (LGU) or agency with jurisdictional mandate.`  
* **`Step 4: Agency Action:`** `The designated agency receives an automated ticket, dispatches a field team, and updates the status with visual proof of remediation.`  
* **`Step 5: Resolution Confirmed:`** `The reporter (or nearby localized users) verifies the fix. The ticket is officially marked as Resolved.`  
* **`Step 6: Eco-Credits Minted:`** `Upon successful resolution, tokenized Eco-credits are automatically minted and distributed via smart contract to the reporter and active community verifiers.`

## **`2. Escalation Tiers & Timeouts`**

`If an agency fails to act within standard operating windows, the system automatically triggers a strict, multi-tiered escalation matrix:`

`[Day 0: Intake] ──(Response SLA varies by violation)──> [Tier 1: LGU Escalation] ──(Resolution SLA varies)──> [Tier 2: Regional Oversight] ──(7 Days Total Stagnation)──> [Tier 3: NGO Broadcast]` 

**`Note:`** `Response and resolution SLAs are violation-specific (see SlaConfigSeeder.php). Examples: chemical_spill = 4h response / 24h resolution; illegal_dumping = 48h response / 168h resolution; deforestation = 72h response / 336h resolution.`

**`Tier 1: PENRO Intervention (48-Hour Timeout):`** `If the primary local LGU or agency does not acknowledge or initiate action within 48 hours, the ticket automatically bypasses local jurisdiction and escalates to the Provincial Environment and Natural Resources Office (PENRO) with a high-priority SLA.`

**`Tier 2: Community Public Review (72-Hour Timeout post-PENRO):`** `If an additional 72 hours pass without a verified status update from PENRO, the issue is automatically unlocked to a public "Community Review" dashboard, exposing the agency’s backlog to local citizens to drive civic pressure.`

**`Tier 3: NGO & Media Broadcast (7 Days Total Stagnation):`** `If the ticket remains unresolved 7 days after the initial report, the platform automatically packages the audit trail and broadcasts it directly to partnered environmental NGOs and regional media networks.`

## **`3. Rejection & Exception Handling (Neo4j Routing)`**

`When an agency rejects a ticket claiming "out of jurisdiction" or "incorrect classification," the platform prevents dead-ends using an automated re-routing logic:`

* **`The Neo4j Re-router:`** `Rejected tickets are instantly pulled back into the routing layer. The AI re-analyzes the rejection logs, re-weights the graph coordinates, and assigns it to an adjacent agency or overlapping authority.`  
* **`Three-Strike Cap ($3 \times$ Limit):`** `A ticket can only bounce through the automated re-routing loop a maximum of 3 times.`  
* **`Regional Escalation:`** `If the third assigned agency rejects the ticket or if it remains unassigned after 3 attempts, the system completely bypasses local and provincial layers, escalating the case directly to the DENR Regional Office as a jurisdictional dispute requiring manual legal arbitration.`

## **`4. Citizen Verification & Dispute Flow`**

`Resolutions cannot be self-certified by agencies alone; they must pass citizen audit.`

* **`The Verification Window:`** `Once an agency claims a resolution, the ticket enters a 48-hour Pending Verification state. The original reporter and users within a 1km radius receive a notification to verify.`  
* **`The Dispute Loop:`** `If a citizen clicks "Dispute" and uploads fresh visual evidence showing the problem persists:`  
  * `The ticket is automatically re-opened.`  
  * `The agency's resolution streak is penalized.`  
  * `The system immediately skips Tier 1 escalation rules and bumps the ticket directly to Tier 2 (Community Review) with a mandatory 24-hour response window for the offending agency.`

## **`5. System Workflow Architecture (Judges' Summary)`**

### **`Phase A: Intake & Autonomous Intelligence`**

* **`The Blueprint Begins:`** `A citizen uploads a geotagged, time-stamped environmental report via the application.`  
* **`The AI Gatekeeper:`** `The platform immediately initiates AI Triage, processing computer vision to verify the environmental anomaly and scoring its severity.`  
* **`The Automated Dispatch:`** `The Knowledge Graph matches the report's exact spatial coordinates against jurisdictional boundaries to route the ticket directly to the appropriate Local Government Unit (LGU) or agency. From here, the path splits based on agency action:`

### **`Phase B: The Remediation & Verification Loops`**

* **`Path 1: The Happy Path (Agency Resolves Issue)`**  
  * `The agency reviews the ticket, dispatches a cleanup or enforcement crew, completes the task, and uploads proof of resolution.`  
  * `This action moves the ticket into a 48-Hour Citizen Audit Window.`  
  * `If Approved: The issue is marked Closed, and the system automatically mints and issues Eco-Credits to the reporter and community auditors.`  
  * `If Disputed: If citizens flag the fix as inadequate with new photographic evidence, the ticket is instantly re-opened, penalized, and fast-tracked directly into the Tier 2 Escalation tier.`  
* **`Path 2: The Neo4j Re-routing Path (Agency Rejects Jurisdiction)`**  
  *   `If the assigned agency rejects the ticket, it is pulled into the Neo4j Re-routing Pool.`  
  * `The system re-analyzes the boundaries and assigns it to a neighboring or overlapping authority.`  
  * `A built-in counter tracks this movement. If the loop count stays under 3, it attempts a new agency. If the ticket hits a 3-strike limit of consecutive rejections, it completely bypasses local levels and escalates straight to the DENR Regional Office for administrative arbitration.`

### **`Phase C: The Passive Escalation Clock`**

`If the initially assigned agency accepts the ticket but goes radio-silent, a strict clock begins ticking:`

* **`At 48 Hours of Inaction:`** `The ticket automatically triggers Tier 1 Escalation, bypassing the local LGU entirely to alert the Provincial Environment and Natural Resources Office (PENRO).`  
* **`At 72 Hours Post-PENRO Inaction:`** `The ticket triggers Tier 2 Escalation, moving onto a public Community Review Dashboard where the agency's backlogs are fully visible to local voting citizens.`  
* **`At 7 Days of Total Stagnation:`** `The ticket triggers Tier 3 Escalation. The platform automatically packages the entire digital audit trail—complete with the logs of which offices ignored it—and broadcasts it directly to partnered Environmental NGOs and Media Networks for public accountability.`

# PHASE 4: DELIVERABLES & HANDOFF

`PHASE 4: DELIVERABLES & HANDOFF`

### **`1. Neo4j Cypher Seed Data (Law + Agency Vertices)`**

`Below are the Cypher CREATE statements to seed the Neo4j graph database with Law and Agency vertices, along with their respective relationships (edges) for both the Philippines (PH) and Indonesia (ID).`

`// Create Country Vertices`

`CREATE (c_ph:Country {id: 'c_ph', name: 'Philippines', code: 'PH'})`

`CREATE (c_id:Country {id: 'c_id', name: 'Indonesia', code: 'ID'})`

`// --- PHILIPPINES (PH) DATA ---`

`// PH Law Vertices`

`CREATE (l_ph_ra10173:Law {id: 'l_ph_ra10173', title: 'Data Privacy Act of 2012 (RA 10173)', jurisdiction: 'PH', type: 'Statute'})`

`CREATE (l_ph_cyber:Law {id: 'l_ph_cyber', title: 'Cybercrime Prevention Act (RA 10175)', jurisdiction: 'PH', type: 'Statute'})`

`// PH Agency Vertices`

`CREATE (a_ph_npc:Agency {id: 'a_ph_npc', name: 'National Privacy Commission', acronym: 'NPC', tier: 'Primary'})`

`CREATE (a_ph_cybercrime:Agency {id: 'a_ph_cybercrime', name: 'CICC / DOJ Cybercrime Office', acronym: 'CICC', tier: 'Escalation'})`

`// PH Edges`

`MATCH (l:Law {id: 'l_ph_ra10173'}), (a:Agency {id: 'a_ph_npc'}) CREATE (l)-[:enforced_by]->(a)`

`MATCH (l:Law {id: 'l_ph_cyber'}), (a:Agency {id: 'a_ph_cybercrime'}) CREATE (l)-[:enforced_by]->(a)`

`MATCH (a1:Agency {id: 'a_ph_npc'}), (a2:Agency {id: 'a_ph_cybercrime'}) CREATE (a1)-[:escalates_to {trigger: 'Criminal Data Breach'}]->(a2)`

`MATCH (l:Law {id: 'l_ph_ra10173'}), (c:Country {id: 'c_ph'}) CREATE (l)-[:governed_under]->(c)`

`MATCH (l:Law {id: 'l_ph_cyber'}), (c:Country {id: 'c_ph'}) CREATE (l)-[:governed_under]->(c)`

`// --- INDONESIA (ID) DATA ---`

`// ID Law Vertices`

`CREATE (l_id_uu27:Law {id: 'l_id_uu27', title: 'Personal Data Protection Act (UU No. 27/2022)', jurisdiction: 'ID', type: 'Statute'})`

`CREATE (l_id_ite:Law {id: 'l_id_ite', title: 'ITE Law (UU No. 11/2008 & Amendments)', jurisdiction: 'ID', type: 'Statute'})`

`// ID Agency Vertices`

`CREATE (a_id_pdp:Agency {id: 'a_id_pdp', name: 'PDP Oversight Agency (Otoritas Pelindungan Data Pribadi)', acronym: 'PDP Agency', tier: 'Primary'})`

`CREATE (a_id_kominfo:Agency {id: 'a_id_kominfo', name: 'Ministry of Communication and Informatics', acronym: 'KOMINFO', tier: 'Primary/Regulatory'})`

`CREATE (a_id_poldas:Agency {id: 'a_id_poldas', name: 'Indonesian National Police (Cyber Crimes Unit)', acronym: 'POLRI', tier: 'Escalation'})`

`// ID Edges`

`MATCH (l:Law {id: 'l_id_uu27'}), (a:Agency {id: 'a_id_pdp'}) CREATE (l)-[:enforced_by]->(a)`

`MATCH (l:Law {id: 'l_id_ite'}), (a:Agency {id: 'a_id_kominfo'}) CREATE (l)-[:enforced_by]->(a)`

`MATCH (a1:Agency {id: 'a_id_pdp'}), (a2:Agency {id: 'a_id_poldas'}) CREATE (a1)-[:escalates_to {trigger: 'Non-compliance/Criminal Breach'}]->(a2)`

`MATCH (a1:Agency {id: 'a_id_kominfo'}), (a2:Agency {id: 'a_id_poldas'}) CREATE (a1)-[:escalates_to {trigger: 'Cyber/System Breach'}]->(a2)`

`MATCH (l:Law {id: 'l_id_uu27'}), (c:Country {id: 'c_id'}) CREATE (l)-[:governed_under]->(c)`

`MATCH (l:Law {id: 'l_id_ite'}), (c:Country {id: 'c_id'}) CREATE (l)-[:governed_under]->(c)`

### **`2. Routing Spec (Hand off to Jeff)`**

**`To:`** `Jeff (Backend/Graph Infrastructure Team)`

**`From:`** `Compliance/Legal Graph Design Team`

**`Subject:`** `Production Routing Traversal & Escalation Queries (PH & ID)`

`Jeff, here is the routing and traversal specification for the cross-border compliance engine. Use these optimized Cypher queries to drive the dynamic UI routing and automated legal operations workflow.`

#### **`A. Country-Specific Filter Traversal`**

`When a user selects a jurisdiction, we need to surface all applicable laws and their enforcing agencies instantly.`

`// Example for Country Code: 'PH'`

`MATCH (l:Law)-[:governed_under]->(c:Country {code: 'PH'})`

`RETURN l.title AS Law_Title, [a IN (l)-[:enforced_by]->(a2:Agency) | a.name] AS Enforcing_Agencies`

#### **`B. Regulatory Escalation Routing`**

`If an incident shifts from a regulatory compliance issue to a severe or criminal breach, the engine must identify the escalation pathway.`

`// Finds the direct escalation target from a primary agency and extracts the trigger condition`

`MATCH (from:Agency)-[e:escalates_to]->(to:Agency)`

`RETURN from.acronym AS From_Agency, e.trigger AS Trigger_Condition, to.name AS Escalation_Target`

#### **`C. Escalation Business Rules Table`**

`Implement these logic rules inside your routing middleware helper functions:`

| `Country` | `Starting Node (Primary)` | `Target Node (Escalation)` | `System Escalation Trigger Condition` |
| :---- | :---- | :---- | :---- |
| `PH` | `a_ph_npc (NPC)` | `a_ph_cybercrime (CICC/DOJ)` | `Breach involves malicious hacking, identity theft, or refusal to comply with an NPC enforcement order.` |
| `ID` | `a_id_pdp (PDP Agency)` | `a_id_poldas (POLRI)` | `Intentional illegal data processing or forged data elements resulting in public/individual damage.` |
| `ID` | `a_id_kominfo (KOMINFO)` | `a_id_poldas (POLRI)` | `Zero-day infrastructure breach or systemic refusal to take down illegal content/data elements.` |

### **`3. Judge Materials`**

#### **`1-Page Summary: Cross-Border Regulatory Architecture`**

`The rapid development of ASEAN data privacy frameworks demands an adaptive approach to cross-border legal compliance. This system maps legal frameworks into an active Knowledge Graph to automate corporate compliance routing.`

`By defining Laws and Agencies as distinct vertices interconnected by typed edges (enforced_by, escalates_to), our architecture removes human error from initial multi-jurisdictional triage. When a security incident occurs, the platform programmatically references the graph to determine exactly which primary agency holds jurisdiction, which localized laws apply, and the precise legal threshold that moves a matter from an administrative oversight to a criminal law enforcement escalation.`

#### **`PH vs. ID Jurisdictional Comparison Chart`**

| `Metric / Dimension` | `Philippines (PH) Framework` | `Indonesia (ID) Framework` |
| :---- | :---- | :---- |
| `Primary Legislation` | `Data Privacy Act of 2012 (RA 10173)` | `Personal Data Protection Act (UU No. 27/2022)` |
| `Cybercrime Override` | `Cybercrime Prevention Act of 2012 (RA 10175)` | `ITE Law (UU No. 11/2008 & Amendments)` |
| `Administrative Authority` | `National Privacy Commission (NPC)` | `PDP Oversight Agency (under Presidential Authority)` |
| `Tech/Infrastructure Regulator` | `DICT` | `KOMINFO` |
| `Criminal Escalation Unit` | `DOJ Cybercrime / CICC` | `POLRI Cyber Crimes Unit (National Police)` |
| `Notification Window` | `Within 72 hours of discovery` | `Within 3 x 24 hours (72 hours) of discovery` |

**`System Escalation Flowchart`** 

**`![][image4]`**

 

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnAAAADHCAYAAACZQ25HAAAqv0lEQVR4Xu3d+68V1f3/8c8fYbWpSYm/mPQHkqY2JTGpTVoiaWuEhK8hWmMsFqOUYAwQQkTESyqiaNXSWj6ELTdBQS5WikpiEZS7CML56Ac4IDeRAyIgIII4375Wfe/POu+ZPXufc/Y+ezbnOckj7D33WbNhXqw1M+u/Ln3zTdJMK1asSP78zDPJzTffnPziF79Irr322uSKK64AAABoCmWRn/zkJyGbjBw5MuSU3bt2pTJMM/2XH9Eop0+dSubMnp0qJAAAgFYzaNCgZN7cuam801t6JcCNHj066devX+rgAQAAWtm4ceOSbR98kMo+jdawALdy5crUQQIAAFyufvvb3yZvvvlmKhM1QkMC3K9//evUQQEAAPQF/9PWlspG9VbXAHfyiy+SSZMmpQ4EAACgr7jqqquShx56KJWT6qkuAe6bixeT5597LnUAAAAAfdX3v//95C/PP5/KTfVQlwD3/4YOTe00AAAArkiOfPppKjv1VI8C3KpVq5JrrrkmtaMAAAD4P8pLPkf1RLcD3IKXXkquvPLK1A4CAAAgbe6cOak81V3dCnC8IgQAAKDr9ICDz1Xd0eUAt2bNmuTqq69O7RAAAACq27xpUypfdVWXAtyJzz9P7QQAAAC65rrrrks+P348lbVq1aUAd9ddd6V2AAAAAF2nXOWzVq1qDnD0ZQoAAFBfHUePpjJXLWoOcH6DAAAA6JmRI0emMlctagpwenDBbxAAAAA9969//SuVvaqpGuDmz5uX2hAAAADqx+evaqoGuAEDBqQ2AgAAgPpRv/I+g+WpGuD8BgAAAFBfN998cyqD5ckNcNz7BgAA0Ds2btiQymKVVAxwp0+dSn74wx+mVg4AAID60yvbfB6rpGKAW7xoUWrFAAAAaByfxyqpGOB+8IMfpFYKAACAxjl75kwqk2WpGOD8CgEAANBYev7AZ7IsBDgAAICCqPVp1MwAd+7s2dQKAQAA0FhXX311Tc2omQFOj7H6FQIAAKDxanmdSGaAmzJlSmplAAAAaDzlMJ/NvMwAd9ddd6VWBgAAgMYbOXJkKpt5mQHuxhtvTK0MAAAAjacc5rOZlxng6MAeAACgOZTDfDbzMgMcL/EFAABoDuUwn828zADnVwQAAIDe47OZR4ADAAAoGJ/NPAIcAABAwfhs5hHgAAAACsZnM48Adxm6/vrrAz8eAAC0Bp/NPALcZWjr1q3J7t27G/o6GAXEu+++O7n33nuTO++8M+nXr19qniK49dZbwz7KwIEDU9MBACgin808AlyTfP3118m3335b/j537twwzs+Xpdq8vVkD9/HHHyeffvppMmTIkNS0St55550QqPz4RlJ5qdz8eAAAishnM48A1yQKFOfOnUtGjBgRvlcLZbGuzNtoBDgAAOrPZzOPANckChRvv/12CHGPPPJIp1DWv3//ZNu2bcny5cuTJ598Mrl06VLy6quvhmmvv/56cujQoTBu586dwerVq8M0NZm+/PLLyYoVK0JIiren+b7597nVejdu3JhcvHixXEv35Zdfhv2YPn162M6JEyfKwfLNN98M06ZOnZps2LAhWbduXaf11jvAnTx5Mjl16lTYl3379oX9tGlnzpxJxo0bFz4PHz48+eijj0LT7ZgxY1LLzZs3r9N6CXAAgFbis5lHgGsSBQoFmY6OjqStrS1Vq6YQZ58VkNrb28vf/byewpEPcBcuXEjWrFlTvldt6dKlSalUCp8V4LQfNq9Ck4KQPmv+G264ofxZ8912223leesd4BTSJkyYED4PGzYsOXr0aPlePh3DkiVLwmftu+2/7vnzy6m84nsACXAAgFbis5lHgGsSC3CDBg1KPvnkk2TRokXlUKaaMdWYKRjpT90rp8+2bHcCnEJaHJr0WeHLpsXza7Cwo9o9q+07fPhwaj31DHBaR9YwdOjQMF21gV999VUyatSo5PTp0+XltH0/fPbZZ+XlhAAHAGglPpt5BLgmsQCnz6rt2rt3b3L+/PnwXc2mcUCzkGTfuxPgVEM1fvz4TvOoKVWf8wKcgtLmzZvL0xod4Hbt2lXxiVbtv45DzaNq1rXx2n7eckKAAwC0Ep/NPAJck8QBThRMLJRNnjw5BJQ77rgjNAeqBiwOcLoPTPNrvilTpiSbNm0K49XsqmCkcbpfLX51hu6bU+2VavpKpVIIYlq3puUFON0Pd+TIkbAe3bPnA5zumdO9daod0/15y5Yt63ScWbQt3aen+/WMNXdqH7U9bUPrUpnEzcnadzWl2j2Bovvz/HK6Py5eTk2xojLTfYB2jx8AAEXks5lHgGsSH+D02QKcapIUiDSo+VT3c8UBThYsWFBuLtTN+xqn8OIHC2L33HNPcvDgwbA+DWpitHXlBbjZs2eHcKRBIdAHuMGDB4ewpPXKjh07Ou1nFm3LD1aDN2PGjBBONWh9e/bs6bSs3j0XP8xg/HK33357arpCsQbN99xzz6X2CwCAovDZzCPAFZiCkl6S68fH01WTFNc0VaMX23b1xbu6J6/adrTerjSj5rGaRK3TT8tTbTl7+XDecQAAUAQ+m3kEOAAAgILx2cwjwAEAABSMz2YeAQ4AAKBgfDbzCHAAAAAF47OZR4ADAAAoGJ/NPAIcAABAwfhs5hHgAAAACsZnM6+lA1z8Jn+9cFb9ivp5uqPSe8Sq6er71VAZZYlGeOaZZ1L/bvh5AKAIfDbzWjrA+V4BqlEPAOqWKh63bt260PeofZ80aVLoqunZZ59NLZ9H3V6pB4C4i6daFCWoaB+0/+qtQH+2tbUl1113XWq+mPpBjQf1JBGXZXd1tyyLwl4Y7Mf3BvXYofPix3tZvWH4eXqTykvl5sc3kspJ/4b48QBQBD6beX0uwGmwmjrrU9SHjt6sgetqR/CNorJQ/6naf4VYdb3l5/F0AYz7NJ0/f36qC6vu6k5ZFoV+T9YtWm/rSoCTuDbKz9Ob6hX+u4IAB6DIfDbz+lyAi2vX1N/oxYsXe/3CEStKgFMZWP+ntdIFsCvl31e0SoBr5u/eI8ABQGc+m3l9LsBpGXn00UeTEydOJPPmzStfOKwmImu9Cn5ffPFFMn369GT//v3JzJkzw3jVOKnmScv5i5Bq+j755JNk+fLlyaxZs0Kz5BtvvBGmbd68Odm5c2doslRn8Pps9+NMnjw5rE/7p07nV61aFWoKVSOl/VbwtG3oszqb98fqaf3f/Pvcbtu2Ldm4cWMIrtZkpeM9e/Zs2BcrH9vPPHkBTtNUXmoGVXlp2xo/cODA8H3YsGHhu45V27XlKpXlgAEDkqVLl4Z1Hj58OFmyZEkok6effjpQGai8NL6joyOcJy1nYUplrM8qL50TnRuFHS23Z8+ecH5feeWVcvBS2ajM1q9fn0ydOjWU144dO8I0HbP2WevR8am8tG1N0zncu3dvaKrX8lJLje5jjz0Wjkf/udA6jx49Wi4jlaX2T+N1XCpL+/0tXLgwlOfixYuTt99+O8zX0wDny9LKJO8caLqOVeWk8lK5qby0jKbp97Rp06bkhRdeCPtp5+D1118Py6m8VG76vHr16rDMqFGjwm9B2zh06FCYV/tlTdTbt28v19KWSqWwbX8seQhwAIrMZzOvTwa4AwcOhHvfRLVO/kKWtV5dGC0UjB8/PoQgv34fOrSO+AKhi43vSD2vBk4XtQULFoTPtpwuiHZx13Javr29PbWsp/1fs2ZN+YKnC7Eueja9uzVwurhmhT5Ni8tL89k0CyL6XCmA+rIUO977778/fLdwsHv37uTUqVPJ2LFjw3fdQ6dzrIBgAS6+v0r7on2ystNxa56hQ4eGwKx5FDTiQKDfih2DzquCjbaj7woy8bzdrYG74YYbyp/j35sFOJum/dDvz8rD9kP0m6k1wCm027mz41aZ+rLUsdptB5XOgagM9Luy71bO+qx9UvnatFtuuaXT/mSdb6NB+6vP8d8frV9N//pNK6BrP/2yeQhwAIrMZzOvTwY4/e9dtQi6+NQa4OKgpWlZF8msi9Do0aPDDfkadMH0N2rnBbis/RDtuy7gChX6XMsN835d/hi6G+Cy9s+mxeXlg6zt9/nz5zMfVsgqSwsPfl6t2y7wfvmsMGXTrLnRAly8/qyb/G09Op54e1peg33P2mY1Vouo/VGNoAY7HxoXH7eOV+OyttPTJlR/bH7eSudA/KB9mzZtWpim372+a1ANor/HMut8V5umkK4Art+PakRVO+3nyUOAA1BkPpt5fTLA6bM1azU6wImaDUulUmgG8k2T3QlwagZVU5Jq4uJmpDxxbYhovXEtYm8GOFFZqUwqBdCssqwUHrRuXyNqx5sVcmoNcHGtYcyHnHoEONUgHTt2rPxdy1cLcL5mU1QLlfXb9PICnC9LzWu/nUrnQLQv+g+LH29Ue6Ymc/1+rQnVpmWd72rTVq5cGYKbamCtxtXPk4cAB6DIfDbz+myAM3GA07pEF6IpU6aEzxaOKgU4hTNbThca3es2YsSIcLFSE5iavh5//PHQfDRnzpxQaxZvX01eevpT91/piU6NU7iM98M/kWkX0fg+qWoUHlXDs2jRohCcVA7xst0NcPFTqKL7lmxaXoCzB0j861p8WeqzylImTJgQmvpsHltG9zGqVkc1V2PGjEk+/PDDcJyalhWmaglw+qwy03nRto4fP56cPn26vI95AU7lqnOjd45NnDgx7FO8/SwKNTo/qql6/vnnQ61ttQCnz/oPgX4/Ck46pq40oWaFIvFlafcv5p0DUXkpUGm81q3yuu+++8rNsLodQGXz4IMPpn67+q0fOXIk/N51r5zG6Rxk/b2yZazpVE2+akr1x1ENAQ5Akfls5hHgogCXNVgIqRTg7OIdD/F+zZgxo9M0H7h0o7cu1qKLpsZp3fGQVUunABQ/zFCNmqwOHjxYbs61e55MdwOcH+LQkRfg1NylwOLLI2uwsOAHW0YX8mXLloULvQYFQwu83Q1wojKz8lJIsObAagFOnnrqqfJ+6sGMeFoWBTCdEw0KQbXUwOmzAp/to4KWQlBPA5wvS/ud5Z0Dsd+YDVZeNs32U4PKJ15W4U7b0qCytn2Mh6y/76V//2ek1lpojwAHoMh8NvNaOsBV+8f9cqQb3dVUpCaj+AZyoC9RcFVoU3jz/wnI4//TQYADUFQ+m3ktHeCsZkZ888rlSBcq1cSohiZ+KhHoSxTe1HSqh4J8zyrV2O0J8b8bfh4AKAKfzbyWDnAAAACXI5/NPAIcAABAwfhs5hHgAAAACsZnM48ABwAAUDA+m3kEOAAAgILx2cwjwKFu9FJZ31VYb9A2tW3fPRMAAK3KZzOPAIe6UBdJer2Jep3w0xpNb+nXa1XUvZifBgBAK/LZzCPAoUdU+6UeJNSrgo3zPRocPnw4OXnyZPm73rBf6aXLca8Tfj02TdvcuXNn6AA+XlZdV6lnC15wDABodT6beQQ49MjMmTNDF0hqwrRxcfBS2FIXT5rPpvc0wK1evTrzBa56M79q4nz/qgAAtBqfzTwCHHpEzZa7du3q1BelBS/VkFkH7fEyPQlw6kNVNXqVuk9qb29P9fMKAECr8dnMI8ChR86cOdOpY3ex4KVmU4Utv0xegFNtndapPir1p77bNIXFY8eOJWPGjEktZ7Zt20b/lgCAluezmUeAQ4/kBTgFLYU4X1uWF+Cq1cCNHj06rLNSiGtrayPAAQBans9mHgEOPdLR0RGaLeMHB+LgNX369PDAQdyM2pMAp3EKjVk1e7J///6K0wAAaBU+m3kEOPTI9u3bQ6AaN25ceVwcvHRvnB440IMHNr2nAW7hwoWhadXfWye6527dunWp8QAAtBKfzTwCHHpENW96dUd8r5oPXmpCVa3YQw89FL4rwPnBQlstAU6fFd70xOmMGTPK0xXs1qxZ0+mBCgAAWpHPZh4BDj1mAW3OnDmpab1Bge21114LIdLfbwcAQCvy2cwjwKFudL9bM2q/VAtYKpWSQYMGpaYBANCKfDbzCHAAAAAF47OZR4ADAAAoGJ/NPAIcAABAwfhs5hHgAAAACsZnM48ABwAAUDA+m3kEODSFXuRLl1cAAGTz2cwjwKEpCHAAAFTms5lHgENTEOAAAKjMZzOPAIemIMABAFCZz2YeAQ5NQYADAKAyn808AhyaggAHAEBlPpt5BDg0BQEOAIDKfDbzCHBoCgIcAACV+WzmEeDQFAQ4AAAq89nMI8ChKQhwAABU5rOZR4BDUxDgAACozGczjwCHpiDAAQBQmc9mHgEOAACgYHw28whwAAAABeOzmUeAAwAAKBifzTwCHAAAQMH4bOYR4AAAAArGZzOPAAcAAFAwPpt5BDgAAICC8dnMI8ABAAAUjM9mHgEOAACgYHw28whw6FUTJkxIjh07Vv4+YMCAZMeOHcmQIUNS8wIA0Ff5bOYR4NCrBg4cmOzfvz8ZNmxY+D558uTk3LlzqfkAAOjLfDbzCHDodaNGjUq2bdsWPh84cCBpb29PzQMAQF/ms5lHgEOv69evX/LFF18kd999d3L+/Pnk1VdfTc0DAEBf5rOZR4BDUxw9ejT5+OOPk+3bt4dA56cDANCX+WzmEeDQFG+++WZy8eLF5Nlnn01NAwCgr/PZzCPAAQAAFIzPZh4BDgAAoGB8NvMIcAAAAAXjs5lHgAMAACgYn808AhwAAEDB+GzmEeAAAAAKxmczjwAHAABQMD6beQQ4AACAgvHZzCPAXYauv/76wI8HAACtwWczjwDXJOpGyoZvv/02mT17dt26lNq6dWuye/fuZMCAAalp9fLkk08mX3/9ddj/Tz/9NBkyZEhqnlqoP1T1i1rLsWt72q4f3wjx+Zk7d25qeiUqBy3rxzdCvc4BAKB4fDbzCHBNoou8gsvLL7+cvP7668k3/y73efPmpear5pZbbknee++9TuN6swZOx9GT8PDGG28k586dS43P0psBzmibRQ1wpqfnAABQPD6beQS4JrGLbqXvgwcPLteubN68ORk0aFB52gcffBACn/oS/eyzz0ItlsbfdNNNyZdffhkoGMXb0/Lr1q0L69SyWodN0zrUN6ltb8aMGeVpCojbtm0L47Wc9iteb0/Dw/nz52sOZXkBburUqUlHR0fYTwXjeJpq906dOhWmqbZz7Nix5Wn33XdfGKfh7bffTgXfegY4rVvlfPbs2bBN1ZLatGPHjiXvvPNO+fuOHTuS9vb2crn+5S9/Ke/ntGnTOq23p+cAAFA8Ppt5BLgm8YHtwIEDyeHDh8NnXeh37tyZrF+/PgQTBTVd0DVNzaIKFStWrEg2bNgQpi1durQ8TTV6mhaHAdH6FMAUxjZu3BiWs7CiwKdasOnTpyevvvpqcuLEiWTEiBFhmgKHpmk/tD2FwKzj6E54uOOOO7rU1FspwD399NPJV199FfZ7yZIlIcjpWGz6woULQ9lq2qpVq8rH179//1Aey5cvD+u9dOlSOH6/zXoFuNWrV4dttLW1hXLVPlu57d+/Pzl69Gh5XpW5nUM7vlKpFOizzofN25NzAAAoJp/NPAJck8T3WGl49913y4FKF+4zZ84k9957b7Bs2bIQuDRNQSMOFGvXru0UBEXL+ACnQDB58uTy99GjR4dl9VkBTqHCpmmwbaj2SttUAFRTr+bV+m3e7oaHYcOGhcBSa3iTSgFOtWsKYvE4lZ+O0e4T88sYC3Effvhhsnfv3lRZ1jPAXbhwIdzraOd11qxZIVRq2qhRo5LTp0+Hz6otVe2blY3KXLWwtpxqTDXd1tvdcwAAKC6fzTwCXJPooqsL8cSJE0ONUXzxVfjyg4UQ1Vp99NFHIezps5aNm+IkK8D54KXPFjQ0LZ5fg4UWqzVSgFMtll9Pd8ODarryglWWSgHO7388b16As5pO7b/+VBNlIwNc1rBgwYIwTUF5+/btoTlc+xzXBOr4/LBr167y9O6eAwBAcfls5hHgmiRuQtXDC/E9a1YD55cxChWqdVJT2smTJ5MxY8Z0mp4V4LS+8ePHd5pHTan67AOQBgstqhVS7Y9Nq1eA0zJ79uxJjc+TF+DsWIwdb16A89N8s7bUM8BpXf7+tZiafUulUjgXdl+j6PistjRLd88BAKC4fDbzCHBN4sOCAodq1vRZF+JDhw4lr7zySghLx48fLzeviR5A8LVuouZAzT9lypRwv5o+Dxw4MEzT+hT4Fi1aFEKCQoGaMTUtL8DpfrEjR46E9egmfx/gVFOke+t0T5eaWNXc6/fLUxOh7vmLH8yohZqRtZ+6z0/UHKl1KABrHxQIFWbVHKrjtOW03xqnaarx1Hq0rJqU1bSsmkyVhWoafYBTM69oXt9Mm0XnTuVl+yjWdK37GLVtlZXG7du3LxVINV0PdsTjdHwar31Xs7COdc2aNeXp3TkHAIBi89nMI8A1iQ9wqoGz+9zknnvuKT91qNo2q7lRs58u1jbETzMqWPnBgpjWd/DgwfI61Xxr28oLcAo6Cn4aFAJ9gNNTqQqeWq/YwxZ5St/djO/HV+MH2xc1Pyq0qIZLg8oxfq+cykzjbNC8mi4KPRq077qvzAc4PZGrkKchr1bUKMD5wcpWZaV7De0cqFzj/RSNix9mEDs+G7Zs2dIp/HbnHAAAis1nM48A10KGDx8easT8eIXB3/zmN6nxRaSarq40SQIA0Bf5bOYR4FqIandUQxS/q+yBBx4INXR+XgAA0Lp8NvMIcC1I92LpZbVqatN7zfSyXT8PAABoXT6beQQ4AACAgvHZzCPAAQAAFIzPZh4BDgAAoGB8NvMIcAAAAAXjs5lHgAMAACgYn828yzbAzZ8/v9Pb8P307rr11ltT44pGrxmJXzWCfCqrESNGpMY3k17s3MhzqHXr5c5+fDXx3yn9HfPTAQD14bOZd9kGuK72YRn3YnD27NnkrbfeSnX1NGnSpOTChQvJs88+m1q+t2T1c+pt3bo19M4wYMCA1LSu8r00tBr9BnxfqL43CZWXhrzyylpPI6i7L/Vv+8QTT5THxZ3Z67cZ/y51buJjMfbOQPuuebSeeB71+qDX0fhla6Ht9kZ5AEBf5bOZR4D7ji5wu3btCjUL6jJKXRLt3LkzNV+za+BqCXA9rYH75z//We5rs9EBTt1E/fWvf21YDVhW8PIBrpYauKz1NIL6c1Wwisdpf/XbVD+n+m3qd2nntycB7plnngnHlBdcKyHAAUBj+WzmEeC+44PRbbfdlnR0dJQ7g9fFT9SHaHyxV1OXxuliaH1Rqm9KTVM4UV+aNvjaDnVMbv1iqsP1WkKX38/YTTfdVN5P7Vc8Tfuofj+t78+4X09tV9vXoH5WH3744fK0OMCpye3w4cPJfffdF76r5krbtHk///zzZObMmeVpf//738Mxa53vvvtup/3ReA3qo3T58uXl8Sovm6Y///a3v3U6hqxyzpMVvCzAad9VU2ll5pe18yPqMN7Wo/Mfl6/9BvT5scceS6ZPnx4Cl5ZTIPPrrUS/Fx3z3Xff3Wm8D9H6Xe7fvz987kmAk3HjxoUXQ/vx1RDgAKCxfDbzCHDfyQpG6mPULqZ234+vvdEyCigKRE8++WToVNwu7n/84x+TY8eOhVBTKpWS48ePhwumpqkZ7JNPPgnhZdasWcmlS5dSoStL1n4a1aRoH1esWJGaR/utTtm1TYURfbcgqvCmIDVx4sQQ8DZs2FDuZN3Cg8LbkSNHksmTJ5fXqfJRULDvcZlrmsKItqWwoTKy+aZOnRrGTZkyJZSJAolNU3nt27evXF5x0KxUznnyApzK64UXXgjl5Wu91GerwqrKZvHixaHp0tbjz4E+WzjSvqm/Wu3fxo0bQ7n6pvhK1Netgp/v4N4HOJWtdZ/W0wCnMlD4HDp0aGpaHgIcADSWz2YeAe47/qIsWRfHrAB3/vz5EEb03S6cFmzUzZWavLZs2ZK89NJL5W1YgFNXWGPHjk3tTyVZ++llzaP9bmtrK39X2Vj5+IAQH6M+b968OQSGOLxJtQBn4deHh3g51XLFIU3lpaZCK694Wl45V6L9UTjWOTD+HPr9k7Vr13ba9sqVK2sOcAsWLChPU5kpBMbrrkTL+vMm/vzE28v6jYqVjx2zgqHu3/Tz2fqz1pGHAAcAjeWzmUeA+46/KIuChmpF4nH+YmcXUxsXBwu7IV3NaFqXAkG8jbgJVTVfPW1CzZvHh4A4wO3duzfUrumz9kF9rKoGypZT0+h7772XqhmqFuBsmg9ICmhqCtXnpUuXdgoCKi99t/LSYNMqlXO8T15eDZx99/sn2n48Ll6PL18f4OLfnZ83z/jx4zPn9edO+6ZaPn2uFuDse9YxxuvPWkceAhwANJbPZh4B7jvxhVZBZfXq1aHmxs/nL3Z5AU4X2rh5UPeE2TbUlGoPCoiasTS/355XSyDImseHgDjAyahRo0KQ87VFtpxqceJmUNH+xk1vGmoJcKLaQDWXKvDEwVDlpfsP9VnlpSbIeF+yyjler9fdAKem3/h4da9cHOBUQ6fPaoJsb2/vFOC2b99ePiatZ/bs2Z3WXYmWUWi1ZnYTnzvNo9+l1qvvPQ1wjz76aLJu3brU+GoIcADQWD6beQS47+gCZ0+hKkz5p1A1XXSBVTPenXfeGS6meQFOzW4KAb/85S/DK0hUs2UXYt3oriatxx9/PIQg3YNVy4U03k//nrv+/fuH6do/3cemz/FDGHkBTveTWa1bzJZTk69C19NPP12epvE6xttvvz3cx6cyqzXAqUk263UsKi/dk2blpXXG+5JVzn4dsbwAp/LSfYAqL51XO8eaR+NVy6WaQtWU6lzZerRN7f+0adNCCNe0OMDpu8qlVCqF8dWecI1pWZ07v78656ql1W/TP4Wq8op/C7qvr5YAp/C5Y8eO5JFHHkntRzUEOABoLJ/NvMs6wC1btqzTRblZtP1KQUNBsNn7p4cNFGKsrBROVBtn4S+P9l/3utXS/CsTJkwI67dt6cEJNTErsNk8elVLpfLqbTq2rACm49U036xsTagKh10pF2MPT8yZMyc1rZ603wrLBw4cSE3LY+dNIZMABwCN47OZd1kHuHjw0/EfCmm+6Va1K7oXLSu49JRqpnxNkEJPqVRKzduK/D1w3aEnfvX7feqpp1LT6uXFF18MwTmr1jVPPBDgAKBxfDbzLtsAp9oPqy1odg1XkakmRg8wxBdyNdPpNR+11MB11bx588LTpPZdNVV6QMI/4dqq6hHgRE3svnavntR8WuvrTWLx3yn/vjoAQP34bOZdtgEOtdPFeP369aFmTO9ea3TgVXBQM6G2p9o/eyIVAAD8h89mHgEOAACgYHw28whwAAAABeOzmUeAAwAAKBifzTwCHAAAQMH4bOYR4LpBr3no6vu96k3br/c+6LUhjXjytDfZC5b9eHSm345+x348AKAYfDbzCHBdpPejxe8x01OU8aCX1PZGgNi6dWvo3kmvg/DTuku9Hqj3Az8+i16XYe/aq6VHhJj6iLVh8+bNNQfRJ554IpSvBu2rDyB33HFHGG/dTMW681LdmHpBUG8Z+qxjt0Fdfak3A/VG4ZcpOh2PXuLsxwMAms9nM48A1wUKALroxd1JKcDpIqhO2dVJu17DoXed+WXrrSg1cDr+rgQ4BU4FT/U0oCCnfj19/6uVWHhW11bqPkovovVlUKkGTmFTwcuPr5W61VIfp/qs9Sh4qtuqbdu2hRB36NCh1DLV6HUqcX+4vU2vb1G51PM/AQCA+vDZzCPAdcHMmTNDn6HxOB9gFCAa9RLcIvLHX41qwlSLZt9Vs/Xwww+n5sviQ9i5c+dCrZyfL4tftqu0LXX8rs/+Zb2vvfZaCKJ+mTwKmR988EGqF4zepH1Ql1hZfdICAJrLZzOPAFej4cOHh1oYX7vjA4xqM+y7OhVXzZz6m9SLa5csWRI6TVcNnqg2T7V2Gq+Aobfvax0Kiuqn0rahWp7Tp0+X16+aH9VAxZ3Ti4LF2bNnk48++igEI63T3rZv29MxaJv60zoxV02M1qmaRB8otB6Fl6lTp4aL/bp163KPvxYKwQsXLkyNzzN+/PjU8Ro1X86fPz8cgw9qOlZ1/q6Apf5d9Xn16tUhYCuQWbOoxM2kMZ3DOOT4AFcqlcrnS78Pbautra28Pisb1TSqtk5laOfHfk92frQu0WeVuaapjNXJvZqG9RvRtvQb0TT1oKH1qDeLxYsXh22rfLVe1Rhabwn6U+fX/371e1LPG0OHDu00HgDQXD6beQS4GilAKHz58T7APPfcc+H+NJuu8Wr6u//++8N3a65SM2JcE9XR0VHuWFwXZd2LZvPqwmvNd0a9JfhAo2ARNytu3Lgx7LdtT6HN+jdV86XuGYuX13H4AKcL/g033FD+rP287bbbytP98dfiz3/+cwgoFkIUqPy+eDo2f7xZfIDLG6/ybW9vL3cjpuPQ93gefy5E61m2bFk4BwpbatZV2WrapEmTQtC1oGShS59VdjqPNk3HYwFL4VLTbRv6ren86bMFuKxpWr+Voygk/ulPfwqftV27H1DN+vE6Ytr/Rve+AQDoGp/NPAJcjfICnGqoVOv14YcfhlqgeLqCjQ9FootmHEj0Oe4cXLVDqqXRxV4Bwnc6XinAxTVDmm6hxW8vS1aAU7hSrY5qrqz7q/hi39UAp9pElaMeQFAfrC+99FK5djGPyn/t2rWp8V5WUMsbrwBlYUhB2ffvqbJXKI7HxQFONWrxPY8qfz8sWLAgTFNIs35nFbLjzuRVrn7YtWtXOP9WxrYN64JMn/VnXtmrrO23q9+Tn27rI8ABQLH4bOYR4GqkWifVkPgbvqsFmLwAZ8FBFK7igKjtqEZuwoQJmRfe7gS4agEoK8ApXOmGffvuL/bVjt+Lw4g9xKAA7OfzVP6qHYvL3z/AIJWCWqXxotqzBx54oFPtmDl//ny5Bs3E5ayHF+KaTY2fNm1aahui+/VUfmrm1rmOm2vzzk+1AJfX/KmyXblyZad7+GJqSlYwv+mmm1LTAADN47OZlxngrrnmmtSKcEW4DypuHpO8AKOLugKYaloUeuLgo1ob3cs0ceLEEGT0edGiRZ2WV42QAkQcWvr37x/WM2XKlLAv8XrzApxtb9++fWF7CmWrVq0K0/Tghdahe6FsX+14FE5Ua6QLvZrnfIBTE53Wq5Cp+81UMxUfg6faKM2vfdAxKFiIniz183r2FKq2r+1YbZb2zcpBQW3WrFmh7FVWtqwCk+afPHlysmnTpk41mjp/Kmdfy1n67n40vx9xOeu3oPNgtac6V6qVU3loWyrvODjq/jSVs1+nzo+W0+9BZaEysidU8wKc5tV37aeOX2VpTfG2Xq0r69Uq2le9AsXuhQQAFMOPfvSjVDbzMgOcFvQrw38ueLoYxjfg5wW4rGYxm6YLv0KIDdZcGi+vGiG91ywep4t01qBpeQFO61ZAVK2PBh2H1WBp//1gtXuzZ88uL6PaJh/gBg8eHJqPtZ+iQBDvr6dtvvvuu+XtKOToBv73338/ue6661Lzxx588MFQC2qDhb6sZku/nwqOCkgadO9h/CoYlb2GeFt6+ENByB4CiflyVlhU0LUAqAcYVBYaVHZ2XvWQgYKeDZpn7NixYZr/PWzZsqW87bwAJ3GZHDx4sNP78ezhBd80LPod63fgf3cAgOb68Y9/nMpmXmaAu/HGG1Mrw3/YvVtPPfVUahpaix7OUHhRUNNDHvE0PQGq8OqX6S7VEvrmaVGtojW/1pNqHxWWS6VSqF3001988cVO9+ABAIpDOcxnMy8zwN3+u9+lVob/o1onai1an2q1dD+ans7097nVm34v1uRr4/T6k0a9M1C1rQpuqmHzD2GIapOzahcBAM2nHOazmZcZ4Ob3Qk8CQF+jJt3169eH3jpEn/08AAAoh/ls5mUGuI0bNqRWBgAAgMZTDvPZzMsMcGcz3ncGAACAxrr66qtDDvPZzMsMcOJXCAAAgMbSK7Z8JstCgAMAACiIt956K5XJslQMcDfffHNqpQAAAGgcn8cqqRjgeBIVAACgd/k8VknFACcjR45MrRgAAAD1p9zls1gluQHO+mIEAABAYyl3+SxWSW6AE79yAAAA1FetDy+YqgHuV7/6VWojAAAAqJ9vLl5MZbA8VQPcha+/JsQBAAA0iHKWz1/VVA1w8v6WLamNAQAAoGeuvPLKZOv776eyVzU1BTjxGwQAAEDPTJgwIZW5alFzgHvnnXeS733ve6kNAwAAoOuUq3zeqlXNAU7UP5ffOAAAALqu1n5Ps3QpwMnPfvaz1A4AAACgNspSHUePpjJWV3Q5wO363/9Nrr322tTOAAAAoDplKZ+vuqrLAc74nQEAAEC+eXPnpjJVd3Q7wL1YKiVXXXVVascAAACQNnfOnFSe6q5uBzijp1P9DgIAAOA/rrnmmmRtF/o5rUWPA5z8/Oc/T+0sAAAArkj27N6dyk49VZcAZ/r165faaQAAgL7oH//4Ryor1UtdA9yB/fuT4cOHpw4AAACgL/n973+fykn1VNcAZ37605+mDgQAAKAvqPf9blkaEuDMqlWrkiGDB6cODAAA4HLyxhtvpHJQIzU0wJk//OEPyZVXXpk6WAAAgFZ27733Jh9s3ZrKPo3WKwHO27d3b3L7737HQw8AAKBlKLfM/O//DjnGZ5ve9v8BDjThls69OZkAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,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js9Pqfo2wHEPV2coPwAAesfnp1QEOBQa1PIbN25cdsMNNzRe63dj/Th1Ovfcc7Onnnoq1x9AmtH23sbg8fkpFQHOmTVrVs9/xH3mzJnZ+PHjc/1Hk3bLbyybOHFitnbt2mzTpk3ZL37xi1APPvvss2zx4sW5cZvR/p0yZUqufzfs378/++abb4b1U12aMWNGCJ9+/Crqc69ovSdNmpTr3y7Nr1f7pd/ovdBq2av+qc4X1b92dHt+mo8/5rb73ga6yeenVAS4E+69997s+x/Wf/78+dmFF16YHT16NHv77bdz43XDwYMHk06qOuns2bMnW7JkSbZs2bKwnrt3724M13Zu2LAhDNc6K4T4eaRKLb86XXvttYHvb2bPnp0dOnRoWL8XXnghu+aaa4b1O3LkSLZ58+bc9B9//HG2b9++XP8y2r+av+/fCZ1Qt23blt166625YapLqh9xONF4hw8fDvX5kksuCXVm3bp1uWm75Z133gnr4Pt3Qt2iRYty/dulrtv7JZXfT6OV3v+tlr3qn+p8t7arbH56Dz7yyCPZE088kX3++efhmK3+vu7pf/Wz15pP2TE39b0NdJPPT6kIcCfs3bs3+/TTTxuvn3766eyVV17JjdcNZQeTMhbg7PUDDzwQTsj2WttpB9vJkyd35SSRWn7tuvPOOzv6pH3dddeFFimtrx9mJkyYkG3dujU744wzwmu1LOzcuXNYC4PK7csvvwyf1P30CkEKd75/mV4EuIULF4YPFb6/FAU4be9XX33VeK1WRW2fn7Zb/Em0Gwhw9RmNAS4uO7U423vY172UAJf63ga6yeenVAS4EzTuLbfckuuvE/vdd98dWjPef//90AKmk6NaNebMmRNadm677bZs6dKlIQROmzatEbj0WuP7y14KX5pO66gWs5HuafIBTnQimjt3bvg/DnC/+c1vxlQLnIKJymf79u3ZRRddlBteRC2k+gSug68O4r51rchll13WOHlrn/htW7FiReH+N5qm2fCYThba31o/1Ys4GK5cuTJ75plnshtvvDHUg3hfWavv448/HsokDpOax3vvvZdblqiOLliwIATVeF5lJ2B9AFALrtVNra8Ni090+mtlpr9aX62/6saxY8dCvZ0+fXpo/T1w4EDYZrVgxq2YahXWen/yySfZc889F/bVqlWrsuuvvz7My8bT/+oXr6emveCC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>

[image4]: <data:image/png;base64,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>