import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  colorClass?: string; // Kept for backward compatibility but largely overridden by new styles
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="group bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">{value}</h3>
          {trend && (
            <div className="mt-3 flex items-center gap-1.5">
               <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
               <p className="text-xs text-slate-500 font-medium">{trend}</p>
            </div>
          )}
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-inner">
          <Icon size={28} strokeWidth={2} />
        </div>
      </div>
      
      {/* Decorative gradient background blob */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0" />
    </div>
  );
};

export default StatsCard;