import React from 'react';
import Modal from './common/Modal';
import { Order, User } from '../types';

interface OrderHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    users: User[];
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose, order, users }) => {

    const getUserName = (id: number) => users.find(u => u.id === id)?.name || 'Unknown User';
    
    // Reverse history to show most recent first
    const sortedHistory = [...(order.history || [])].reverse();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`History for Order No. ${order.id}`}>
            <div className="space-y-4">
                {sortedHistory.length === 0 ? (
                    <p className="text-slate-500">No history available for this order.</p>
                ) : (
                    <ul className="relative border-l border-slate-200 ml-3">
                        {sortedHistory.map((historyItem, index) => (
                            <li key={index} className="mb-6 ml-6">
                                <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-800" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 14h12V4H4v12z" clipRule="evenodd" /><path d="M11.707 6.293a1 1 0 010 1.414L9.414 10l2.293 2.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" /></svg>
                                </span>
                                <p className="mb-1 text-base font-normal text-slate-600">
                                    {historyItem.description}
                                </p>
                                <div className="text-sm font-normal text-slate-400">
                                    by <span className="font-medium text-slate-500">{getUserName(historyItem.updatedBy)}</span> on <time>{new Date(historyItem.updatedAt).toLocaleString()}</time>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="pt-5 mt-4 border-t">
                <div className="flex justify-end">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
                </div>
            </div>
        </Modal>
    );
}

export default OrderHistoryModal;