export interface Law {
  code: string;
  title: string;
  issuing_agency: string;
  jurisdictionCode: "PH-NATIONAL" | "ID-NATIONAL";
}

export interface HazardType {
  code: string;
  name: string;
}

export interface LawReference extends Law {
  hazard_types: string[];
}

export interface HazardLawReference {
  code: string;
  name: string;
  law_code: string;
  law_title: string;
  issuing_agency: string;
}

export const LAW_REFERENCE: Record<string, LawReference> = {
  "RA-9729": {
    code: "RA-9729",
    title: "Climate Change Act of 2009",
    issuing_agency: "Climate Change Commission",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: [],
  },
  "RA-10121": {
    code: "RA-10121",
    title: "Disaster Risk Reduction and Management Act of 2010",
    issuing_agency: "NDRRMC",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: [],
  },
  "RA-9003": {
    code: "RA-9003",
    title: "Ecological Solid Waste Management Act of 2000",
    issuing_agency: "NSWMC",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: ["illegal_dumping"],
  },
  "RA-8749": {
    code: "RA-8749",
    title: "Philippine Clean Air Act of 1999",
    issuing_agency: "DENR-EMB",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: [
      "open_burning",
      "air_pollution",
      "peatland_fire",
      "transboundary_haze",
    ],
  },
  "RA-9275": {
    code: "RA-9275",
    title: "Philippine Clean Water Act of 2004",
    issuing_agency: "DENR-EMB",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: ["water_pollution", "coastal_erosion"],
  },
  "RA-6969": {
    code: "RA-6969",
    title: "Toxic Substances and Hazardous Wastes Control Act",
    issuing_agency: "DENR-EMB",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: ["chemical_spill"],
  },
  "PD-1586": {
    code: "PD-1586",
    title: "Environmental Impact Statement System",
    issuing_agency: "DENR",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: ["hydropower_displacement"],
  },
  "PD-1151": {
    code: "PD-1151",
    title: "Philippine Environmental Policy",
    issuing_agency: "DENR",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: [],
  },
  "PD-979": {
    code: "PD-979",
    title: "Marine Pollution Decree of 1976",
    issuing_agency: "Philippine Coast Guard",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: ["oil_spill"],
  },
  "PD-1067": {
    code: "PD-1067",
    title: "Water Code of the Philippines",
    issuing_agency: "NWRB",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: ["sand_mining", "sand_dredging"],
  },
  "PD-856": {
    code: "PD-856",
    title: "Code on Sanitation",
    issuing_agency: "DOH",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: [],
  },
  "RA-7611": {
    code: "RA-7611",
    title: "Strategic Environmental Plan for Palawan",
    issuing_agency: "PCSD",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: ["mangrove_clearing", "mangrove_conversion_aquaculture"],
  },
  "AM-09-6-8-SC": {
    code: "AM-09-6-8-SC",
    title: "Rules of Procedure for Environmental Cases (Writ of Kalikasan)",
    issuing_agency: "Supreme Court",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: [],
  },
  "PD-705": {
    code: "PD-705",
    title: "Revised Forestry Code of the Philippines",
    issuing_agency: "DENR",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: ["illegal_logging", "rubber_plantation_encroachment"],
  },
  "RA-9147": {
    code: "RA-9147",
    title: "Wildlife Resources Conservation and Protection Act",
    issuing_agency: "DENR",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: ["wildlife_trafficking", "coral_reef_damage"],
  },
  "RA-7586": {
    code: "RA-7586",
    title: "National Integrated Protected Areas System Act (NIPAS)",
    issuing_agency: "DENR",
    jurisdictionCode: "PH-NATIONAL",
    hazard_types: [],
  },
};

export const HAZARD_LAW_REFERENCE: Record<string, HazardLawReference> = {
  illegal_logging: {
    code: "illegal_logging",
    name: "Illegal Logging",
    law_code: "PD-705",
    law_title: "Revised Forestry Code of the Philippines",
    issuing_agency: "DENR",
  },
  open_burning: {
    code: "open_burning",
    name: "Open Burning",
    law_code: "RA-8749",
    law_title: "Philippine Clean Air Act of 1999",
    issuing_agency: "DENR-EMB",
  },
  mangrove_clearing: {
    code: "mangrove_clearing",
    name: "Mangrove Clearing",
    law_code: "RA-7611",
    law_title: "Strategic Environmental Plan for Palawan",
    issuing_agency: "PCSD",
  },
  oil_spill: {
    code: "oil_spill",
    name: "Oil Spill",
    law_code: "PD-979",
    law_title: "Marine Pollution Decree of 1976",
    issuing_agency: "Philippine Coast Guard",
  },
  wildlife_trafficking: {
    code: "wildlife_trafficking",
    name: "Wildlife Trafficking",
    law_code: "RA-9147",
    law_title: "Wildlife Resources Conservation and Protection Act",
    issuing_agency: "DENR",
  },
  coral_reef_damage: {
    code: "coral_reef_damage",
    name: "Coral Reef Damage",
    law_code: "RA-9147",
    law_title: "Wildlife Resources Conservation and Protection Act",
    issuing_agency: "DENR",
  },
  illegal_dumping: {
    code: "illegal_dumping",
    name: "Illegal Dumping",
    law_code: "RA-9003",
    law_title: "Ecological Solid Waste Management Act of 2000",
    issuing_agency: "NSWMC",
  },
  chemical_spill: {
    code: "chemical_spill",
    name: "Chemical Spill",
    law_code: "RA-6969",
    law_title: "Toxic Substances and Hazardous Wastes Control Act",
    issuing_agency: "DENR-EMB",
  },
  sand_mining: {
    code: "sand_mining",
    name: "Sand Mining",
    law_code: "PD-1067",
    law_title: "Water Code of the Philippines",
    issuing_agency: "NWRB",
  },
  water_pollution: {
    code: "water_pollution",
    name: "Water Pollution",
    law_code: "RA-9275",
    law_title: "Philippine Clean Water Act of 2004",
    issuing_agency: "DENR-EMB",
  },
  air_pollution: {
    code: "air_pollution",
    name: "Air Pollution",
    law_code: "RA-8749",
    law_title: "Philippine Clean Air Act of 1999",
    issuing_agency: "DENR-EMB",
  },
  coastal_erosion: {
    code: "coastal_erosion",
    name: "Coastal Erosion",
    law_code: "RA-9275",
    law_title: "Philippine Clean Water Act of 2004",
    issuing_agency: "DENR-EMB",
  },
  peatland_fire: {
    code: "peatland_fire",
    name: "Peatland Fire",
    law_code: "RA-8749",
    law_title: "Philippine Clean Air Act of 1999",
    issuing_agency: "DENR-EMB",
  },
  transboundary_haze: {
    code: "transboundary_haze",
    name: "Transboundary Haze",
    law_code: "RA-8749",
    law_title: "Philippine Clean Air Act of 1999",
    issuing_agency: "DENR-EMB",
  },
  rubber_plantation_encroachment: {
    code: "rubber_plantation_encroachment",
    name: "Rubber Plantation Encroachment",
    law_code: "PD-705",
    law_title: "Revised Forestry Code of the Philippines",
    issuing_agency: "DENR",
  },
  hydropower_displacement: {
    code: "hydropower_displacement",
    name: "Hydropower Displacement",
    law_code: "PD-1586",
    law_title: "Environmental Impact Statement System",
    issuing_agency: "DENR",
  },
  sand_dredging: {
    code: "sand_dredging",
    name: "Sand Dredging",
    law_code: "PD-1067",
    law_title: "Water Code of the Philippines",
    issuing_agency: "NWRB",
  },
  mangrove_conversion_aquaculture: {
    code: "mangrove_conversion_aquaculture",
    name: "Mangrove to Aquaculture Conversion",
    law_code: "RA-7611",
    law_title: "Strategic Environmental Plan for Palawan",
    issuing_agency: "PCSD",
  },
};

export interface LawAgencyReference {
  law_code: string;
  law_title: string;
  agency_id: string;
  agency_name: string;
  focus: string;
  region: string;
}

export const LAW_AGENCY_REFERENCE: Record<string, LawAgencyReference> = {
  "RA-9003": {
    law_code: "RA-9003",
    law_title: "Ecological Solid Waste Management Act of 2000",
    agency_id: "ngo-green-dingle-initiative",
    agency_name: "Green Dingle Initiative",
    focus: "solid-waste",
    region: "Western Visayas",
  },
  "RA-8749": {
    law_code: "RA-8749",
    law_title: "Philippine Clean Air Act of 1999",
    agency_id: "ngo-bantay-kalikasan",
    agency_name: "Bantay Kalikasan",
    focus: "environmental-protection",
    region: "National",
  },
  "RA-9275": {
    law_code: "RA-9275",
    law_title: "Philippine Clean Water Act of 2004",
    agency_id: "ngo-coastal-guardians-ph",
    agency_name: "Coastal Guardians PH",
    focus: "marine-protection",
    region: "Western Visayas",
  },
  "PD-705": {
    law_code: "PD-705",
    law_title: "Revised Forestry Code of the Philippines",
    agency_id: "ngo-forest-watch-negros",
    agency_name: "Forest Watch Negros",
    focus: "forestry",
    region: "Negros Occidental",
  },
  "RA-9147": {
    law_code: "RA-9147",
    law_title: "Wildlife Resources Conservation and Protection Act",
    agency_id: "ngo-panay-eco-warriors",
    agency_name: "Panay Eco Warriors",
    focus: "wildlife-protection",
    region: "Western Visayas",
  },
  "RA-7611": {
    law_code: "RA-7611",
    law_title: "Strategic Environmental Plan for Palawan",
    agency_id: "ngo-coastal-guardians-ph",
    agency_name: "Coastal Guardians PH",
    focus: "marine-protection",
    region: "Western Visayas",
  },
  "PD-979": {
    law_code: "PD-979",
    law_title: "Marine Pollution Decree of 1976",
    agency_id: "ngo-coastal-guardians-ph",
    agency_name: "Coastal Guardians PH",
    focus: "marine-protection",
    region: "Western Visayas",
  },
  "RA-6969": {
    law_code: "RA-6969",
    law_title: "Toxic Substances and Hazardous Wastes Control Act",
    agency_id: "ngo-bantay-kalikasan",
    agency_name: "Bantay Kalikasan",
    focus: "environmental-protection",
    region: "National",
  },
  "RA-9729": {
    law_code: "RA-9729",
    law_title: "Climate Change Act of 2009",
    agency_id: "ngo-bantay-kalikasan",
    agency_name: "Bantay Kalikasan",
    focus: "environmental-protection",
    region: "National",
  },
  "RA-10121": {
    law_code: "RA-10121",
    law_title: "Disaster Risk Reduction and Management Act of 2010",
    agency_id: "ngo-bantay-kalikasan",
    agency_name: "Bantay Kalikasan",
    focus: "environmental-protection",
    region: "National",
  },
};

// ===========================================================================
// INDONESIA COMPARISON LAYER
// Overlapping hazard types (illegal_dumping, open_burning, peatland_fire)
// to enable PH vs ID cross-jurisdiction analysis.
// ===========================================================================

export interface IndonesiaLawReference extends LawReference {}
export interface IndonesiaHazardLawReference extends HazardLawReference {}
export interface IndonesiaLawAgencyReference extends LawAgencyReference {}

export const ID_LAW_REFERENCE: Record<string, IndonesiaLawReference> = {
  "UU-18-2008": {
    code: "UU-18-2008",
    title: "Waste Management (Pengelolaan Sampah)",
    issuing_agency: "KLHK",
    jurisdictionCode: "ID-NATIONAL",
    hazard_types: ["illegal_dumping"],
  },
  "UU-32-2009": {
    code: "UU-32-2009",
    title: "Environmental Protection and Management (PPLH)",
    issuing_agency: "KLHK",
    jurisdictionCode: "ID-NATIONAL",
    hazard_types: ["open_burning"],
  },
  "PP-71-2014": {
    code: "PP-71-2014",
    title: "Peatland Ecosystem Protection and Management",
    issuing_agency: "KLHK",
    jurisdictionCode: "ID-NATIONAL",
    hazard_types: ["peatland_fire"],
  },
};

export const ID_HAZARD_LAW_REFERENCE: Record<
  string,
  IndonesiaHazardLawReference
> = {
  illegal_dumping: {
    code: "illegal_dumping",
    name: "Illegal Dumping",
    law_code: "UU-18-2008",
    law_title: "Waste Management (Pengelolaan Sampah)",
    issuing_agency: "KLHK",
  },
  open_burning: {
    code: "open_burning",
    name: "Open Burning",
    law_code: "UU-32-2009",
    law_title: "Environmental Protection and Management (PPLH)",
    issuing_agency: "KLHK",
  },
  peatland_fire: {
    code: "peatland_fire",
    name: "Peatland Fire",
    law_code: "PP-71-2014",
    law_title: "Peatland Ecosystem Protection and Management",
    issuing_agency: "KLHK",
  },
};

export const ID_LAW_AGENCY_REFERENCE: Record<
  string,
  IndonesiaLawAgencyReference
> = {
  "UU-18-2008": {
    law_code: "UU-18-2008",
    law_title: "Waste Management (Pengelolaan Sampah)",
    agency_id: "dlhk-dki-jakarta",
    agency_name: "Dinas Lingkungan Hidup DKI Jakarta",
    focus: "waste-management",
    region: "DKI Jakarta",
  },
  "UU-32-2009": {
    law_code: "UU-32-2009",
    law_title: "Environmental Protection and Management (PPLH)",
    agency_id: "klhk",
    agency_name: "Kementerian Lingkungan Hidup dan Kehutanan",
    focus: "environmental-protection",
    region: "National",
  },
  "PP-71-2014": {
    law_code: "PP-71-2014",
    law_title: "Peatland Ecosystem Protection and Management",
    agency_id: "klhk",
    agency_name: "Kementerian Lingkungan Hidup dan Kehutanan",
    focus: "environmental-protection",
    region: "National",
  },
};

// ---------------------------------------------------------------------------
// PH vs ID Comparison Table
// ---------------------------------------------------------------------------

export interface JurisdictionEntry {
  law_code: string;
  law_title: string;
  issuing_agency: string;
  enforcement_agency: string;
  enforcement_region: string;
}

export interface HazardComparison {
  hazard_type: string;
  hazard_name: string;
  philippines: JurisdictionEntry;
  indonesia: JurisdictionEntry;
}

export const HAZARD_COMPARISON: HazardComparison[] = [
  {
    hazard_type: "illegal_dumping",
    hazard_name: "Illegal Dumping",
    philippines: {
      law_code: "RA-9003",
      law_title: "Ecological Solid Waste Management Act of 2000",
      issuing_agency: "NSWMC",
      enforcement_agency: "Green Dingle Initiative",
      enforcement_region: "Western Visayas",
    },
    indonesia: {
      law_code: "UU-18-2008",
      law_title: "Waste Management (Pengelolaan Sampah)",
      issuing_agency: "KLHK",
      enforcement_agency: "Dinas Lingkungan Hidup DKI Jakarta",
      enforcement_region: "DKI Jakarta",
    },
  },
  {
    hazard_type: "open_burning",
    hazard_name: "Open Burning",
    philippines: {
      law_code: "RA-8749",
      law_title: "Philippine Clean Air Act of 1999",
      issuing_agency: "DENR-EMB",
      enforcement_agency: "Bantay Kalikasan",
      enforcement_region: "National",
    },
    indonesia: {
      law_code: "UU-32-2009",
      law_title: "Environmental Protection and Management (PPLH)",
      issuing_agency: "KLHK",
      enforcement_agency: "Kementerian Lingkungan Hidup dan Kehutanan",
      enforcement_region: "National",
    },
  },
  {
    hazard_type: "peatland_fire",
    hazard_name: "Peatland Fire",
    philippines: {
      law_code: "RA-8749",
      law_title: "Philippine Clean Air Act of 1999",
      issuing_agency: "DENR-EMB",
      enforcement_agency: "Bantay Kalikasan",
      enforcement_region: "National",
    },
    indonesia: {
      law_code: "PP-71-2014",
      law_title: "Peatland Ecosystem Protection and Management",
      issuing_agency: "KLHK",
      enforcement_agency: "Kementerian Lingkungan Hidup dan Kehutanan",
      enforcement_region: "National",
    },
  },
];
