import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/pages/LoginPage';
import DashboardPage from './components/pages/DashboardPage';
import InteractiveDashboard from './components/pages/InteractiveDashboard';
import UserManagementPage from './components/pages/UserManagementPage';
import ClientManagementPage from './components/pages/ClientManagementPage';
import MastersPage from './components/pages/MastersPage';
import { Order, User, Client, Product, Status, Remark, OrderHistory, Dispatch, Filter } from './types';
import { INITIAL_ORDERS, CLIENTS, PRODUCTS, STATUSES, REMARKS } from './constants';

type MasterRecord = Product | Status | Remark;
type MasterRecordWithId = MasterRecord & { id: number };

const App: React.FC = () => {
  const { 
    isAuthenticated, user, logout, isAdmin, isUser, 
    users, saveUser, toggleBlockUser, deleteUser 
  } = useAuth();
  const [currentPage, setCurrentPage] = useState('interactive-dashboard'); // 'interactive-dashboard', 'dashboard', 'clients', 'users', 'masters'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Lifted state for all major data entities EXCEPT users
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [clients, setClients] = useState<Client[]>(CLIENTS);
  
  // Lifted state for all master data
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [statuses, setStatuses] = useState<Status[]>(STATUSES);
  const [remarks, setRemarks] = useState<Remark[]>(REMARKS);


  const [preselectedFilters, setPreselectedFilters] = useState<Partial<Filter> | null>(null);

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }
  
  // --- Generic Master Data CRUD ---
  const handleSaveMaster = <T extends MasterRecord>(
    item: Omit<T, 'id'> | T,
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setter(prevItems => {
        if ('id' in item) { // Editing existing item
            return prevItems.map(i => i.id === (item as T & {id: number}).id ? item : i) as T[];
        } else { // Creating new item
            const newItem = { ...item, id: Date.now() } as T;
            return [...prevItems, newItem];
        }
    });
  };
  
  const handleDeleteMaster = <T extends MasterRecordWithId>(
    itemId: number,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    masterName: string
  ) => {
    if (window.confirm(`Are you sure you want to delete this ${masterName}? This might affect existing orders.`)) {
       setter(prevItems => prevItems.filter(i => i.id !== itemId));
    }
  };

  const getMasterName = (id: number, collection: any[]) => {
    const item = collection.find(c => c.id === id);
    return item ? (item.name || item.text) : 'N/A';
  }

  // --- Order Management Logic ---
  const handleSaveOrders = (ordersToSave: Order[]) => {
    if (!user) return;
    
    setOrders(prevOrders => {
      let updatedOrders = [...prevOrders];
      const newItems: Order[] = [];

      ordersToSave.forEach(order => {
        const existingIndex = updatedOrders.findIndex(o => o.id === order.id);
        if (existingIndex > -1) {
          const oldOrder = updatedOrders[existingIndex];
          const updatedOrder = {...order};
          
          let newHistoryEntries: OrderHistory[] = [];

          // Compare fields and generate history entries
          const fieldsToCompare: (keyof Order)[] = ['productId', 'designCode', 'meterOrdered', 'rate', 'statusId', 'remarkId', 'expectedCompletionDate', 'orderDate'];
          
          fieldsToCompare.forEach(field => {
            if (oldOrder[field] !== updatedOrder[field]) {
              let description = '';
              const oldValue = oldOrder[field];
              const newValue = updatedOrder[field];

              switch (field) {
                case 'productId':
                  description = `Product changed from '${getMasterName(oldValue as number, products)}' to '${getMasterName(newValue as number, products)}'.`;
                  break;
                case 'designCode':
                  description = `Design Number changed from '${oldValue}' to '${newValue}'.`;
                  break;
                case 'statusId':
                  description = `Status changed from '${getMasterName(oldValue as number, statuses)}' to '${getMasterName(newValue as number, statuses)}'.`;
                  break;
                case 'remarkId':
                  description = `Remark changed from '${getMasterName(oldValue as number, remarks)}' to '${getMasterName(newValue as number, remarks)}'.`;
                  break;
                case 'rate':
                  description = `Rate updated from ₹${oldValue} to ₹${newValue}.`;
                  break;
                case 'meterOrdered':
                   description = `Meter Ordered updated from ${oldValue}m to ${newValue}m.`;
                   break;
                case 'expectedCompletionDate':
                   description = `Expected date changed from ${new Date(oldValue as string).toLocaleDateString()} to ${new Date(newValue as string).toLocaleDateString()}.`;
                   break;
                case 'orderDate':
                   description = `Order date changed from ${new Date(oldValue as string).toLocaleDateString()} to ${new Date(newValue as string).toLocaleDateString()}.`;
                   break;
                default:
                  break;
              }

              if (description) {
                newHistoryEntries.push({ description, updatedBy: user.id, updatedAt: new Date().toISOString() });
              }
            }
          });

          if(newHistoryEntries.length > 0) {
            updatedOrder.history = [...(updatedOrder.history || []), ...newHistoryEntries];
          }

          updatedOrders[existingIndex] = updatedOrder;
        } else {
          // This is a new order. The form should have already initialized history.
          newItems.push({
            ...order,
            id: `ORD-${String(Date.now() + newItems.length).slice(-6)}`,
          });
        }
      });

      return [...newItems, ...updatedOrders];
    });
  };
  
  const handleDeleteOrder = (orderId: string) => {
    if (isAdmin && window.confirm("Are you sure you want to delete this order?")) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  const handleSaveDispatch = (orderId: string, newDispatch: Dispatch) => {
    if (!user) return;
    setOrders(prevOrders => {
        return prevOrders.map(order => {
            if (order.id === orderId) {
                const updatedOrder = { ...order };
                updatedOrder.dispatches = [...(updatedOrder.dispatches || []), newDispatch];

                const historyEntry: OrderHistory = {
                    description: `Dispatched ${newDispatch.quantity}m. ${newDispatch.notes ? `Notes: ${newDispatch.notes}` : ''}`.trim(),
                    updatedBy: user.id,
                    updatedAt: new Date().toISOString()
                };
                updatedOrder.history = [...(updatedOrder.history || []), historyEntry];

                return updatedOrder;
            }
            return order;
        });
    });
  };

  // --- Client Management Logic ---
  const handleSaveClient = (clientData: Omit<Client, 'id'> | Client): Client => {
    let savedClient: Client;
    setClients(prevClients => {
      if ('id' in clientData) { // Editing existing client
        savedClient = clientData;
        return prevClients.map(c => c.id === clientData.id ? clientData : c);
      } else { // Creating new client
        const newClient = { ...clientData, id: Date.now() };
        savedClient = newClient;
        return [...prevClients, newClient];
      }
    });
    // @ts-ignore - savedClient is guaranteed to be assigned
    return savedClient;
  };

  // --- Page Navigation ---
  const handleNavigateWithFilter = (filters: Partial<Filter>) => {
    setPreselectedFilters(filters);
    setCurrentPage('dashboard');
  };

  const handleMobileNavClick = (page: string) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  }

  const PageToRender = () => {
      const allMasterData = { products, statuses, remarks };
      const orderManagementPage = <DashboardPage orders={orders} clients={clients} users={users} masters={allMasterData} onSaveOrders={handleSaveOrders} onDeleteOrder={handleDeleteOrder} onSaveClient={handleSaveClient} onSaveDispatch={handleSaveDispatch} preselectedFilters={preselectedFilters} onClearPreselection={() => setPreselectedFilters(null)} />;

      switch(currentPage) {
        case 'interactive-dashboard':
            return <InteractiveDashboard orders={orders} clients={clients} users={users} masters={allMasterData} onNavigateWithFilter={handleNavigateWithFilter} />;
        case 'users':
          return isAdmin ? <UserManagementPage users={users} onSaveUser={saveUser} onToggleBlock={toggleBlockUser} onDeleteUser={deleteUser} /> : orderManagementPage;
        case 'clients':
          return (isUser || isAdmin) ? <ClientManagementPage clients={clients} orders={orders} onViewClientOrders={(clientId) => handleNavigateWithFilter({ clientId })} onSaveClient={handleSaveClient} /> : orderManagementPage;
        case 'masters':
          return isAdmin ? <MastersPage 
            masters={allMasterData} 
            setters={{
                products: setProducts, 
                statuses: setStatuses, 
                remarks: setRemarks
            }}
            onSaveMaster={handleSaveMaster}
            onDeleteMaster={handleDeleteMaster}
          /> : orderManagementPage;
        case 'dashboard':
        default:
          return orderManagementPage;
      }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl text-indigo-600">SilkFlow</span>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button onClick={() => setCurrentPage('interactive-dashboard')} className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${currentPage === 'interactive-dashboard' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
                  Dashboard
                </button>
                <button onClick={() => setCurrentPage('dashboard')} className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${currentPage === 'dashboard' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
                  Order Management
                </button>
                 {(isAdmin || isUser) && (
                  <button onClick={() => setCurrentPage('clients')} className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${currentPage === 'clients' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
                    Clients
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button onClick={() => setCurrentPage('masters')} className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${currentPage === 'masters' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
                        Masters
                    </button>
                    <button onClick={() => setCurrentPage('users')} className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${currentPage === 'users' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
                        User Management
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <div className="hidden sm:flex items-center">
                <span className="text-sm text-slate-600 mr-4">
                  Welcome, <span className="font-medium">{user.name}</span> ({user.role})
                </span>
                <button
                  onClick={logout}
                  className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  Logout
                </button>
              </div>
               {/* Hamburger Button */}
               <div className="sm:hidden flex items-center">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    type="button"
                    className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    aria-controls="mobile-menu"
                    aria-expanded={isMobileMenuOpen}
                  >
                    <span className="sr-only">Open main menu</span>
                    {!isMobileMenuOpen ? (
                      <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    ) : (
                      <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button onClick={() => handleMobileNavClick('interactive-dashboard')} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentPage === 'interactive-dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}>
                Dashboard
              </button>
              <button onClick={() => handleMobileNavClick('dashboard')} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentPage === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}>
                Order Management
              </button>
              {(isAdmin || isUser) && (
                <button onClick={() => handleMobileNavClick('clients')} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentPage === 'clients' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}>
                  Clients
                </button>
              )}
              {isAdmin && (
                <>
                  <button onClick={() => handleMobileNavClick('masters')} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentPage === 'masters' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}>
                    Masters
                  </button>
                  <button onClick={() => handleMobileNavClick('users')} className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentPage === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}>
                    User Management
                  </button>
                </>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-slate-200">
                <div className="flex items-center px-4">
                    <div>
                        <div className="text-base font-medium text-slate-800">{user.name}</div>
                        <div className="text-sm font-medium text-slate-500">{user.email} ({user.role})</div>
                    </div>
                </div>
                <div className="mt-3 space-y-1">
                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-base font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                        Logout
                    </button>
                </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <PageToRender />
      </main>
    </div>
  );
};

export default App;
