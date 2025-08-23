import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Order, User, Dispatch, Client } from '../types';

interface DispatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dispatch: Omit<Dispatch, 'id' | 'dispatchedBy' | 'dispatchedAt'>) => void;
    order: Order;
    users: User[];
    clients: Client[];
}

const DispatchModal: React.FC<DispatchModalProps> = ({ isOpen, onClose, onSave, order, users, clients }) => {
    const [quantity, setQuantity] = useState<number | ''>('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    const getUserName = (id: number) => users.find(u => u.id === id)?.name || 'Unknown User';
    const getClientName = (id: number) => clients.find(c => c.id === id)?.name || 'Unknown Client';

    const totalDispatched = useMemo(() => {
        return (order.dispatches || []).reduce((sum, d) => sum + d.quantity, 0);
    }, [order.dispatches]);

    const remaining = order.meterOrdered - totalDispatched;
    const progress = order.meterOrdered > 0 ? (totalDispatched / order.meterOrdered) * 100 : 0;
    
    const sortedDispatches = useMemo(() => {
        return [...(order.dispatches || [])].reverse();
    }, [order.dispatches]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const numQuantity = Number(quantity);

        if (numQuantity <= 0) {
            setError("Dispatch quantity must be a positive number.");
            return;
        }
        if (numQuantity > remaining) {
            setError(`Cannot dispatch more than the remaining ${remaining}m.`);
            return;
        }
        
        onSave({ quantity: numQuantity, notes });
        setQuantity('');
        setNotes('');
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Dispatch for Order No. ${order.id}`} widthClass="max-w-4xl">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Form and Info */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium text-slate-800">Order Summary</h3>
                        <div className="mt-2 text-sm text-slate-600 space-y-1 bg-slate-50 p-3 rounded-md">
                           <p><strong>Client:</strong> {getClientName(order.clientId)}</p>
                           <p><strong>Product:</strong> {order.designCode}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-slate-800">Dispatch Progress</h3>
                        <div className="mt-2 space-y-2">
                             <div className="flex justify-between font-medium text-slate-700">
                                <span>Dispatched: {totalDispatched}m / {order.meterOrdered}m</span>
                                <span>Remaining: {remaining}m</span>
                             </div>
                             <div className="w-full bg-slate-200 rounded-full h-2.5">
                                 <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                             </div>
                        </div>
                    </div>
                   
                   {remaining > 0 && (
                     <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
                         <h3 className="text-lg font-medium text-slate-800">Add New Dispatch</h3>
                         <div>
                             <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Dispatch Quantity (m)</label>
                             <input 
                                type="number" 
                                name="quantity" 
                                id="quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                required
                                min="0.01"
                                max={remaining}
                                step="any"
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
                             />
                         </div>
                         <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Notes (Optional)</label>
                            <textarea
                                name="notes"
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
                            />
                         </div>
                         {error && <p className="text-sm text-red-600">{error}</p>}
                         <div className="text-right">
                            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                Save Dispatch
                            </button>
                         </div>
                     </form>
                   )}
                   {remaining <= 0 && (
                     <div className="pt-4 border-t text-center bg-green-50 text-green-700 font-semibold p-4 rounded-md">
                        This order has been fully dispatched.
                     </div>
                   )}
                </div>

                {/* Right Side: History */}
                <div>
                     <h3 className="text-lg font-medium text-slate-800 mb-2">Dispatch History ({sortedDispatches.length})</h3>
                     <div className="bg-slate-50 p-2 rounded-lg border max-h-[400px] overflow-y-auto">
                        {sortedDispatches.length === 0 ? (
                            <p className="text-slate-500 text-center p-4">No dispatches recorded yet.</p>
                        ) : (
                            <table className="min-w-full">
                                <thead className="bg-slate-200 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase">Qty (m)</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase">By</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {sortedDispatches.map(d => (
                                        <tr key={d.id} className="border-b border-slate-100">
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-600">
                                                {new Date(d.dispatchedAt).toLocaleDateString()}
                                                {d.notes && <p className="text-xs text-slate-400 mt-1 italic">"{d.notes}"</p>}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-slate-800">{d.quantity}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-600">{getUserName(d.dispatchedBy)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                     </div>
                </div>
           </div>
           <div className="pt-5 mt-6 border-t">
                <div className="flex justify-end">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
                </div>
            </div>
        </Modal>
    );
}

export default DispatchModal;