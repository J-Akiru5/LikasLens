export interface BarangayMetrics {
  name: string;
  classification: "urban" | "rural";
  population: number;
  households: number;
  landAreaKm2: number;
  economicDrivers: string[];
  environmentalScore: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  reportedIncidents: number;
  resolvedIncidents: number;
}

export interface TownData {
  name: string;
  province: Province;
  classification: "city" | "municipality";
  totalBarangays: number;
  economicDrivers: string[];
  barangays: BarangayMetrics[];
  totalReportedIncidents: number;
  totalResolvedIncidents: number;
  avgEnvironmentalScore: number;
}

export type Province =
  | "Aklan"
  | "Antique"
  | "Capiz"
  | "Guimaras"
  | "Iloilo"
  | "Negros Occidental";

const BARANGAY_POOL: string[] = [
  "Poblacion", "Ilaya", "Iraya", "Daan Sur", "Daan Norte",
  "Mabini", "Rizal", "Bonifacio", "Magsaysay", "Luna",
  "Burgos", "Del Carmen", "San Roque", "San Jose", "San Miguel",
  "San Isidro", "Santo Niño", "Santo Rosario", "San Nicolas", "San Vicente",
  "Santa Cruz", "Santa Monica", "Santa Teresa", "Santa Maria", "San Juan",
  "San Antonio", "San Francisco", "San Martin", "San Pedro", "San Pablo",
  "Buenavista", "Libertad", "Progresso", "Alegria", "Calumpang",
  "Tabucan", "Talon", "Baybay", "Mountain View", "Riverside",
  "New Settlement", "Upper Bgy.", "Lower Bgy.", "East Side", "West Side",
  "Sitio Lawis", "Sitio Dacal", "Sitio Manggahan", "Sitio Baybayon", "Sitio Kahoy",
  "Katipunan", "Maharlika", "Maligaya", "Masagana", "Pag-asa",
  "Bagong Silang", "Bagumbayan", "Balintawak", "Pulang Lupa", "Pinagbuhatan",
];

const PROVINCE_DRIVERS: Record<Province, string[]> = {
  "Aklan": ["Tourism", "Coconut Farming", "Fishing", "Aquaculture", "Handicraft Weaving"],
  "Antique": ["Fishing", "Rice Farming", "Coconut Farming", "Ecotourism", "Mining"],
  "Capiz": ["Fishing", "Aquaculture", "Rice Farming", "Seaweed Farming", "Commerce"],
  "Guimaras": ["Mango Farming", "Tourism", "Fishing", "Coconut Farming", "Handicraft"],
  "Iloilo": ["Rice Farming", "Sugarcane", "Fishing", "Commerce", "Aquaculture"],
  "Negros Occidental": ["Sugarcane", "Fishing", "Rice Farming", "Commerce", "Livestock"],
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateBarangays(
  townName: string,
  classification: "city" | "municipality",
): BarangayMetrics[] {
  const seed = hashCode(townName.toLowerCase());
  const rand = seededRandom(seed);
  const count = classification === "city"
    ? 12 + Math.floor(rand() * 20)
    : 8 + Math.floor(rand() * 10);

  const selectedNames: string[] = [];
  const used = new Set<number>();
  const bgyCount = Math.min(count, BARANGAY_POOL.length);
  for (let i = 0; i < bgyCount; i++) {
    let idx = Math.floor(rand() * BARANGAY_POOL.length);
    while (used.has(idx)) idx = (idx + 1) % BARANGAY_POOL.length;
    used.add(idx);
    const suffix = i > 0 && idx === 0 ? ` ${i + 1}` : "";
    selectedNames.push(BARANGAY_POOL[idx] + suffix);
  }

  return selectedNames.map((name, i) => {
    const isUrban = i < Math.ceil(count * 0.3);
    const pop = isUrban
      ? Math.floor(1500 + rand() * 8500)
      : Math.floor(300 + rand() * 2500);
    const hh = Math.floor(pop / (3.8 + rand() * 1.2));

    const envScore = Math.floor(
      (isUrban ? 35 : 55) + rand() * (isUrban ? 40 : 37),
    );
    const riskLevel = envScore >= 80 ? "low"
      : envScore >= 60 ? "moderate"
      : envScore >= 40 ? "high"
      : "critical";

    const reported = Math.floor(rand() * (isUrban ? 25 : 12)) + (riskLevel === "critical" ? 5 : 1);
    const resolved = Math.floor(reported * (0.45 + rand() * 0.4));

    return {
      name,
      classification: isUrban ? "urban" : "rural",
      population: pop,
      households: hh,
      landAreaKm2: Math.round((0.5 + rand() * 4.5) * 100) / 100,
      economicDrivers: isUrban ? ["Commerce", "Services"] : ["Farming", "Fishing"],
      environmentalScore: envScore,
      riskLevel,
      reportedIncidents: reported,
      resolvedIncidents: resolved,
    };
  });
}

interface TownDef {
  name: string;
  province: Province;
  classification: "city" | "municipality";
  totalBarangays: number;
}

const TOWNS: TownDef[] = [
  // --- Aklan ---
  { name: "Altavas", province: "Aklan", classification: "municipality", totalBarangays: 14 },
  { name: "Balete", province: "Aklan", classification: "municipality", totalBarangays: 10 },
  { name: "Banga", province: "Aklan", classification: "municipality", totalBarangays: 16 },
  { name: "Batan", province: "Aklan", classification: "municipality", totalBarangays: 20 },
  { name: "Buruanga", province: "Aklan", classification: "municipality", totalBarangays: 15 },
  { name: "Ibajay", province: "Aklan", classification: "municipality", totalBarangays: 35 },
  { name: "Kalibo", province: "Aklan", classification: "municipality", totalBarangays: 16 },
  { name: "Lezo", province: "Aklan", classification: "municipality", totalBarangays: 12 },
  { name: "Libacao", province: "Aklan", classification: "municipality", totalBarangays: 24 },
  { name: "Madalag", province: "Aklan", classification: "municipality", totalBarangays: 25 },
  { name: "Makato", province: "Aklan", classification: "municipality", totalBarangays: 18 },
  { name: "Malay", province: "Aklan", classification: "municipality", totalBarangays: 17 },
  { name: "Malinao", province: "Aklan", classification: "municipality", totalBarangays: 23 },
  { name: "Nabas", province: "Aklan", classification: "municipality", totalBarangays: 20 },
  { name: "New Washington", province: "Aklan", classification: "municipality", totalBarangays: 16 },
  { name: "Numancia", province: "Aklan", classification: "municipality", totalBarangays: 12 },
  { name: "Tangalan", province: "Aklan", classification: "municipality", totalBarangays: 15 },
  // --- Antique ---
  { name: "Anini-y", province: "Antique", classification: "municipality", totalBarangays: 23 },
  { name: "Barbaza", province: "Antique", classification: "municipality", totalBarangays: 39 },
  { name: "Belison", province: "Antique", classification: "municipality", totalBarangays: 11 },
  { name: "Bugasong", province: "Antique", classification: "municipality", totalBarangays: 27 },
  { name: "Caluya", province: "Antique", classification: "municipality", totalBarangays: 18 },
  { name: "Culasi", province: "Antique", classification: "municipality", totalBarangays: 44 },
  { name: "Hamtic", province: "Antique", classification: "municipality", totalBarangays: 47 },
  { name: "Laua-an", province: "Antique", classification: "municipality", totalBarangays: 40 },
  { name: "Libertad", province: "Antique", classification: "municipality", totalBarangays: 19 },
  { name: "Pandan", province: "Antique", classification: "municipality", totalBarangays: 34 },
  { name: "Patnongon", province: "Antique", classification: "municipality", totalBarangays: 36 },
  { name: "San Jose de Buenavista", province: "Antique", classification: "municipality", totalBarangays: 28 },
  { name: "San Remigio", province: "Antique", classification: "municipality", totalBarangays: 45 },
  { name: "Sebaste", province: "Antique", classification: "municipality", totalBarangays: 10 },
  { name: "Sibalom", province: "Antique", classification: "municipality", totalBarangays: 76 },
  { name: "Tibiao", province: "Antique", classification: "municipality", totalBarangays: 21 },
  { name: "Tobias Fornier", province: "Antique", classification: "municipality", totalBarangays: 50 },
  { name: "Valderrama", province: "Antique", classification: "municipality", totalBarangays: 22 },
  // --- Capiz ---
  { name: "Roxas City", province: "Capiz", classification: "city", totalBarangays: 47 },
  { name: "Cuartero", province: "Capiz", classification: "municipality", totalBarangays: 22 },
  { name: "Dao", province: "Capiz", classification: "municipality", totalBarangays: 20 },
  { name: "Dumalag", province: "Capiz", classification: "municipality", totalBarangays: 19 },
  { name: "Dumarao", province: "Capiz", classification: "municipality", totalBarangays: 33 },
  { name: "Ivisan", province: "Capiz", classification: "municipality", totalBarangays: 15 },
  { name: "Jamindan", province: "Capiz", classification: "municipality", totalBarangays: 30 },
  { name: "Maayon", province: "Capiz", classification: "municipality", totalBarangays: 32 },
  { name: "Mambusao", province: "Capiz", classification: "municipality", totalBarangays: 26 },
  { name: "Panay", province: "Capiz", classification: "municipality", totalBarangays: 42 },
  { name: "Panitan", province: "Capiz", classification: "municipality", totalBarangays: 26 },
  { name: "Pilar", province: "Capiz", classification: "municipality", totalBarangays: 24 },
  { name: "Pontevedra", province: "Capiz", classification: "municipality", totalBarangays: 26 },
  { name: "President Roxas", province: "Capiz", classification: "municipality", totalBarangays: 22 },
  { name: "Sapi-an", province: "Capiz", classification: "municipality", totalBarangays: 10 },
  { name: "Sigma", province: "Capiz", classification: "municipality", totalBarangays: 21 },
  { name: "Tapaz", province: "Capiz", classification: "municipality", totalBarangays: 58 },
  // --- Guimaras ---
  { name: "Buenavista", province: "Guimaras", classification: "municipality", totalBarangays: 36 },
  { name: "Jordan", province: "Guimaras", classification: "municipality", totalBarangays: 14 },
  { name: "Nueva Valencia", province: "Guimaras", classification: "municipality", totalBarangays: 22 },
  { name: "San Lorenzo", province: "Guimaras", classification: "municipality", totalBarangays: 12 },
  { name: "Sibunag", province: "Guimaras", classification: "municipality", totalBarangays: 16 },
  // --- Iloilo ---
  { name: "Iloilo City", province: "Iloilo", classification: "city", totalBarangays: 180 },
  { name: "Passi City", province: "Iloilo", classification: "city", totalBarangays: 51 },
  { name: "Ajuy", province: "Iloilo", classification: "municipality", totalBarangays: 34 },
  { name: "Alimodian", province: "Iloilo", classification: "municipality", totalBarangays: 25 },
  { name: "Anilao", province: "Iloilo", classification: "municipality", totalBarangays: 21 },
  { name: "Badiangan", province: "Iloilo", classification: "municipality", totalBarangays: 31 },
  { name: "Balasan", province: "Iloilo", classification: "municipality", totalBarangays: 23 },
  { name: "Banate", province: "Iloilo", classification: "municipality", totalBarangays: 18 },
  { name: "Barotac Nuevo", province: "Iloilo", classification: "municipality", totalBarangays: 29 },
  { name: "Barotac Viejo", province: "Iloilo", classification: "municipality", totalBarangays: 26 },
  { name: "Batad", province: "Iloilo", classification: "municipality", totalBarangays: 24 },
  { name: "Bingawan", province: "Iloilo", classification: "municipality", totalBarangays: 14 },
  { name: "Cabatuan", province: "Iloilo", classification: "municipality", totalBarangays: 39 },
  { name: "Calinog", province: "Iloilo", classification: "municipality", totalBarangays: 59 },
  { name: "Carles", province: "Iloilo", classification: "municipality", totalBarangays: 33 },
  { name: "Concepcion", province: "Iloilo", classification: "municipality", totalBarangays: 25 },
  { name: "Dingle", province: "Iloilo", classification: "municipality", totalBarangays: 33 },
  { name: "Dueñas", province: "Iloilo", classification: "municipality", totalBarangays: 20 },
  { name: "Dumangas", province: "Iloilo", classification: "municipality", totalBarangays: 45 },
  { name: "Estancia", province: "Iloilo", classification: "municipality", totalBarangays: 25 },
  { name: "Guimbal", province: "Iloilo", classification: "municipality", totalBarangays: 33 },
  { name: "Igbaras", province: "Iloilo", classification: "municipality", totalBarangays: 46 },
  { name: "Janiuay", province: "Iloilo", classification: "municipality", totalBarangays: 45 },
  { name: "Lambunao", province: "Iloilo", classification: "municipality", totalBarangays: 73 },
  { name: "Leganes", province: "Iloilo", classification: "municipality", totalBarangays: 18 },
  { name: "Lemery", province: "Iloilo", classification: "municipality", totalBarangays: 22 },
  { name: "Leon", province: "Iloilo", classification: "municipality", totalBarangays: 49 },
  { name: "Maasin", province: "Iloilo", classification: "municipality", totalBarangays: 22 },
  { name: "Miagao", province: "Iloilo", classification: "municipality", totalBarangays: 66 },
  { name: "Mina", province: "Iloilo", classification: "municipality", totalBarangays: 22 },
  { name: "New Lucena", province: "Iloilo", classification: "municipality", totalBarangays: 16 },
  { name: "Oton", province: "Iloilo", classification: "municipality", totalBarangays: 37 },
  { name: "Pavia", province: "Iloilo", classification: "municipality", totalBarangays: 18 },
  { name: "Pototan", province: "Iloilo", classification: "municipality", totalBarangays: 50 },
  { name: "San Dionisio", province: "Iloilo", classification: "municipality", totalBarangays: 29 },
  { name: "San Enrique", province: "Iloilo", classification: "municipality", totalBarangays: 28 },
  { name: "San Joaquin", province: "Iloilo", classification: "municipality", totalBarangays: 85 },
  { name: "San Miguel", province: "Iloilo", classification: "municipality", totalBarangays: 24 },
  { name: "San Rafael", province: "Iloilo", classification: "municipality", totalBarangays: 9 },
  { name: "Santa Barbara", province: "Iloilo", classification: "municipality", totalBarangays: 25 },
  { name: "Sara", province: "Iloilo", classification: "municipality", totalBarangays: 42 },
  { name: "Tigbauan", province: "Iloilo", classification: "municipality", totalBarangays: 52 },
  { name: "Tubungan", province: "Iloilo", classification: "municipality", totalBarangays: 33 },
  { name: "Zarraga", province: "Iloilo", classification: "municipality", totalBarangays: 24 },
  // --- Negros Occidental ---
  { name: "Bacolod City", province: "Negros Occidental", classification: "city", totalBarangays: 61 },
  { name: "Bago City", province: "Negros Occidental", classification: "city", totalBarangays: 24 },
  { name: "Binalbagan", province: "Negros Occidental", classification: "municipality", totalBarangays: 16 },
  { name: "Cadiz City", province: "Negros Occidental", classification: "city", totalBarangays: 22 },
  { name: "Calatrava", province: "Negros Occidental", classification: "municipality", totalBarangays: 40 },
  { name: "Candoni", province: "Negros Occidental", classification: "municipality", totalBarangays: 10 },
  { name: "Cauayan", province: "Negros Occidental", classification: "municipality", totalBarangays: 25 },
  { name: "Enrique B. Magalona", province: "Negros Occidental", classification: "municipality", totalBarangays: 23 },
  { name: "Escalante City", province: "Negros Occidental", classification: "city", totalBarangays: 21 },
  { name: "Himamaylan City", province: "Negros Occidental", classification: "city", totalBarangays: 19 },
  { name: "Hinigaran", province: "Negros Occidental", classification: "municipality", totalBarangays: 24 },
  { name: "Hinoba-an", province: "Negros Occidental", classification: "municipality", totalBarangays: 13 },
  { name: "Ilog", province: "Negros Occidental", classification: "municipality", totalBarangays: 15 },
  { name: "Isabela", province: "Negros Occidental", classification: "municipality", totalBarangays: 30 },
  { name: "Kabankalan City", province: "Negros Occidental", classification: "city", totalBarangays: 32 },
  { name: "La Carlota City", province: "Negros Occidental", classification: "city", totalBarangays: 14 },
  { name: "La Castellana", province: "Negros Occidental", classification: "municipality", totalBarangays: 13 },
  { name: "Manapla", province: "Negros Occidental", classification: "municipality", totalBarangays: 12 },
  { name: "Moises Padilla", province: "Negros Occidental", classification: "municipality", totalBarangays: 15 },
  { name: "Murcia", province: "Negros Occidental", classification: "municipality", totalBarangays: 23 },
  { name: "Pontevedra", province: "Negros Occidental", classification: "municipality", totalBarangays: 20 },
  { name: "Pulupandan", province: "Negros Occidental", classification: "municipality", totalBarangays: 20 },
  { name: "Sagay City", province: "Negros Occidental", classification: "city", totalBarangays: 25 },
  { name: "San Carlos City", province: "Negros Occidental", classification: "city", totalBarangays: 18 },
  { name: "San Enrique", province: "Negros Occidental", classification: "municipality", totalBarangays: 10 },
  { name: "Silay City", province: "Negros Occidental", classification: "city", totalBarangays: 16 },
  { name: "Sipalay City", province: "Negros Occidental", classification: "city", totalBarangays: 17 },
  { name: "Talisay City", province: "Negros Occidental", classification: "city", totalBarangays: 27 },
  { name: "Toboso", province: "Negros Occidental", classification: "municipality", totalBarangays: 9 },
  { name: "Valladolid", province: "Negros Occidental", classification: "municipality", totalBarangays: 16 },
  { name: "Victorias City", province: "Negros Occidental", classification: "city", totalBarangays: 16 },
];

export const PROVINCES: Record<
  Province,
  { name: string; description: string; primaryDriver: string }
> = {
  "Aklan": {
    name: "Aklan",
    description: "Home to Boracay — premier tourism destination with rich coastal and agricultural resources",
    primaryDriver: "Tourism",
  },
  "Antique": {
    name: "Antique",
    description: "Western seaboard province known for its long coastline, fishing grounds, and ecotourism",
    primaryDriver: "Fishing",
  },
  "Capiz": {
    name: "Capiz",
    description: "Seafood Capital of the Philippines with extensive aquaculture and fishing industries",
    primaryDriver: "Aquaculture",
  },
  "Guimaras": {
    name: "Guimaras",
    description: "Island province famous for world-class sweet mangoes and emerging eco-tourism",
    primaryDriver: "Mango Farming",
  },
  "Iloilo": {
    name: "Iloilo",
    description: "Regional economic center with rich agricultural plains and a bustling port economy",
    primaryDriver: "Rice Farming",
  },
  "Negros Occidental": {
    name: "Negros Occidental",
    description: "Sugar Capital of the Philippines with a diversified agro-industrial economy",
    primaryDriver: "Sugarcane",
  },
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

let computedCache: Map<string, TownData> | null = null;

export function getTownData(name: string): TownData | undefined {
  if (!computedCache) {
    computedCache = new Map();
    for (const town of TOWNS) {
      const barangays = generateBarangays(town.name, town.classification);
      const totalReported = barangays.reduce((s, b) => s + b.reportedIncidents, 0);
      const totalResolved = barangays.reduce((s, b) => s + b.resolvedIncidents, 0);
      const avgScore = Math.round(
        barangays.reduce((s, b) => s + b.environmentalScore, 0) / barangays.length,
      );

      const drivers = PROVINCE_DRIVERS[town.province];

      computedCache.set(normalizeName(town.name), {
        name: town.name,
        province: town.province,
        classification: town.classification,
        totalBarangays: town.totalBarangays,
        economicDrivers: drivers,
        barangays,
        totalReportedIncidents: totalReported,
        totalResolvedIncidents: totalResolved,
        avgEnvironmentalScore: avgScore,
      });
    }
  }
  return computedCache.get(normalizeName(name));
}

export function getTownsByProvince(): Record<Province, TownData[]> {
  const grouped: Record<Province, TownData[]> = {
    "Aklan": [],
    "Antique": [],
    "Capiz": [],
    "Guimaras": [],
    "Iloilo": [],
    "Negros Occidental": [],
  };
  for (const town of TOWNS) {
    const data = getTownData(town.name);
    if (data) grouped[town.province].push(data);
  }
  for (const key of Object.keys(grouped)) {
    grouped[key as Province].sort((a, b) => a.name.localeCompare(b.name));
  }
  return grouped;
}

export function getAllTowns(): TownData[] {
  return TOWNS.map((t) => getTownData(t.name)).filter(Boolean) as TownData[];
}

export function searchTowns(query: string): TownData[] {
  const q = query.toLowerCase();
  return getAllTowns().filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.province.toLowerCase().includes(q) ||
      t.economicDrivers.some((d) => d.toLowerCase().includes(q)),
  );
}

// Pre-load cache
getAllTowns();
