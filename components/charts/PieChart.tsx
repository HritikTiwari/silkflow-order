import React from 'react';

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
}

const getCoordinatesForPercent = (percent: number) => {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x, y];
};

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-500">No data available.</div>;
  }
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulativePercent = 0;

  return (
    <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-6">
      <div className="w-48 h-48 flex-shrink-0">
         <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
          {data.map((d) => {
            const percent = d.value / total;
            const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
            cumulativePercent += percent;
            const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = [
              `M ${startX} ${startY}`,
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `L 0 0`,
            ].join(' ');

            return <path key={d.label} d={pathData} fill={d.color}><title>{`${d.label}: ${((d.value/total)*100).toFixed(1)}%`}</title></path>;
          })}
        </svg>
      </div>
      <div className="w-full md:w-auto max-h-64 overflow-y-auto">
        <ul className="space-y-2 text-sm">
          {data.map(d => (
            <li key={d.label} className="flex items-center">
              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: d.color }}></span>
              <span className="text-slate-600">{d.label}</span>
              <span className="ml-auto font-medium text-slate-700">{((d.value/total)*100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PieChart;
