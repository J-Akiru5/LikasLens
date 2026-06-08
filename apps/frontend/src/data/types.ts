export interface BarangayMetrics {
  name: string;
  population: number;
  reportsFiled: number;
  reportsResolved: number;
  resolutionRate: number;
  ecoScore: number;
  activeIssues: number;
}

export interface TownData {
  id: string;
  province: string;
  name: string;
  classification: string;
  totalBarangays: number;
  primaryEconomicDrivers: string[];
  barangays: BarangayMetrics[];
}

export interface ProvinceData {
  province: string;
  towns: TownData[];
}
