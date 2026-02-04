import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DateChartData } from '../../types';

interface Props {
  data: DateChartData[];
}

const DailyTrendChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-emerald-50 h-[450px] flex flex-col relative overflow-hidden group hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.1)] transition-all duration-500">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
      
      <div className="mb-8 z-10 relative px-2">
        <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          Annual Usage Trend
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">Yearly</span>
        </h3>
        <p className="text-sm text-slate-400 font-medium mt-1">Total paper consumption by year</p>
      </div>
      
      <div className="flex-grow w-full min-h-0 z-10 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSheets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={12} 
              fontWeight={500}
              tickLine={false}
              axisLine={false}
              dy={15}
              tickFormatter={(str) => {
                // If the string is already a Year (length 4), return it. 
                // Otherwise try to format it.
                if (str.length === 4) return str;
                const d = new Date(str);
                return d.toLocaleDateString('en-GB', { year: 'numeric' });
              }}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 15px 35px -5px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#059669', fontWeight: 600, fontSize: '14px' }}
              labelStyle={{ color: '#64748b', marginBottom: '0.5rem', fontWeight: 500 }}
              labelFormatter={(label) => `Year: ${label}`}
              cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="sheets" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSheets)" 
              activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff', className: "shadow-lg" }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyTrendChart;