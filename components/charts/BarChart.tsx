import React from 'react';

interface BarChartProps {
    data: { label: string; value: number }[];
    color?: string;
    yAxisLabel?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, color = '#6366f1', yAxisLabel }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500">No data available.</div>;
    }

    const maxValue = Math.max(...data.map(d => d.value), 0);
    const yAxisValues = [0, maxValue / 4, maxValue / 2, (maxValue * 3) / 4, maxValue].map(v => Math.ceil(v));

    const formatValue = (value: number) => {
        if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
        return value;
    }

    return (
        <div className="w-full h-full flex flex-col">
            <svg viewBox="0 0 500 300" className="flex-grow">
                <g className="y-axis-labels" transform="translate(40, 0)">
                     {yAxisValues.map((value, i) => {
                        const y = 250 - (i * (230 / 4));
                        return (
                            <g key={i}>
                                <text x="-10" y={y + 5} textAnchor="end" fontSize="10" fill="#94a3b8">{formatValue(value)}</text>
                                {value > 0 && <line x1="0" y1={y} x2="450" y2={y} stroke="#e2e8f0" strokeDasharray="2" />}
                            </g>
                        )
                    })}
                     <line x1="0" y1="250" x2="450" y2="250" stroke="#cbd5e1" />
                     {yAxisLabel && <text transform="translate(-30, 150) rotate(-90)" textAnchor="middle" fontSize="10" fill="#94a3b8">{yAxisLabel}</text>}
                </g>

                <g className="bars" transform="translate(40, 0)">
                    {data.map((d, i) => {
                        const barWidth = 400 / (data.length * 2);
                        const x = (i * (420 / data.length)) + (barWidth / 2);
                        const height = maxValue > 0 ? (d.value / maxValue) * 230 : 0;
                        return (
                            <g key={i} className="bar-group">
                                <rect x={x} y={250 - height} width={barWidth} height={height} fill={color} rx="2">
                                    <title>{`${d.label}: ${d.value.toLocaleString()}`}</title>
                                </rect>
                            </g>
                        );
                    })}
                </g>
                
                 <g className="x-axis-labels" transform="translate(40, 0)">
                    {data.map((d, i) => {
                         const barWidth = 400 / (data.length * 2);
                         const x = (i * (420 / data.length)) + barWidth;
                        return (
                             <text key={i} x={x} y="270" textAnchor="middle" fontSize="10" fill="#64748b" className="truncate">
                                {d.label.length > 8 ? `${d.label.substring(0,6)}...` : d.label}
                                <title>{d.label}</title>
                            </text>
                        )
                    })}
                </g>
            </svg>
        </div>
    );
};

export default BarChart;
