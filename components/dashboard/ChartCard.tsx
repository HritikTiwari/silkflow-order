import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h2 className="text-xl font-bold text-slate-800 mb-4">{title}</h2>
      <div className="h-80 relative">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
