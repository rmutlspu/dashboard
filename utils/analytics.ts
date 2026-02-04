import { PaperRecord, DeptChartData, DateChartData, PieChartData, DashboardStats } from '../types';

// Helper to parse mixed date formats (YYYY-MM-DD or DD/MM/YYYY)
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  // Try parsing ISO or standard formats
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Handle DD/MM/YYYY (Common in many regions)
  // Regex looks for Day/Month/Year
  const parts = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (parts) {
    // parts[1] = day, parts[2] = month, parts[3] = year
    // Construct ISO string YYYY-MM-DD for reliable parsing
    const isoDate = `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    const d2 = new Date(isoDate);
    if (!isNaN(d2.getTime())) return d2;
  }

  return null;
};

export const calculateStats = (data: PaperRecord[]): DashboardStats => {
  let totalSheets = 0;
  let totalPages = 0;

  data.forEach(item => {
    totalSheets += item.sheet_used;
    // Calculate total logical pages (if not provided, infer from sheets * copies * pages_per_sheet roughly, 
    // but usually dataset has total_pages or we infer sheet_used is the physical count)
    // Here we assume total_pages column exists or we estimate:
    totalPages += item.total_pages || item.sheet_used; 
  });

  const totalRequests = data.length;
  
  // 1. Environmental Footprint Calculations (Estimates)
  // Source reference: Environmental Paper Network & various eco-calculators
  // 1 tree ≈ 8,333 sheets standard A4
  const treesConsumed = parseFloat((totalSheets / 8333).toFixed(2)); 
  
  // Water: ~10ml to 20ml per sheet depending on production. Let's use 0.015 Liters.
  const waterConsumed = Math.round(totalSheets * 0.015);
  
  // CO2: ~4.5g to 6g per sheet. Let's use 5g (0.005 kg).
  const co2Emitted = parseFloat((totalSheets * 0.005).toFixed(1));

  // 2. Cost Analysis (Thai Baht)
  // Avg cost per sheet (Paper + Ink/Toner maintenance) ≈ 0.40 - 0.50 THB (Conservative)
  const estimatedCost = Math.round(totalSheets * 0.45);

  // 3. Efficiency Savings
  // Sheets that would have been used if everything was 1 page/sheet
  // If dataset 'total_pages' tracks logical pages, difference is what we saved.
  // If 'total_pages' isn't reliable, we can check pages_per_sheet column.
  // Let's rely on the difference between total_pages (content) and sheet_used (physical).
  const sheetsSaved = Math.max(0, totalPages - totalSheets);

  return { 
    totalSheets, 
    totalRequests, 
    treesConsumed, 
    estimatedCost,
    waterConsumed,
    co2Emitted,
    sheetsSaved
  };
};

export const getDepartmentUsage = (data: PaperRecord[]): DeptChartData[] => {
  const map = new Map<string, number>();
  
  data.forEach(item => {
    const dept = item.department || 'Unknown';
    map.set(dept, (map.get(dept) || 0) + item.sheet_used);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value) // Descending order
    .slice(0, 10); // Top 10
};

export const getUserTypeUsage = (data: PaperRecord[]): DeptChartData[] => {
  const map = new Map<string, number>();
  
  data.forEach(item => {
    const type = item.user_type || 'Unknown';
    map.set(type, (map.get(type) || 0) + item.sheet_used);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const getUserTypePieData = (data: PaperRecord[]): PieChartData[] => {
  const usage = getUserTypeUsage(data);
  // Define a pleasing color palette for categories
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

  return usage.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: colors[index % colors.length]
  }));
};

export const getDailyTrend = (data: PaperRecord[]): DateChartData[] => {
  const map = new Map<string, number>();

  data.forEach(item => {
    const d = parseDate(item.date);
    
    if (d) {
      // Use ISO string YYYY-MM-DD to group by day
      const dateKey = d.toISOString().split('T')[0];
      map.set(dateKey, (map.get(dateKey) || 0) + item.sheet_used);
    }
  });

  // Sort by date chronologically
  return Array.from(map.entries())
    .map(([date, sheets]) => ({ date, sheets }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const getYearlyTrend = (data: PaperRecord[]): DateChartData[] => {
  const map = new Map<string, number>();

  data.forEach(item => {
    const d = parseDate(item.date);
    
    if (d) {
      const year = d.getFullYear().toString();
      map.set(year, (map.get(year) || 0) + item.sheet_used);
    }
  });

  // Sort by year
  return Array.from(map.entries())
    .map(([date, sheets]) => ({ date, sheets }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const getPaperSavingRatio = (data: PaperRecord[]): PieChartData[] => {
  let singlePage = 0;
  let doublePage = 0; // 2 pages per sheet (N-up) or Duplex implied

  data.forEach(item => {
    // The dataset column is 'pages_per_sheet'. 
    // If it's > 1, it's resource efficient.
    if (item.pages_per_sheet > 1) {
      doublePage += item.sheet_used;
    } else {
      singlePage += item.sheet_used;
    }
  });

  return [
    { name: 'Standard (1 Page/Sheet)', value: singlePage, color: '#f87171' }, // Red-ish for warning
    { name: 'Eco-Mode (>1 Page/Sheet)', value: doublePage, color: '#10b981' }, // Green for good
  ];
};

export const downloadCSV = (data: PaperRecord[], filename: string) => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  ).join('\n');

  const csvContent = "data:text/csv;charset=utf-8," + headers + '\n' + rows;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};