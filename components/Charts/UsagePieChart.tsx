import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChartData } from '../../types';

interface Props {
  data: PieChartData[];
  title?: string;
  subtitle?: string;
  unit?: string;
}

const UsagePieChart: React.FC<Props> = ({ 
  data, 
  title = "Efficiency Ratio", 
  subtitle = "Pages per sheet utilization",
  unit = "Sheets"
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 h-[420px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="flex-grow w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value) => <span className="text-slate-600 font-medium ml-1 text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centered label */}
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
           <span className="text-2xl font-bold text-slate-800">{data.reduce((a,b) => a+b.value, 0).toLocaleString()}</span>
           <p className="text-xs text-slate-400">{unit}</p>
        </div>
      </div>
    </div>
  );
};

export default UsagePieChart;