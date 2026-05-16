import type { TownData } from "./types";

type TownDef = {
  id: string;
  name: string;
  classification: string;
  barangayCount: number;
  drivers: string[];
};

type ProvinceDef = {
  province: string;
  towns: TownDef[];
};

const provinces: ProvinceDef[] = [
  {
    province: "Aklan",
    towns: [
      { id: "altavas", name: "Altavas", classification: "4th Class", barangayCount: 14, drivers: ["Agriculture", "Fishery"] },
      { id: "balete", name: "Balete", classification: "4th Class", barangayCount: 10, drivers: ["Agriculture", "Tourism"] },
      { id: "banga", name: "Banga", classification: "4th Class", barangayCount: 16, drivers: ["Agriculture", "Poultry"] },
      { id: "batan", name: "Batan", classification: "5th Class", barangayCount: 20, drivers: ["Agriculture", "Fishing"] },
      { id: "buruanga", name: "Buruanga", classification: "5th Class", barangayCount: 15, drivers: ["Tourism", "Fishing"] },
      { id: "ibajay", name: "Ibajay", classification: "3rd Class", barangayCount: 35, drivers: ["Agriculture", "Tourism", "Trade"] },
      { id: "kalibo", name: "Kalibo", classification: "1st Class", barangayCount: 16, drivers: ["Commerce", "Tourism", "Government"] },
      { id: "lezo", name: "Lezo", classification: "5th Class", barangayCount: 12, drivers: ["Agriculture", "Handicraft"] },
      { id: "libacao", name: "Libacao", classification: "3rd Class", barangayCount: 24, drivers: ["Agriculture", "Forestry"] },
      { id: "madalag", name: "Madalag", classification: "4th Class", barangayCount: 25, drivers: ["Agriculture", "Mining"] },
      { id: "makato", name: "Makato", classification: "4th Class", barangayCount: 18, drivers: ["Agriculture", "Weaving"] },
      { id: "malay", name: "Malay", classification: "1st Class", barangayCount: 17, drivers: ["Tourism", "Commerce", "Real Estate"] },
      { id: "malinao", name: "Malinao", classification: "4th Class", barangayCount: 23, drivers: ["Agriculture", "Mining"] },
      { id: "nabas", name: "Nabas", classification: "4th Class", barangayCount: 20, drivers: ["Tourism", "Agriculture"] },
      { id: "new-washington", name: "New Washington", classification: "3rd Class", barangayCount: 16, drivers: ["Fishing", "Agriculture"] },
      { id: "numancia", name: "Numancia", classification: "4th Class", barangayCount: 12, drivers: ["Agriculture", "Commerce"] },
      { id: "tangalan", name: "Tangalan", classification: "5th Class", barangayCount: 15, drivers: ["Tourism", "Agriculture"] },
    ],
  },
  {
    province: "Antique",
    towns: [
      { id: "anini-y", name: "Anini-y", classification: "4th Class", barangayCount: 23, drivers: ["Tourism", "Fishing"] },
      { id: "barbaza", name: "Barbaza", classification: "4th Class", barangayCount: 19, drivers: ["Agriculture", "Fishing"] },
      { id: "belison", name: "Belison", classification: "5th Class", barangayCount: 11, drivers: ["Agriculture", "Fishing"] },
      { id: "bugasong", name: "Bugasong", classification: "3rd Class", barangayCount: 27, drivers: ["Agriculture", "Fishing"] },
      { id: "caluya", name: "Caluya", classification: "2nd Class", barangayCount: 18, drivers: ["Mining", "Fishing", "Tourism"] },
      { id: "culasi", name: "Culasi", classification: "3rd Class", barangayCount: 44, drivers: ["Agriculture", "Fishing", "Mining"] },
      { id: "hamtic", name: "Hamtic", classification: "3rd Class", barangayCount: 47, drivers: ["Agriculture", "Commerce"] },
      { id: "laua-an", name: "Laua-an", classification: "4th Class", barangayCount: 26, drivers: ["Agriculture", "Fishing"] },
      { id: "libertad", name: "Libertad", classification: "5th Class", barangayCount: 19, drivers: ["Agriculture", "Fishing"] },
      { id: "pandan", name: "Pandan", classification: "3rd Class", barangayCount: 34, drivers: ["Tourism", "Fishing", "Agriculture"] },
      { id: "patnongon", name: "Patnongon", classification: "4th Class", barangayCount: 14, drivers: ["Agriculture", "Fishing"] },
      { id: "san-jose", name: "San Jose de Buenavista", classification: "2nd Class", barangayCount: 28, drivers: ["Commerce", "Government", "Agriculture"] },
      { id: "san-remigio", name: "San Remigio", classification: "4th Class", barangayCount: 45, drivers: ["Agriculture", "Forestry"] },
      { id: "sebaste", name: "Sebaste", classification: "5th Class", barangayCount: 10, drivers: ["Fishing", "Tourism"] },
      { id: "sibalom", name: "Sibalom", classification: "3rd Class", barangayCount: 54, drivers: ["Agriculture", "Commerce"] },
      { id: "tibiao", name: "Tibiao", classification: "4th Class", barangayCount: 21, drivers: ["Tourism", "Agriculture"] },
      { id: "tobias-fornier", name: "Tobias Fornier", classification: "4th Class", barangayCount: 33, drivers: ["Agriculture", "Fishing"] },
      { id: "valderrama", name: "Valderrama", classification: "4th Class", barangayCount: 22, drivers: ["Agriculture", "Forestry"] },
    ],
  },
  {
    province: "Capiz",
    towns: [
      { id: "roxas-city", name: "Roxas City", classification: "1st Class", barangayCount: 47, drivers: ["Commerce", "Fishing", "Government", "Tourism"] },
      { id: "cuartero", name: "Cuartero", classification: "4th Class", barangayCount: 22, drivers: ["Agriculture", "Fishing"] },
      { id: "dao", name: "Dao", classification: "4th Class", barangayCount: 20, drivers: ["Agriculture", "Fishing"] },
      { id: "dumalag", name: "Dumalag", classification: "4th Class", barangayCount: 29, drivers: ["Agriculture", "Fishing"] },
      { id: "dumarao", name: "Dumarao", classification: "3rd Class", barangayCount: 33, drivers: ["Agriculture", "Fishing"] },
      { id: "ivisan", name: "Ivisan", classification: "4th Class", barangayCount: 15, drivers: ["Fishing", "Agriculture"] },
      { id: "jamindan", name: "Jamindan", classification: "4th Class", barangayCount: 30, drivers: ["Agriculture", "Mining"] },
      { id: "maayon", name: "Maayon", classification: "4th Class", barangayCount: 32, drivers: ["Agriculture", "Fishing"] },
      { id: "mambusao", name: "Mambusao", classification: "3rd Class", barangayCount: 26, drivers: ["Agriculture", "Commerce"] },
      { id: "panay", name: "Panay", classification: "3rd Class", barangayCount: 42, drivers: ["Agriculture", "Fishing", "Tourism"] },
      { id: "panitan", name: "Panitan", classification: "4th Class", barangayCount: 26, drivers: ["Agriculture", "Fishing"] },
      { id: "pilar", name: "Pilar", classification: "4th Class", barangayCount: 24, drivers: ["Agriculture", "Fishing"] },
      { id: "pontevedra-capiz", name: "Pontevedra", classification: "3rd Class", barangayCount: 26, drivers: ["Fishing", "Agriculture", "Commerce"] },
      { id: "president-roxas", name: "President Roxas", classification: "3rd Class", barangayCount: 22, drivers: ["Agriculture", "Fishing"] },
      { id: "sapi-an", name: "Sapi-an", classification: "5th Class", barangayCount: 10, drivers: ["Fishing", "Agriculture"] },
      { id: "sigma", name: "Sigma", classification: "5th Class", barangayCount: 10, drivers: ["Agriculture", "Fishing"] },
      { id: "tapaz", name: "Tapaz", classification: "3rd Class", barangayCount: 58, drivers: ["Agriculture", "Mining"] },
    ],
  },
  {
    province: "Guimaras",
    towns: [
      { id: "buenavista", name: "Buenavista", classification: "3rd Class", barangayCount: 37, drivers: ["Tourism", "Agriculture", "Fishing"] },
      { id: "jordan", name: "Jordan", classification: "3rd Class", barangayCount: 14, drivers: ["Tourism", "Agriculture", "Government"] },
      { id: "nueva-valencia", name: "Nueva Valencia", classification: "4th Class", barangayCount: 22, drivers: ["Tourism", "Fishing", "Agriculture"] },
      { id: "san-lorenzo", name: "San Lorenzo", classification: "4th Class", barangayCount: 12, drivers: ["Tourism", "Fishing"] },
      { id: "sibunag", name: "Sibunag", classification: "5th Class", barangayCount: 14, drivers: ["Agriculture", "Fishing"] },
    ],
  },
  {
    province: "Iloilo",
    towns: [
      { id: "iloilo-city", name: "Iloilo City", classification: "1st Class", barangayCount: 180, drivers: ["Commerce", "Government", "Education", "Tourism", "Industry"] },
      { id: "passi-city", name: "Passi City", classification: "2nd Class", barangayCount: 51, drivers: ["Agriculture", "Commerce", "Industry"] },
      { id: "ajuy", name: "Ajuy", classification: "3rd Class", barangayCount: 34, drivers: ["Fishing", "Agriculture"] },
      { id: "alimodian", name: "Alimodian", classification: "3rd Class", barangayCount: 25, drivers: ["Agriculture", "Handicraft"] },
      { id: "anilao", name: "Anilao", classification: "4th Class", barangayCount: 21, drivers: ["Agriculture", "Fishing"] },
      { id: "badiangan", name: "Badiangan", classification: "4th Class", barangayCount: 24, drivers: ["Agriculture", "Fishing"] },
      { id: "balasan", name: "Balasan", classification: "4th Class", barangayCount: 23, drivers: ["Fishing", "Tourism", "Agriculture"] },
      { id: "banate", name: "Banate", classification: "4th Class", barangayCount: 18, drivers: ["Fishing", "Agriculture"] },
      { id: "barotac-nuevo", name: "Barotac Nuevo", classification: "2nd Class", barangayCount: 29, drivers: ["Agriculture", "Fishing", "Commerce"] },
      { id: "barotac-viejo", name: "Barotac Viejo", classification: "3rd Class", barangayCount: 26, drivers: ["Agriculture", "Fishing"] },
      { id: "batad", name: "Batad", classification: "5th Class", barangayCount: 24, drivers: ["Agriculture", "Fishing"] },
      { id: "bingawan", name: "Bingawan", classification: "4th Class", barangayCount: 14, drivers: ["Agriculture", "Fishing"] },
      { id: "cabatuan", name: "Cabatuan", classification: "3rd Class", barangayCount: 28, drivers: ["Agriculture", "Commerce"] },
      { id: "calinog", name: "Calinog", classification: "2nd Class", barangayCount: 59, drivers: ["Agriculture", "Commerce"] },
      { id: "carles", name: "Carles", classification: "2nd Class", barangayCount: 33, drivers: ["Fishing", "Tourism", "Agriculture"] },
      { id: "concepcion", name: "Concepcion", classification: "3rd Class", barangayCount: 25, drivers: ["Fishing", "Tourism", "Agriculture"] },
      { id: "dingle", name: "Dingle", classification: "3rd Class", barangayCount: 33, drivers: ["Agriculture", "Commerce"] },
      { id: "dueñas", name: "Dueñas", classification: "3rd Class", barangayCount: 20, drivers: ["Agriculture", "Fishing"] },
      { id: "dumangas", name: "Dumangas", classification: "2nd Class", barangayCount: 45, drivers: ["Agriculture", "Fishing", "Commerce", "Industry"] },
      { id: "estancia", name: "Estancia", classification: "2nd Class", barangayCount: 26, drivers: ["Fishing", "Commerce", "Tourism"] },
      { id: "guimbal", name: "Guimbal", classification: "3rd Class", barangayCount: 33, drivers: ["Tourism", "Agriculture", "Fishing"] },
      { id: "igbaras", name: "Igbaras", classification: "3rd Class", barangayCount: 46, drivers: ["Agriculture", "Tourism"] },
      { id: "janiuay", name: "Janiuay", classification: "2nd Class", barangayCount: 60, drivers: ["Agriculture", "Commerce"] },
      { id: "lambunao", name: "Lambunao", classification: "2nd Class", barangayCount: 73, drivers: ["Agriculture", "Commerce"] },
      { id: "leganes", name: "Leganes", classification: "3rd Class", barangayCount: 18, drivers: ["Industry", "Commerce", "Agriculture"] },
      { id: "lemery", name: "Lemery", classification: "5th Class", barangayCount: 22, drivers: ["Agriculture", "Fishing"] },
      { id: "leon", name: "Leon", classification: "2nd Class", barangayCount: 49, drivers: ["Agriculture", "Commerce"] },
      { id: "maasin", name: "Maasin", classification: "4th Class", barangayCount: 50, drivers: ["Agriculture", "Fishing"] },
      { id: "miagao", name: "Miagao", classification: "1st Class", barangayCount: 78, drivers: ["Agriculture", "Tourism", "Education"] },
      { id: "mina", name: "Mina", classification: "5th Class", barangayCount: 22, drivers: ["Agriculture", "Fishing"] },
      { id: "new-lucena", name: "New Lucena", classification: "4th Class", barangayCount: 20, drivers: ["Agriculture", "Commerce"] },
      { id: "oton", name: "Oton", classification: "1st Class", barangayCount: 37, drivers: ["Commerce", "Industry", "Tourism", "Agriculture"] },
      { id: "pavia", name: "Pavia", classification: "1st Class", barangayCount: 18, drivers: ["Commerce", "Industry", "Real Estate"] },
      { id: "pototan", name: "Pototan", classification: "2nd Class", barangayCount: 50, drivers: ["Agriculture", "Commerce"] },
      { id: "san-dionisio", name: "San Dionisio", classification: "4th Class", barangayCount: 29, drivers: ["Fishing", "Agriculture"] },
      { id: "san-enrique-iloilo", name: "San Enrique", classification: "4th Class", barangayCount: 28, drivers: ["Agriculture", "Fishing"] },
      { id: "san-joaquin", name: "San Joaquin", classification: "2nd Class", barangayCount: 49, drivers: ["Agriculture", "Tourism", "Fishing"] },
      { id: "san-miguel", name: "San Miguel", classification: "4th Class", barangayCount: 24, drivers: ["Agriculture", "Fishing"] },
      { id: "san-rafael", name: "San Rafael", classification: "5th Class", barangayCount: 9, drivers: ["Agriculture", "Fishing"] },
      { id: "santa-barbara", name: "Santa Barbara", classification: "2nd Class", barangayCount: 25, drivers: ["Agriculture", "Commerce", "Tourism"] },
      { id: "sara", name: "Sara", classification: "3rd Class", barangayCount: 44, drivers: ["Agriculture", "Fishing"] },
      { id: "tigbauan", name: "Tigbauan", classification: "2nd Class", barangayCount: 52, drivers: ["Agriculture", "Fishing", "Tourism"] },
      { id: "tubungan", name: "Tubungan", classification: "4th Class", barangayCount: 48, drivers: ["Agriculture", "Handicraft"] },
      { id: "zarraga", name: "Zarraga", classification: "4th Class", barangayCount: 24, drivers: ["Agriculture", "Fishing"] },
    ],
  },
  {
    province: "Negros Occidental",
    towns: [
      { id: "bacolod-city", name: "Bacolod City", classification: "1st Class", barangayCount: 61, drivers: ["Commerce", "Government", "Education", "Tourism", "Industry"] },
      { id: "bago", name: "Bago", classification: "2nd Class", barangayCount: 24, drivers: ["Agriculture", "Fishing", "Commerce"] },
      { id: "binalbagan", name: "Binalbagan", classification: "3rd Class", barangayCount: 16, drivers: ["Agriculture", "Fishing"] },
      { id: "cadiz", name: "Cadiz", classification: "2nd Class", barangayCount: 22, drivers: ["Fishing", "Agriculture", "Commerce"] },
      { id: "calatrava", name: "Calatrava", classification: "3rd Class", barangayCount: 40, drivers: ["Agriculture", "Mining"] },
      { id: "candoni", name: "Candoni", classification: "4th Class", barangayCount: 9, drivers: ["Agriculture", "Forestry"] },
      { id: "cauayan", name: "Cauayan", classification: "3rd Class", barangayCount: 25, drivers: ["Agriculture", "Fishing", "Mining"] },
      { id: "eb-magalona", name: "Enrique B. Magalona", classification: "3rd Class", barangayCount: 23, drivers: ["Agriculture", "Fishing"] },
      { id: "escalante", name: "Escalante", classification: "3rd Class", barangayCount: 18, drivers: ["Fishing", "Agriculture", "Commerce"] },
      { id: "himamaylan", name: "Himamaylan", classification: "3rd Class", barangayCount: 19, drivers: ["Agriculture", "Fishing", "Commerce"] },
      { id: "hinigaran", name: "Hinigaran", classification: "2nd Class", barangayCount: 24, drivers: ["Agriculture", "Fishing"] },
      { id: "hinoba-an", name: "Hinoba-an", classification: "3rd Class", barangayCount: 13, drivers: ["Mining", "Agriculture", "Fishing"] },
      { id: "ilog", name: "Ilog", classification: "3rd Class", barangayCount: 15, drivers: ["Agriculture", "Fishing"] },
      { id: "isabela", name: "Isabela", classification: "2nd Class", barangayCount: 30, drivers: ["Agriculture", "Fishing", "Commerce"] },
      { id: "kabankalan", name: "Kabankalan", classification: "1st Class", barangayCount: 32, drivers: ["Agriculture", "Commerce", "Education"] },
      { id: "la-carlota", name: "La Carlota", classification: "3rd Class", barangayCount: 14, drivers: ["Agriculture", "Commerce"] },
      { id: "la-castellana", name: "La Castellana", classification: "3rd Class", barangayCount: 13, drivers: ["Agriculture", "Tourism"] },
      { id: "manapla", name: "Manapla", classification: "3rd Class", barangayCount: 12, drivers: ["Fishing", "Agriculture"] },
      { id: "moises-padilla", name: "Moises Padilla", classification: "4th Class", barangayCount: 15, drivers: ["Agriculture", "Forestry"] },
      { id: "murcia", name: "Murcia", classification: "2nd Class", barangayCount: 23, drivers: ["Agriculture", "Tourism"] },
      { id: "pontevedra-negros", name: "Pontevedra", classification: "3rd Class", barangayCount: 18, drivers: ["Agriculture", "Fishing"] },
      { id: "pulupandan", name: "Pulupandan", classification: "4th Class", barangayCount: 20, drivers: ["Fishing", "Commerce", "Industry"] },
      { id: "sagay", name: "Sagay", classification: "2nd Class", barangayCount: 25, drivers: ["Fishing", "Agriculture", "Tourism", "Commerce"] },
      { id: "san-carlos", name: "San Carlos", classification: "2nd Class", barangayCount: 18, drivers: ["Agriculture", "Commerce", "Industry"] },
      { id: "san-enrique-negros", name: "San Enrique", classification: "5th Class", barangayCount: 10, drivers: ["Agriculture", "Fishing"] },
      { id: "silay", name: "Silay", classification: "2nd Class", barangayCount: 16, drivers: ["Tourism", "Commerce", "Agriculture", "Industry"] },
      { id: "sipalay", name: "Sipalay", classification: "3rd Class", barangayCount: 17, drivers: ["Tourism", "Mining", "Fishing"] },
      { id: "talisay", name: "Talisay", classification: "3rd Class", barangayCount: 27, drivers: ["Commerce", "Industry", "Agriculture"] },
      { id: "toboso", name: "Toboso", classification: "4th Class", barangayCount: 9, drivers: ["Agriculture", "Fishing"] },
      { id: "valladolid", name: "Valladolid", classification: "3rd Class", barangayCount: 16, drivers: ["Agriculture", "Fishing"] },
      { id: "victorias", name: "Victorias", classification: "2nd Class", barangayCount: 16, drivers: ["Industry", "Commerce", "Agriculture"] },
    ],
  },
];

const barangayNamesPool: Record<string, string[]> = {
  Aklan: [
    "Poblacion", "Bakhaw Norte", "Bakhaw Sur", "Bilbao", "Cortez", "Dapdap", "Guadalupe",
    "Japlon", "Laguinbanwa", "Malanog", "Mangoso", "Nabaoy", "Pook", "Sampaguita",
    "Tigayon", "Tinigaw", "Tulang", "Union", "Baybay", "Bugo",
  ],
  Antique: [
    "Poblacion", "Agsirab", "Bacong", "Bagongbong", "Balanacan", "Batang", "Binitayan",
    "Buga", "Camba", "Candelaria", "Caneja", "Canoa", "Caygman", "Cruz", "Daga",
    "Ega", "Esperanza", "Igbacag", "Igang", "Igpasungaw",
  ],
  Capiz: [
    "Poblacion", "Agtambi", "Agtang", "Balijuagan", "Bato", "Baybay", "Bolo",
    "Buri", "Cabugao", "Cogon", "Cortes", "Culasi", "Dulangan", "Gabuan",
    "Gines", "Jagnaya", "Lanot", "Libertad", "Lico-an", "Linao",
  ],
  Guimaras: [
    "Poblacion", "Alaguisoc", "Alegria", "Ayangan", "Balanacan", "Bicolan", "Cabano",
    "Cabisi", "Calumpang", "Danao", "Dolores", "Gavino", "Ilog", "Lawi",
    "Maasin", "Mahayag", "Mchin", "Morobuan", "Panag-as", "Pandaraon",
  ],
  Iloilo: [
    "Poblacion", "Aglalana", "Aguisan", "Amamaros", "Ambil", "Aripdip", "Bagacay",
    "Balanacan", "Banate", "Bantayan", "Barosbos", "Batuan", "Bito-on", "Bolilao",
    "Bongco", "Bongulan", "Cabugao", "Cagay", "Camalig", "Camansi",
  ],
  "Negros Occidental": [
    "Poblacion", "Aguinaldo", "Alijis", "Alunan", "Ara-al", "Bacong", "Bagacay",
    "Bagtason", "Banago", "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4",
    "Barangay 5", "Barangay 6", "Barangay 7", "Barangay 8", "Barangay 9",
    "Barangay 10", "Barangay 11",
  ],
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateBarangays(townId: string, count: number, province: string): TownData["barangays"] {
  const rand = seededRandom(townId.charCodeAt(0) * 1000 + count);
  const pool = barangayNamesPool[province] || barangayNamesPool["Iloilo"];
  const names: string[] = [];
  const used = new Set<number>();
  const barangayCount = Math.min(count, Math.min(10, pool.length));

  for (let i = 0; i < barangayCount; i++) {
    let idx: number;
    do { idx = Math.floor(rand() * pool.length); } while (used.has(idx));
    used.add(idx);
    names.push(pool[idx]);
  }

  return names.map((name) => {
    const population = Math.floor(rand() * 14000 + 1000);
    const reportsFiled = Math.floor(rand() * 180 + 10);
    const resolutionRate = Math.floor(rand() * 35 + 60);
    const reportsResolved = Math.floor(reportsFiled * resolutionRate / 100);
    const ecoScore = Math.floor(rand() * 55 + 40);
    const activeIssues = Math.floor(rand() * 12);

    return {
      name,
      population,
      reportsFiled,
      reportsResolved,
      resolutionRate,
      ecoScore,
      activeIssues,
    };
  });
}

export const allTowns: TownData[] = provinces.flatMap((p) =>
  p.towns.map((t) => ({
    id: t.id,
    province: p.province,
    name: t.name,
    classification: t.classification,
    totalBarangays: t.barangayCount,
    primaryEconomicDrivers: t.drivers,
    barangays: generateBarangays(t.id, t.barangayCount, p.province),
  }))
);

export const allProvinces = provinces.map((p) => p.province);

export function getTownById(id: string): TownData | undefined {
  return allTowns.find((t) => t.id === id);
}

export function getTownsByProvince(province: string): TownData[] {
  return allTowns.filter((t) => t.province === province);
}

export function getProvinceSummary(province: string) {
  const towns = getTownsByProvince(province);
  return {
    province,
    totalTowns: towns.length,
    totalBarangays: towns.reduce((s, t) => s + t.totalBarangays, 0),
    totalReports: towns.reduce((s, t) => s + t.barangays.reduce((a, b) => a + b.reportsFiled, 0), 0),
    totalResolved: towns.reduce((s, t) => s + t.barangays.reduce((a, b) => a + b.reportsResolved, 0), 0),
    avgEcoScore: Math.round(
      towns.reduce((s, t) => s + t.barangays.reduce((a, b) => a + b.ecoScore, 0), 0) /
        Math.max(1, towns.reduce((s, t) => s + t.barangays.length, 0))
    ),
  };
}

export const overallSummary = () => ({
  totalTowns: allTowns.length,
  totalProvinces: allProvinces.length,
  totalBarangays: allTowns.reduce((s, t) => s + t.totalBarangays, 0),
  totalReports: allTowns.reduce((s, t) => s + t.barangays.reduce((a, b) => a + b.reportsFiled, 0), 0),
  totalResolved: allTowns.reduce((s, t) => s + t.barangays.reduce((a, b) => a + b.reportsResolved, 0), 0),
});
