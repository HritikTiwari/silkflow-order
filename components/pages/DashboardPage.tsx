import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Order, Filter, Client, Product, Status, Remark, User, Dispatch } from '../../types';
import { useAuth } from '../../context/AuthContext';
import OrderFormModal from '../OrderFormModal';
import { exportToPDF, exportToExcel } from '../../services/exportService';
import OrderHistoryModal from '../StatusHistoryModal';
import DispatchModal from '../DispatchModal';

const getMasterDataName = (id: number | undefined, collection: {id: number; name: string}[] | {id: number; text: string}[]) => {
  if (id === undefined) return 'N/A';
  const item = collection.find(p => p.id === id);
  return item ? ('name' in item ? item.name : item.text) : 'N/A';
};

interface MasterData {
    products: Product[];
    statuses: Status[];
    remarks: Remark[];
}

interface DashboardPageProps {
  orders: Order[];
  clients: Client[];
  users: User[];
  masters: MasterData;
  onSaveOrders: (orders: Order[]) => void;
  onDeleteOrder: (orderId: string) => void;
  onSaveClient: (client: Omit<Client, 'id'> | Client) => Client;
  onSaveDispatch: (orderId: string, dispatch: Dispatch) => void;
  preselectedFilters: Partial<Filter> | null;
  onClearPreselection: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ orders, clients, users, masters, onSaveOrders, onDeleteOrder, onSaveClient, onSaveDispatch, preselectedFilters, onClearPreselection }) => {
  const { user, isAdmin, isUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [filters, setFilters] = useState<Filter>({ statusId: null, searchQuery: '', clientId: null, remarkId: null });
  const [historyModalOrder, setHistoryModalOrder] = useState<Order | null>(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState<Order | null>(null);


  useEffect(() => {
    if (preselectedFilters) {
      setFilters({ statusId: null, searchQuery: '', clientId: null, remarkId: null, ...preselectedFilters });
      onClearPreselection();
    }
  }, [preselectedFilters, onClearPreselection]);
  
  const getClientName = useCallback((id: number) => {
    return clients.find(c => c.id === id)?.name || 'Unknown Client';
  }, [clients]);

  const handleOpenModal = (order: Order | null) => {
    setOrderToEdit(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOrderToEdit(null);
  }

  const handleDeleteOrder = (orderId: string) => {
    if (isAdmin) {
        onDeleteOrder(orderId);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({...prev, [name]: (name === 'statusId' || name === 'clientId' || name === 'remarkId') ? (value ? Number(value) : null) : value }));
  };
  
  const overdueOrders = useMemo(() => {
    if (!isAdmin) return [];
    const now = new Date();
    const deliveredStatusId = masters.statuses.find(s => s.name === 'Delivered')?.id;
    const cancelledStatusId = masters.statuses.find(s => s.name === 'Cancelled')?.id;

    return orders.filter(order => {
        const isCompleted = order.statusId === deliveredStatusId || order.statusId === cancelledStatusId;
        if (isCompleted || !order.expectedCompletionDate) return false;
        
        const expectedDate = new Date(order.expectedCompletionDate);
        // Set hours to 0 to compare dates only
        expectedDate.setHours(0,0,0,0);
        now.setHours(0,0,0,0);

        return expectedDate < now;
    }).sort((a, b) => new Date(a.expectedCompletionDate).getTime() - new Date(b.expectedCompletionDate).getTime());
  }, [orders, isAdmin, masters.statuses]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const statusMatch = filters.statusId ? order.statusId === filters.statusId : true;
      const clientFilterMatch = filters.clientId ? order.clientId === filters.clientId : true;
      const remarkFilterMatch = filters.remarkId ? order.remarkId === filters.remarkId : true;
      const clientNameForSearch = getClientName(order.clientId).toLowerCase();
      
      const searchMatch = filters.searchQuery ? 
        order.designCode.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        clientNameForSearch.includes(filters.searchQuery.toLowerCase()) ||
        getMasterDataName(order.productId, masters.products).toLowerCase().includes(filters.searchQuery.toLowerCase())
        : true;
      
      return statusMatch && searchMatch && clientFilterMatch && remarkFilterMatch;
    }).sort((a, b) => (Number(b.id.split('-')[1]) || 0) - (Number(a.id.split('-')[1]) || 0));
  }, [orders, filters, getClientName, masters]);

  const handleExportPDF = useCallback(() => {
    exportToPDF({ orders: filteredOrders, clients, users, ...masters, filters });
  }, [filteredOrders, filters, clients, users, masters]);

  const handleExportExcel = useCallback(() => {
    exportToExcel({ orders: filteredOrders, clients, users, ...masters, filters });
  }, [filteredOrders, filters, clients, users, masters]);
  
  const handleSaveDispatchAndCloseModal = (dispatch: Omit<Dispatch, 'id' | 'dispatchedBy' | 'dispatchedAt'>) => {
    if (dispatchModalOrder && user) {
        const newDispatch: Dispatch = {
            ...dispatch,
            id: `DIS-${Date.now()}`,
            dispatchedBy: user.id,
            dispatchedAt: new Date().toISOString(),
        };
        onSaveDispatch(dispatchModalOrder.id, newDispatch);
    }
    setDispatchModalOrder(null);
  };

  if (!user) return null;

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Order Management</h1>
            <p className="text-slate-500 mt-1">Manage and track all silk production orders.</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          Create Order
        </button>
      </div>
      
      {/* Overdue Orders Panel */}
      {isAdmin && overdueOrders.length > 0 && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Overdue Orders ({overdueOrders.length})
              </h2>
              <div className="overflow-x-auto max-h-64">
                   <table className="min-w-full">
                       <thead className="bg-red-100 sticky top-0">
                           <tr>
                               <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Client & Product</th>
                               <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Expected Date</th>
                               <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase tracking-wider">Status</th>
                               <th className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
                           </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-red-100">
                           {overdueOrders.map(order => (
                               <tr key={`overdue-${order.id}`}>
                                   <td className="px-4 py-2 whitespace-nowrap">
                                       <div className="text-sm font-semibold text-slate-800">{getClientName(order.clientId)}</div>
                                       <div className="text-xs text-slate-500">{getMasterDataName(order.productId, masters.products)}</div>
                                   </td>
                                   <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-red-600">
                                       {new Date(order.expectedCompletionDate).toLocaleDateString()}
                                   </td>
                                   <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">
                                       {getMasterDataName(order.statusId, masters.statuses)}
                                   </td>
                                   <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                       <button onClick={() => handleOpenModal(order)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                       <button onClick={() => handleDeleteOrder(order.id)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
              </div>
          </div>
      )}

      {/* Filters and Actions */}
      <div className="mb-6 p-4 bg-white shadow rounded-lg flex flex-col md:flex-row items-center gap-4 flex-wrap">
          <input
            type="text"
            name="searchQuery"
            placeholder="Search by Order No., client, product, design number..."
            className="w-full md:w-1/3 p-2 border border-slate-300 rounded-md shadow-sm"
            value={filters.searchQuery}
            onChange={handleFilterChange}
          />
           <select 
            name="clientId" 
            className="w-full md:w-auto p-2 border border-slate-300 rounded-md shadow-sm"
            value={filters.clientId ?? ''}
            onChange={handleFilterChange}
          >
            <option value="">All Clients</option>
            {clients.sort((a,b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select 
            name="statusId" 
            className="w-full md:w-auto p-2 border border-slate-300 rounded-md shadow-sm"
            value={filters.statusId ?? ''}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            {masters.statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select 
            name="remarkId" 
            className="w-full md:w-auto p-2 border border-slate-300 rounded-md shadow-sm"
            value={filters.remarkId ?? ''}
            onChange={handleFilterChange}
          >
            <option value="">All Remarks</option>
            {masters.remarks.map(r => <option key={r.id} value={r.id}>{r.text}</option>)}
          </select>
          <div className="flex-grow"></div>
          <div className="flex gap-2">
              <button onClick={handleExportPDF} className="bg-slate-500 text-white px-3 py-2 text-sm rounded-md hover:bg-slate-600">Export PDF</button>
              <button onClick={handleExportExcel} className="bg-slate-500 text-white px-3 py-2 text-sm rounded-md hover:bg-slate-600">Export Excel</button>
          </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order & Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status & Dispatch</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredOrders.map(order => {
                const totalDispatched = (order.dispatches || []).reduce((sum, d) => sum + d.quantity, 0);
                const dispatchProgress = order.meterOrdered > 0 ? (totalDispatched / order.meterOrdered) * 100 : 0;
                const isCompleted = order.statusId === 5 || order.statusId === 6;
                const isOverdue = !isCompleted && new Date(order.expectedCompletionDate) < new Date();
                
                return (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-24">
                        <img className="h-16 w-24 rounded-md object-cover" src={order.picture || 'https://via.placeholder.com/96x64'} alt="Order" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{getMasterDataName(order.productId, masters.products)}</div>
                        <div className="text-sm text-slate-500">{order.id}</div>
                        <div className="text-sm text-indigo-600 font-semibold">{getClientName(order.clientId)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-medium">{order.designCode}</div>
                    <div className="text-sm text-slate-500">Meters: <span className="font-semibold text-slate-700">{order.meterOrdered}</span></div>
                    <div className="text-sm text-slate-500">Rate: <span className="font-semibold text-slate-700">₹{order.rate}</span></div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div>Ordered: <span className="text-slate-900 font-medium">{new Date(order.orderDate).toLocaleDateString()}</span></div>
                    <div className={isOverdue ? "text-red-600 font-bold" : ""}>Expected: <span className="font-medium">{new Date(order.expectedCompletionDate).toLocaleDateString()}</span></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{getMasterDataName(order.statusId, masters.statuses)}</span>
                    <div className="text-sm text-slate-500 mt-2">
                      <div className="font-medium">Dispatched: {totalDispatched}m / {order.meterOrdered}m</div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${dispatchProgress}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex flex-col items-end space-y-2">
                        <div>
                            <button onClick={() => setHistoryModalOrder(order)} className="text-slate-600 hover:text-slate-900">History</button>
                            <button onClick={() => setDispatchModalOrder(order)} className="text-blue-600 hover:text-blue-900 ml-4">Dispatch</button>
                        </div>
                        <div>
                            { (isAdmin || isUser) &&
                              <button onClick={() => handleOpenModal(order)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                            }
                            { isAdmin &&
                              <button onClick={() => handleDeleteOrder(order.id)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                            }
                        </div>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          {filteredOrders.length === 0 && <p className="text-center p-8 text-slate-500">No orders found matching your criteria.</p>}
        </div>
      </div>

      {isModalOpen && (
        <OrderFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={onSaveOrders}
          orderToEdit={orderToEdit}
          currentUser={user}
          clients={clients}
          masters={masters}
          onSaveClient={onSaveClient}
        />
      )}
      
      {dispatchModalOrder && (
          <DispatchModal
            isOpen={!!dispatchModalOrder}
            onClose={() => setDispatchModalOrder(null)}
            order={dispatchModalOrder}
            onSave={handleSaveDispatchAndCloseModal}
            users={users}
            clients={clients}
          />
      )}

      {historyModalOrder && (
          <OrderHistoryModal
              isOpen={!!historyModalOrder}
              onClose={() => setHistoryModalOrder(null)}
              order={historyModalOrder}
              users={users}
          />
      )}
    </div>
  );
};

export default DashboardPage;