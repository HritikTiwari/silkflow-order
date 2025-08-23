import React, { useMemo } from 'react';
import { Order, Client, User, Product, Status, Remark, Filter } from '../../types';

import StatCard from '../dashboard/StatCard';
import ChartCard from '../dashboard/ChartCard';
import PieChart from '../charts/PieChart';
import BarChart from '../charts/BarChart';

interface MasterData {
    products: Product[];
    statuses: Status[];
    remarks: Remark[];
}

interface InteractiveDashboardProps {
  orders: Order[];
  clients: Client[];
  users: User[];
  masters: MasterData;
  onNavigateWithFilter: (filters: Partial<Filter>) => void;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#34d399'];

const getMasterDataName = (id: number, collection: {id: number; name: string}[] | {id: number; text: string}[]) => {
  const item = collection.find(p => p.id === id);
  return item ? ('name' in item ? item.name : item.text) : 'N/A';
};


const InteractiveDashboard: React.FC<InteractiveDashboardProps> = ({ orders, clients, users, masters, onNavigateWithFilter }) => {
    
    const getClientName = (id: number) => clients.find(c => c.id === id)?.name || 'Unknown';
    const getUserName = (id: number) => users.find(u => u.id === id)?.name || 'Unknown';

    const analytics = useMemo(() => {
        const statusCardsData = masters.statuses.map(status => ({
            id: status.id,
            title: status.name,
            value: orders.filter(o => o.statusId === status.id).length,
        }));

        const remarkCardsData = masters.remarks.map(remark => ({
            id: remark.id,
            title: remark.text,
            value: orders.filter(o => o.remarkId === remark.id).length,
        }));

        // Orders Overview (Bar Chart)
        const monthlyOrders: { [key: string]: number } = {};
        const monthLabels: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.toLocaleString('default', { month: 'short' });
            monthLabels.push(month);
            monthlyOrders[month] = 0;
        }
        orders.forEach(order => {
            const month = new Date(order.orderDate).toLocaleString('default', { month: 'short' });
            if (month in monthlyOrders) {
                monthlyOrders[month]++;
            }
        });
        const ordersByMonthData = monthLabels.map(label => ({ label, value: monthlyOrders[label] }));

        // Status Distribution (Pie Chart)
        const statusCounts = orders.reduce((acc, order) => {
            const statusName = getMasterDataName(order.statusId, masters.statuses);
            acc[statusName] = (acc[statusName] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        const statusDistributionData = Object.entries(statusCounts).map(([label, value], i) => ({
            label, value, color: CHART_COLORS[i % CHART_COLORS.length]
        })).sort((a,b) => b.value - a.value);

        // Top Clients (Bar Chart)
        const clientValues = orders.reduce((acc, order) => {
            const clientName = getClientName(order.clientId);
            const orderValue = order.meterOrdered * order.rate;
            acc[clientName] = (acc[clientName] || 0) + orderValue;
            return acc;
        }, {} as { [key: string]: number });
        const topClientsData = Object.entries(clientValues)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([label, value]) => ({ label, value }));

        // Top Products (Bar Chart)
        const productMeters = orders.reduce((acc, order) => {
            const productName = getMasterDataName(order.productId, masters.products);
            acc[productName] = (acc[productName] || 0) + order.meterOrdered;
            return acc;
        }, {} as { [key: string]: number });
        const topProductsData = Object.entries(productMeters)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([label, value]) => ({ label, value }));

        // Top Dispatched Products
        const dispatchedMeters = orders.reduce((acc, order) => {
            const productName = getMasterDataName(order.productId, masters.products);
            const totalDispatched = order.dispatches.reduce((sum, d) => sum + d.quantity, 0);
            if (totalDispatched > 0) {
                acc[productName] = (acc[productName] || 0) + totalDispatched;
            }
            return acc;
        }, {} as { [key: string]: number });
        const topDispatchedData = Object.entries(dispatchedMeters)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([label, value]) => ({ label, value }));


        // User Activity
        const userActivityCounts = orders.reduce((acc, order) => {
            (order.history || []).forEach(h => {
                const userName = getUserName(h.updatedBy);
                acc[userName] = (acc[userName] || 0) + 1;
            });
            return acc;
        }, {} as { [key: string]: number });
        const topUsersData = Object.entries(userActivityCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([label, value]) => ({ label, value }));

        // Recent History
        const recentHistory = orders.flatMap(o => 
            (o.history || []).map(h => ({
                ...h,
                orderId: o.id,
                clientName: getClientName(o.clientId)
            }))
        ).sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 10);

        return {
            totalOrders: orders.length,
            statusCards: statusCardsData,
            remarkCards: remarkCardsData,
            ordersByMonthData,
            statusDistributionData,
            topClientsData,
            topProductsData,
            topDispatchedData,
            topUsersData,
            recentHistory
        };

    }, [orders, clients, users, masters]);

    return (
        <div className="p-6 md:p-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500 mt-1">A high-level overview of your business.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard title="Total Orders" value={analytics.totalOrders} description="All-time orders" />
            </div>
            
            <div>
                <h2 className="text-xl font-bold text-slate-700 mb-4">By Status</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {analytics.statusCards.map(stat => (
                        <div key={stat.title} onClick={() => onNavigateWithFilter({ statusId: stat.id })} className="cursor-pointer hover:scale-105 transition-transform duration-200">
                            <StatCard title={stat.title} value={stat.value} description="orders" />
                        </div>
                    ))}
                </div>
            </div>

             <div>
                <h2 className="text-xl font-bold text-slate-700 mb-4">By Remark</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {analytics.remarkCards.map(stat => (
                        <div key={stat.title} onClick={() => onNavigateWithFilter({ remarkId: stat.id })} className="cursor-pointer hover:scale-105 transition-transform duration-200">
                            <StatCard title={stat.title} value={stat.value} description="orders" />
                        </div>
                    ))}
                </div>
            </div>


            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title="Orders Overview (Last 6 Months)">
                    <BarChart data={analytics.ordersByMonthData} />
                </ChartCard>
                <ChartCard title="Order Status Distribution">
                    <PieChart data={analytics.statusDistributionData} />
                </ChartCard>
            </div>

             {/* Analytics Lists/Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                 <ChartCard title="Top 5 Ordering Clients (by Value)">
                    <BarChart data={analytics.topClientsData} color="#10b981" yAxisLabel="Value (₹)"/>
                </ChartCard>
                <ChartCard title="Top 5 Ordered Products (by Meter)">
                    <BarChart data={analytics.topProductsData} color="#f59e0b" yAxisLabel="Meters Ordered"/>
                </ChartCard>
                 <ChartCard title="Top 5 Dispatched Products (by Meter)">
                    <BarChart data={analytics.topDispatchedData} color="#ef4444" yAxisLabel="Meters Dispatched" />
                </ChartCard>
                 <ChartCard title="Top 5 Users (by Activity)">
                     <BarChart data={analytics.topUsersData} color="#8b5cf6" yAxisLabel="No. of Activities"/>
                </ChartCard>
                <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2 xl:col-span-2">
                     <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Activity</h2>
                     <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {analytics.recentHistory.map((item, index) => (
                            <div key={index} className="flex items-start text-sm p-2 bg-slate-50 rounded-md">
                                <div className="flex-shrink-0 bg-slate-200 text-slate-600 h-8 w-8 rounded-full flex items-center justify-center mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 14h12V4H4v12z" clipRule="evenodd" /><path d="M11.707 6.293a1 1 0 010 1.414L9.414 10l2.293 2.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" /></svg>
                                </div>
                                <div>
                                    <p className="text-slate-700">{item.description}</p>
                                    <p className="text-xs text-slate-500">
                                        by <span className="font-medium">{getUserName(item.updatedBy)}</span> on order <span className="font-medium">{item.orderId}</span> ({item.clientName})
                                    </p>
                                    <p className="text-xs text-slate-400">{new Date(item.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

        </div>
    );
};

export default InteractiveDashboard;