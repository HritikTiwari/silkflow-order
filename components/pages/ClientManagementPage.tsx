import React, { useMemo, useState } from 'react';
import { Order, Client } from '../../types';
import { PRODUCTS, STATUSES } from '../../constants';
import ClientFormModal from '../ClientFormModal';

interface ClientManagementPageProps {
  clients: Client[];
  orders: Order[];
  onViewClientOrders: (clientId: number) => void;
  onSaveClient: (client: Omit<Client, 'id'> | Client) => void;
}

interface ClientProfile extends Client {
  totalOrders: number;
  totalValue: number;
  recentOrders: Order[];
}

const getMasterDataName = (id: number, collection: {id: number; name: string}[]) => {
  const item = collection.find(p => p.id === id);
  return item ? item.name : 'N/A';
};

const ClientManagementPage: React.FC<ClientManagementPageProps> = ({ clients, orders, onViewClientOrders, onSaveClient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const clientProfiles = useMemo<ClientProfile[]>(() => {
    return clients.map(client => {
      const clientOrders = orders.filter(order => order.clientId === client.id);
      const totalValue = clientOrders.reduce((sum, order) => sum + order.meterOrdered * order.rate, 0);
      const recentOrders = clientOrders.sort((a,b) => Number(b.id.split('-')[1]) - Number(a.id.split('-')[1])).slice(0, 5);
      
      return {
        ...client,
        totalOrders: clientOrders.length,
        totalValue,
        recentOrders
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, orders]);

  const handleOpenModal = (client: Client | null) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setClientToEdit(null);
  }
  
  const handleSave = (clientData: Omit<Client, 'id'> | Client) => {
    onSaveClient(clientData);
    handleCloseModal();
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
              <h1 className="text-3xl font-bold text-slate-800">Client Management</h1>
              <p className="text-slate-500 mt-1">Overview of all clients and their order history.</p>
          </div>
          <button onClick={() => handleOpenModal(null)} className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zM11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM12 5.343a1 1 0 011 1.732l-1 1.732a1 1 0 01-1.732-1l1-1.732zM12 11.657a1 1 0 01-1-1.732l1-1.732a1 1 0 111.732 1l-1 1.732z" /><path d="M10 5a1 1 0 011 1v1a1 1 0 11-2 0V6a1 1 0 011-1zM5.757 4.343a1 1 0 011.414-1.414l.707.707a1 1 0 01-1.414 1.414l-.707-.707z" /></svg>
            Create New Client
          </button>
      </div>
      
      {clientProfiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-slate-500">No clients found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {clientProfiles.map(client => (
            <div key={client.id} className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-indigo-700">{client.name}</h2>
                    <div className="mt-2 text-sm text-slate-600 space-y-1">
                      <p>{client.address}</p>
                      <p><span className="font-semibold">Phone:</span> {client.phone} | <span className="font-semibold">GSTIN:</span> {client.gstin || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <button onClick={() => handleOpenModal(client)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Edit</button>
                    <button 
                      onClick={() => onViewClientOrders(client.id)}
                      className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors"
                    >
                      View All Orders
                    </button>
                  </div>
                </div>
                 <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
                  <span>Total Orders: <span className="font-semibold text-slate-800">{client.totalOrders}</span></span>
                  <span>Total Value: <span className="font-semibold text-slate-800">₹{client.totalValue.toLocaleString('en-IN')}</span></span>
                </div>
              </div>
              <div className="p-2 flex-grow bg-slate-50/50">
                 <h4 className="px-4 pt-2 pb-1 text-sm font-medium text-slate-600">Recent Orders</h4>
                 <div className="overflow-y-auto max-h-60 relative">
                   {client.recentOrders.length > 0 ? (
                     <table className="min-w-full">
                       <thead className="bg-slate-100 sticky top-0 z-10">
                         <tr>
                           <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                         </tr>
                       </thead>
                       <tbody className="bg-white">
                         {client.recentOrders.map(order => (
                           <tr key={order.id} className="border-b border-slate-100">
                             <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-medium">
                              {getMasterDataName(order.productId, PRODUCTS)}
                              <div className="text-xs text-slate-400 font-normal">{order.id}</div>
                             </td>
                             <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {getMasterDataName(order.statusId, STATUSES)}
                              </span>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   ) : <p className="text-center p-4 text-sm text-slate-500">No orders found for this client.</p>}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {isModalOpen && <ClientFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} clientToEdit={clientToEdit} clients={clients} />}
    </div>
  );
};

export default ClientManagementPage;