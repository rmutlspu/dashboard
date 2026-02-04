// Raw data model matching the CSV structure
export interface PaperRecord {
  date: string;
  user_type: string;
  department: string;
  pages_per_sheet: number;
  total_pages: number;
  copies: number;
  sheet_used: number;
}

// Aggregated data for charts
export interface DeptChartData {
  name: string;
  value: number;
}

export interface DateChartData {
  date: string;
  sheets: number;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface DashboardStats {
  totalSheets: number;
  totalRequests: number;
  treesConsumed: number;
  estimatedCost: number; // New: THB
  waterConsumed: number; // New: Liters
  co2Emitted: number;    // New: kg
  sheetsSaved: number;   // New: Paper saved by double-sided printing
}