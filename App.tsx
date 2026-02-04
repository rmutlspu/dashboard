import React, { useEffect, useState, useMemo } from 'react';
import { fetchPaperData } from './services/dataService';
import { generateDashboardInsights } from './services/aiService';
import { PaperRecord } from './types';
import { calculateStats, getDepartmentUsage, getYearlyTrend, getUserTypeUsage, getPaperSavingRatio, getUserTypePieData, parseDate, downloadCSV } from './utils/analytics';
import StatsCard from './components/StatsCard';
import DepartmentBarChart from './components/Charts/DepartmentBarChart';
import UsagePieChart from './components/Charts/UsagePieChart';
import DailyTrendChart from './components/Charts/DailyTrendChart';
import InsightModal from './components/InsightModal';
import { 
  FileText, Printer, Trees, Loader2, Filter, X, ChevronDown, 
  Leaf, Users, Building2, Calendar, RefreshCw, Download, 
  Droplets, CloudFog, Coins, Zap, Sparkles
} from 'lucide-react';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<PaperRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedUserType, setSelectedUserType] = useState<string>('All');
  
  // View States
  const [chartMode, setChartMode] = useState<'department' | 'userType'>('department');

  // AI Modal States
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [insightContent, setInsightContent] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  // Load Data
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const data = await fetchPaperData();
        setRawData(data);
      } catch (err) {
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Compute Unique Filter Options
  const { uniqueYears, uniqueDepts, uniqueUserTypes } = useMemo(() => {
    const years = new Set<string>();
    const depts = new Set<string>();
    const userTypes = new Set<string>();

    rawData.forEach(item => {
      const d = parseDate(item.date);
      if (d) years.add(d.getFullYear().toString());
      if (item.department) depts.add(item.department);
      if (item.user_type) userTypes.add(item.user_type);
    });

    return {
      uniqueYears: Array.from(years).sort().reverse(),
      uniqueDepts: Array.from(depts).sort(),
      uniqueUserTypes: Array.from(userTypes).sort()
    };
  }, [rawData]);

  // Compute Filtered Data
  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      if (selectedYear !== 'All') {
        const d = parseDate(item.date);
        if (!d || d.getFullYear().toString() !== selectedYear) return false;
      }
      if (selectedDept !== 'All' && item.department !== selectedDept) return false;
      if (selectedUserType !== 'All' && item.user_type !== selectedUserType) return false;
      return true;
    });
  }, [rawData, selectedYear, selectedDept, selectedUserType]);

  // Derived Statistics
  const stats = useMemo(() => calculateStats(filteredData), [filteredData]);
  const deptData = useMemo(() => getDepartmentUsage(filteredData), [filteredData]);
  const userTypeChartData = useMemo(() => getUserTypeUsage(filteredData), [filteredData]);
  const trendData = useMemo(() => getYearlyTrend(filteredData), [filteredData]); // Switched to Yearly
  const pieData = useMemo(() => getPaperSavingRatio(filteredData), [filteredData]);
  const userTypePieData = useMemo(() => getUserTypePieData(filteredData), [filteredData]);

  const resetFilters = () => {
    setSelectedYear('All');
    setSelectedDept('All');
    setSelectedUserType('All');
  };

  const handleDownload = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(filteredData, `EcoPrint_Report_${timestamp}.csv`);
  };

  const handleGenerateInsight = async () => {
    setIsInsightOpen(true);
    // Only generate if content is empty or filters changed (optional optimization, but for now re-gen always for freshness)
    setIsInsightLoading(true);
    try {
      const result = await generateDashboardInsights(stats, deptData, selectedYear);
      setInsightContent(result);
    } catch (e) {
      setInsightContent("Sorry, we couldn't communicate with the AI service at this time.");
    } finally {
      setIsInsightLoading(false);
    }
  };

  const hasActiveFilters = selectedYear !== 'All' || selectedDept !== 'All' || selectedUserType !== 'All';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-emerald-600">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-semibold text-lg animate-pulse tracking-tight">Loading Eco Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <X size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-200"
          >
            Reload Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/10 to-slate-100 font-sans text-slate-900 selection:bg-emerald-100">
      
      {/* AI Insight Modal */}
      <InsightModal 
        isOpen={isInsightOpen} 
        onClose={() => setIsInsightOpen(false)} 
        isLoading={isInsightLoading} 
        content={insightContent} 
      />

      {/* Modern Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20 transform hover:scale-105 transition-transform">
              <Leaf size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">EcoPrint <span className="text-emerald-600">Analytics</span></h1>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Paper Usage Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={handleGenerateInsight}
               className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-full transition-all shadow-lg shadow-emerald-200 animate-pulse-slow"
             >
               <Sparkles size={14} />
               AI Insight
             </button>
             <button 
               onClick={handleDownload}
               className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-full transition-all shadow-lg shadow-slate-200"
             >
               <Download size={14} />
               Export Report
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Intro Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Dashboard <span className="text-emerald-500">Overview</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed font-medium">
              Analyze printing habits, monitor resource consumption, and visualize your <span className="text-emerald-600 underline decoration-emerald-200 decoration-2 underline-offset-2">environmental impact</span>.
            </p>
          </div>
          
          {/* Mobile AI Button */}
          <button 
             onClick={handleGenerateInsight}
             className="md:hidden w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-xl shadow-lg"
           >
             <Sparkles size={16} />
             Analyze with AI
           </button>
        </div>

        {/* Filter Toolbar */}
        <div className="sticky top-24 z-30 transition-all duration-300">
           <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Filter size={20} strokeWidth={2.5} />
                 </div>
                 <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">Filter Data</span>
              </div>

              <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto md:max-w-3xl">
                 {/* Filters... */}
                 <div className="relative group">
                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Calendar size={18} />
                   </div>
                   <select 
                     value={selectedYear}
                     onChange={(e) => setSelectedYear(e.target.value)}
                     className="w-full appearance-none bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-emerald-200 focus:border-emerald-500 text-slate-700 text-sm font-semibold rounded-xl pl-10 pr-10 py-3 outline-none transition-all cursor-pointer shadow-sm"
                   >
                     <option value="All">All Years</option>
                     {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                   </select>
                   <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                 </div>

                 <div className="relative group">
                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Building2 size={18} />
                   </div>
                   <select 
                     value={selectedDept}
                     onChange={(e) => setSelectedDept(e.target.value)}
                     className="w-full appearance-none bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-emerald-200 focus:border-emerald-500 text-slate-700 text-sm font-semibold rounded-xl pl-10 pr-10 py-3 outline-none transition-all cursor-pointer shadow-sm"
                   >
                     <option value="All">All Departments</option>
                     {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                   <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                 </div>

                 <div className="relative group">
                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Users size={18} />
                   </div>
                   <select 
                     value={selectedUserType}
                     onChange={(e) => setSelectedUserType(e.target.value)}
                     className="w-full appearance-none bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-emerald-200 focus:border-emerald-500 text-slate-700 text-sm font-semibold rounded-xl pl-10 pr-10 py-3 outline-none transition-all cursor-pointer shadow-sm"
                   >
                     <option value="All">All User Types</option>
                     {uniqueUserTypes.map(u => <option key={u} value={u}>{u}</option>)}
                   </select>
                   <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                 </div>
              </div>

              <button 
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all md:w-auto w-full ${
                  hasActiveFilters 
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer shadow-sm hover:shadow-md' 
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
              >
                <RefreshCw size={18} className={hasActiveFilters ? 'group-hover:rotate-180 transition-transform duration-500' : ''} />
                <span>Clear</span>
              </button>
           </div>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            title="Total Sheets Used" 
            value={stats.totalSheets.toLocaleString()} 
            icon={FileText} 
          />
          <StatsCard 
            title="Estimated Cost" 
            value={`฿${stats.estimatedCost.toLocaleString()}`} 
            icon={Coins} 
            trend="Approx. 0.45 THB/Sheet"
          />
          <StatsCard 
            title="Sheets Saved" 
            value={stats.sheetsSaved.toLocaleString()} 
            icon={Zap} 
            trend="via Double-sided Print"
          />
          <StatsCard 
            title="Requests" 
            value={stats.totalRequests.toLocaleString()} 
            icon={Printer} 
          />
        </div>

        {/* Impact & Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Trees Impact */}
           <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 flex flex-col justify-between relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-emerald-100 mb-2">
                  <Trees size={20} />
                  <span className="text-sm font-semibold uppercase tracking-wider">Trees Consumed</span>
                </div>
                <div className="text-4xl font-bold mb-1">{stats.treesConsumed}</div>
                <div className="text-emerald-100 text-sm opacity-90">Trees worth of paper used</div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
                <Trees size={180} />
              </div>
           </div>

           {/* Water Footprint */}
           <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-[0_10px_30px_-10px_rgba(14,165,233,0.15)] flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h4 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Water Footprint</h4>
                    <span className="text-3xl font-bold text-slate-800">{stats.waterConsumed.toLocaleString()} L</span>
                 </div>
                 <div className="p-3 bg-sky-50 text-sky-500 rounded-2xl group-hover:bg-sky-500 group-hover:text-white transition-colors">
                    <Droplets size={24} strokeWidth={2.5} />
                 </div>
              </div>
              <p className="text-xs text-slate-400 font-medium bg-slate-50 inline-block px-2 py-1 rounded-lg self-start">
                 ~15ml water per sheet
              </p>
           </div>

           {/* CO2 Emissions */}
           <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_10px_30px_-10px_rgba(71,85,105,0.1)] flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h4 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">CO₂ Emissions</h4>
                    <span className="text-3xl font-bold text-slate-800">{stats.co2Emitted} kg</span>
                 </div>
                 <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl group-hover:bg-slate-700 group-hover:text-white transition-colors">
                    <CloudFog size={24} strokeWidth={2.5} />
                 </div>
              </div>
               <p className="text-xs text-slate-400 font-medium bg-slate-50 inline-block px-2 py-1 rounded-lg self-start">
                 ~5g CO₂ per sheet
              </p>
           </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="lg:col-span-1">
             <UsagePieChart 
                data={pieData} 
                title="Efficiency Ratio" 
                subtitle="Pages per sheet utilization" 
             />
           </div>
           <div className="lg:col-span-1">
             <UsagePieChart 
                data={userTypePieData} 
                title="User Distribution" 
                subtitle="Consumption by user type" 
                unit="Sheets"
             />
           </div>
           <div className="lg:col-span-2 md:col-span-2 flex flex-col gap-6">
             {/* Chart Switcher Buttons */}
             <div className="flex p-1 bg-slate-100/80 rounded-2xl self-start">
                <button
                  onClick={() => setChartMode('department')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    chartMode === 'department' 
                      ? 'bg-white text-emerald-600 shadow-md scale-100' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95'
                  }`}
                >
                  <Building2 size={16} />
                  Department
                </button>
                <button
                  onClick={() => setChartMode('userType')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    chartMode === 'userType' 
                      ? 'bg-white text-emerald-600 shadow-md scale-100' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95'
                  }`}
                >
                  <Users size={16} />
                  User Type
                </button>
             </div>
             
             <DepartmentBarChart 
               data={chartMode === 'department' ? deptData : userTypeChartData} 
               title={chartMode === 'department' ? "Consumption by Department" : "Consumption by User Type"}
               subtitle={chartMode === 'department' ? "Top departments by paper usage" : "Paper usage broken down by user category"}
             />
           </div>
        </div>

        {/* Yearly Trend Chart */}
        <div>
          <DailyTrendChart data={trendData} />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
             <div>
               <h3 className="text-lg font-bold text-slate-800">Recent Activity Logs</h3>
               <p className="text-sm text-slate-400 mt-1 font-medium">Detailed usage records</p>
             </div>
             <div className="flex items-center gap-3">
               <button 
                  onClick={handleDownload}
                  className="md:hidden flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                  title="Export Data"
               >
                 <Download size={16} />
               </button>
               <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-bold border border-slate-100 shadow-sm">
                 Total Records: {filteredData.length}
               </span>
             </div>
          </div>
          <div className="overflow-x-auto">
            {filteredData.length > 0 ? (
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 font-bold tracking-wider">
                  <tr>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Department</th>
                    <th className="px-8 py-5">User Type</th>
                    <th className="px-8 py-5 text-right">Copies</th>
                    <th className="px-8 py-5 text-right">Sheets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="bg-white hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-8 py-5 font-medium text-slate-500">{row.date}</td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">{row.department}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                          row.user_type === 'Staff' 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'bg-violet-50 text-violet-600'
                        }`}>
                          {row.user_type}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right text-slate-500 font-medium">{row.copies}</td>
                      <td className="px-8 py-5 text-right font-bold text-slate-800">{row.sheet_used}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Filter size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No results found</h3>
                <p className="text-slate-500 mt-2">Try clearing your filters or selecting different criteria.</p>
                <button 
                  onClick={resetFilters} 
                  className="mt-6 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
          {filteredData.length > 10 && (
             <div className="px-8 py-4 border-t border-slate-50 bg-slate-50/30 text-center">
               <span className="text-xs text-slate-400 font-medium">Showing first 10 records only</span>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;