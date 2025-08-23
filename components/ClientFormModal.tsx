import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import Modal from './common/Modal';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id'> | Client) => void;
  clientToEdit: Client | null;
  clients: Client[];
}

const initialClientState: Omit<Client, 'id'> = {
  name: '',
  address: '',
  phone: '',
  gstin: '',
};

const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSave, clientToEdit, clients }) => {
  const [client, setClient] = useState(initialClientState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setClient(clientToEdit);
      } else {
        setClient(initialClientState);
      }
      setError(null);
    }
  }, [isOpen, clientToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: name === 'gstin' ? value.toUpperCase() : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!client.name.trim() || !client.phone.trim() || !client.address.trim()) {
      setError("Name, Address, and Phone are required fields.");
      return;
    }
    
    // Simple phone validation
    if (!/^\d{10}$/.test(client.phone)) {
        setError("Please enter a valid 10-digit phone number.");
        return;
    }
    
    const gstinValue = client.gstin.trim();
    if (gstinValue) {
        // GSTIN format validation
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstinValue)) {
            setError("Please enter a valid GSTIN number.");
            return;
        }

        // GSTIN uniqueness validation
        const isDuplicate = clients.some(
            c => c.gstin && c.gstin.toUpperCase() === gstinValue && c.id !== clientToEdit?.id
        );

        if (isDuplicate) {
            setError("This GSTIN is already registered to another client.");
            return;
        }
    }

    onSave({ ...client, gstin: gstinValue });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={clientToEdit ? 'Edit Client' : 'Create New Client'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">Client Name</label>
          <input type="text" name="name" id="name" value={client.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
          <textarea name="address" id="address" value={client.address} onChange={handleChange} required rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone Number</label>
              <input type="text" name="phone" id="phone" value={client.phone} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
             <div>
              <label htmlFor="gstin" className="block text-sm font-medium text-slate-700">GSTIN</label>
              <input type="text" name="gstin" id="gstin" value={client.gstin} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
        </div>

        <div className="pt-5 mt-4 border-t">
          {error && <div className="text-red-600 text-sm mb-3 text-center">{error}</div>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Save Client
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ClientFormModal;