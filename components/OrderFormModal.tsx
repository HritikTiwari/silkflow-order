import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Order, User, Client, Product, Status, Remark } from '../types';
import Modal from './common/Modal';
import ImageCapture from './ImageCapture';
import ClientFormModal from './ClientFormModal';

interface MasterData {
    products: Product[];
    statuses: Status[];
    remarks: Remark[];
}

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orders: Order[]) => void;
  orderToEdit: Order | null;
  currentUser: User;
  clients: Client[];
  masters: MasterData;
  onSaveClient: (client: Omit<Client, 'id'> | Client) => Client;
}

const initialOrderItemState: Omit<Order, 'id' | 'createdBy' | 'clientId' | 'orderDate' | 'history' | 'dispatches'> = {
  picture: null,
  productId: 0,
  designCode: '',
  meterOrdered: 0,
  rate: 0,
  statusId: 0,
  remarkId: 0,
  expectedCompletionDate: '',
};

const OrderFormModal: React.FC<OrderFormModalProps> = ({ isOpen, onClose, onSave, orderToEdit, currentUser, clients, masters, onSaveClient }) => {
  const [isEditMode, setIsEditMode] = useState(!!orderToEdit);
  
  // Client selection state
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [clientToEditForForm, setClientToEditForForm] = useState<Client | null>(null);

  // Order Date State
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

  const initialDynamicState = useMemo(() => ({
    ...initialOrderItemState,
    productId: masters.products[0]?.id || 0,
    statusId: masters.statuses[0]?.id || 0,
    remarkId: masters.remarks[0]?.id || 0,
  }), [masters]);
  
  // Order item state
  const [stagedOrders, setStagedOrders] = useState<Omit<Order, 'id' | 'createdBy' | 'clientId' | 'orderDate' | 'history' | 'dispatches'>[]>([]);
  const [currentOrderItem, setCurrentOrderItem] = useState(initialDynamicState);
  const [imageCaptureKey, setImageCaptureKey] = useState(Date.now());
  const [formError, setFormError] = useState<string | null>(null);

  const clientSearchResults = useMemo(() => {
    if (!clientSearchQuery) return [];
    const query = clientSearchQuery.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query));
  }, [clientSearchQuery, clients]);

  const selectedClientName = useMemo(() => {
    return clients.find(c => c.id === selectedClientId)?.name || '...';
  }, [selectedClientId, clients]);

  const resetForm = useCallback(() => {
      setCurrentOrderItem(initialDynamicState);
      setSelectedClientId(null);
      setStagedOrders([]);
      setClientSearchQuery('');
      setImageCaptureKey(Date.now());
      setFormError(null);
  }, [initialDynamicState]);
  
  useEffect(() => {
    const editMode = !!orderToEdit;
    setIsEditMode(editMode);

    if (isOpen) {
        if (editMode && orderToEdit) {
            setCurrentOrderItem({
                picture: orderToEdit.picture,
                productId: orderToEdit.productId,
                designCode: orderToEdit.designCode,
                meterOrdered: orderToEdit.meterOrdered,
                rate: orderToEdit.rate,
                statusId: orderToEdit.statusId,
                remarkId: orderToEdit.remarkId,
                expectedCompletionDate: orderToEdit.expectedCompletionDate ? orderToEdit.expectedCompletionDate.split('T')[0] : '',
            });
            setSelectedClientId(orderToEdit.clientId);
            setOrderDate(orderToEdit.orderDate.split('T')[0]);
            setStagedOrders([]);
        } else {
            resetForm();
            setOrderDate(new Date().toISOString().split('T')[0]);
        }
    }
  }, [orderToEdit, isOpen, resetForm]);

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentOrderItem(prev => ({ ...prev, [name]: name.includes('Id') || name === 'meterOrdered' || name === 'rate' ? Number(value) : value }));
  };
  
  const handleImageCaptured = (base64Image: string) => {
    setCurrentOrderItem(prev => ({...prev, picture: base64Image}));
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setClientSearchQuery('');
  }

  const handleOpenNewClientForm = () => {
    setClientToEditForForm(null);
    setIsClientFormOpen(true);
  }

  const handleSaveNewClient = (clientData: Omit<Client, 'id'> | Client) => {
    const savedClient = onSaveClient(clientData);
    setIsClientFormOpen(false);
    handleSelectClient(savedClient);
  }

  const validateItem = () => {
    if (currentOrderItem.productId === 0 || currentOrderItem.statusId === 0 || currentOrderItem.remarkId === 0) return "Please select all dropdown options.";
    if (!currentOrderItem.designCode.trim()) return "Design Number is required.";
    if (currentOrderItem.meterOrdered <= 0) return "Meter Ordered must be greater than 0.";
    if (currentOrderItem.rate <= 0) return "Rate must be greater than 0.";
    if (!currentOrderItem.expectedCompletionDate) return "Expected Completion Date is required.";
    if (orderDate && new Date(currentOrderItem.expectedCompletionDate) < new Date(orderDate)) {
        return "Expected Completion Date cannot be before the Order Date.";
    }
    return null;
  }

  const handleAddItem = () => {
    setFormError(null);
    if (!selectedClientId) {
      setFormError("A client must be selected before adding items.");
      return;
    }
    const error = validateItem();
    if (error) {
        setFormError(error);
        return;
    }
    setStagedOrders(prev => [...prev, currentOrderItem]);
    setCurrentOrderItem(initialDynamicState);
    setImageCaptureKey(Date.now());
  };

  const handleRemoveItem = (index: number) => {
    setStagedOrders(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedClientId) {
        setFormError("A client must be selected.");
        return;
    }

    if (isEditMode) {
      if (!orderToEdit) return;
      const error = validateItem();
      if (error) {
        setFormError(error);
        return;
      }
      const finalOrder: Order = {
        ...orderToEdit,
        ...currentOrderItem,
        id: orderToEdit.id,
        createdBy: orderToEdit.createdBy,
        clientId: selectedClientId,
        orderDate: new Date(orderDate).toISOString(),
      };
      onSave([finalOrder]);
    } else {
      if (stagedOrders.length === 0) {
        setFormError("Please add at least one order item before saving.");
        return;
      }
      const finalOrders: Order[] = stagedOrders.map((item, index) => ({
        ...item,
        id: `ORD-${Date.now() + index}`,
        createdBy: currentUser.id,
        clientId: selectedClientId,
        orderDate: new Date(orderDate).toISOString(),
        history: [{
          description: "Order created.",
          updatedBy: currentUser.id,
          updatedAt: new Date().toISOString()
        }],
        dispatches: [],
      }));
      onSave(finalOrders);
    }
  };
  
  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Order' : 'Create New Order(s)'} widthClass="max-w-6xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Selection */}
        <div className="relative">
            <label htmlFor="clientName" className="block text-sm font-medium text-slate-700">Client</label>
            {selectedClientId ? (
                <div className="mt-1 flex items-center justify-between p-2 border border-slate-300 rounded-md bg-slate-50">
                    <span className="font-semibold text-indigo-700">{selectedClientName}</span>
                    {(!isEditMode && stagedOrders.length === 0) && (
                        <button type="button" onClick={() => setSelectedClientId(null)} className="text-sm text-red-600 hover:text-red-800">Change</button>
                    )}
                </div>
            ) : (
                <>
                  <input
                    type="text"
                    name="clientName"
                    id="clientName"
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="mt-1 block w-full md:w-1/2 rounded-md border-slate-300 shadow-sm sm:text-sm"
                    placeholder="Search by name or phone..."
                    autoComplete="off"
                  />
                  {clientSearchQuery && (
                    <div className="absolute z-10 w-full md:w-1/2 mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <ul>
                            {clientSearchResults.map(client => (
                                <li key={client.id} onClick={() => handleSelectClient(client)} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer">
                                    <p className="font-semibold">{client.name}</p>
                                    <p className="text-sm text-slate-500">{client.phone}</p>
                                </li>
                            ))}
                             <li onClick={handleOpenNewClientForm} className="px-4 py-2 hover:bg-green-50 cursor-pointer text-green-600 font-semibold border-t">
                                + Create New Client...
                            </li>
                        </ul>
                    </div>
                  )}
                </>
            )}
             {(!isEditMode && stagedOrders.length > 0) && <p className="text-xs text-slate-500 mt-1">Client is locked. To change, remove all items first.</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t">
          {/* Left Column: Form */}
          <div className="flex flex-col">
            <h3 className="text-lg font-medium text-slate-800 mb-4">{isEditMode ? 'Order Details' : 'Add New Order Item'}</h3>
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700">Picture</label>
                  <ImageCapture key={imageCaptureKey} onImageCaptured={handleImageCaptured} initialImage={currentOrderItem.picture} />
                </div>
                 <div>
                  <label htmlFor="productId" className="block text-sm font-medium text-slate-700">Product</label>
                  <select id="productId" name="productId" value={currentOrderItem.productId} onChange={handleItemChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm">
                    {masters.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="designCode" className="block text-sm font-medium text-slate-700">Design Number</label>
                  <input type="text" name="designCode" id="designCode" value={currentOrderItem.designCode} onChange={handleItemChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="meterOrdered" className="block text-sm font-medium text-slate-700">Meter Ordered</label>
                        <input type="number" name="meterOrdered" id="meterOrdered" value={currentOrderItem.meterOrdered || ''} onChange={handleItemChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" min="0"/>
                    </div>
                    <div>
                        <label htmlFor="rate" className="block text-sm font-medium text-slate-700">Rate</label>
                        <input type="number" name="rate" id="rate" value={currentOrderItem.rate || ''} onChange={handleItemChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" min="0"/>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="orderDate" className="block text-sm font-medium text-slate-700">Order Date</label>
                        <input
                            type="date"
                            name="orderDate"
                            id="orderDate"
                            value={orderDate}
                            onChange={(e) => setOrderDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="expectedCompletionDate" className="block text-sm font-medium text-slate-700">Expected Completion Date</label>
                        <input 
                            type="date" 
                            name="expectedCompletionDate" 
                            id="expectedCompletionDate" 
                            value={currentOrderItem.expectedCompletionDate} 
                            onChange={handleItemChange} 
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" 
                            min={orderDate}
                        />
                    </div>
                </div>
                 <div>
                  <label htmlFor="statusId" className="block text-sm font-medium text-slate-700">Status</label>
                  <select id="statusId" name="statusId" value={currentOrderItem.statusId} onChange={handleItemChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm">
                    {masters.statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="remarkId" className="block text-sm font-medium text-slate-700">Remark</label>
                  <select id="remarkId" name="remarkId" value={currentOrderItem.remarkId} onChange={handleItemChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm">
                    {masters.remarks.map(r => <option key={r.id} value={r.id}>{r.text}</option>)}
                  </select>
                </div>
            </div>
            {!isEditMode && (
                <div className="mt-6 text-right">
                    <button type="button" onClick={handleAddItem} disabled={!selectedClientId} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium disabled:bg-slate-400 disabled:cursor-not-allowed">Add Item to Client's Order</button>
                </div>
            )}
          </div>

          {/* Right Column: Staged Items */}
          {!isEditMode && (
             <div className="flex flex-col">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Staged Orders for <span className="font-bold">{selectedClientName}</span> ({stagedOrders.length})</h3>
                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border min-h-[200px] max-h-96 overflow-y-auto">
                    {stagedOrders.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-slate-500">No items added yet.</p>
                        </div>
                    ) : (
                        stagedOrders.map((item, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg shadow-sm flex items-start justify-between gap-4">
                                <div className="flex-shrink-0 h-12 w-16 bg-slate-200 rounded">
                                    {item.picture && <img src={item.picture} alt="Staged" className="h-full w-full object-cover rounded"/>}
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-800 text-sm">{masters.products.find(p => p.id === item.productId)?.name}</p>
                                    <p className="text-sm text-slate-600">{item.designCode}</p>
                                    <p className="text-xs text-slate-500">Meters: {item.meterOrdered} @ ₹{item.rate}</p>
                                </div>
                                <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
          )}
        </div>

        {/* Bottom Actions and Errors */}
        <div className="pt-5 mt-4 border-t">
            {formError && <div className="text-red-600 text-sm mb-3 text-center">{formError}</div>}
            <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={!selectedClientId || (!isEditMode && stagedOrders.length === 0)} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    {isEditMode ? 'Save Changes' : `Save All ${stagedOrders.length} Order(s)`}
                </button>
            </div>
        </div>
      </form>
    </Modal>
    {isClientFormOpen && <ClientFormModal isOpen={isClientFormOpen} onClose={() => setIsClientFormOpen(false)} onSave={handleSaveNewClient} clientToEdit={clientToEditForForm} clients={clients} />}
    </>
  );
};

export default OrderFormModal;