import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';

interface FieldConfig {
    name: string;
    label: string;
    type: 'text' | 'textarea';
}

interface ModalConfig {
    title: string;
    fields: FieldConfig[];
}

interface MasterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  itemToEdit: { id: number; [key: string]: any } | null;
  config: ModalConfig;
}

const MasterFormModal: React.FC<MasterFormModalProps> = ({ isOpen, onClose, onSave, itemToEdit, config }) => {
  const [item, setItem] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setItem(itemToEdit);
      } else {
        // Initialize empty state based on config fields
        const initialState = config.fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {});
        setItem(initialState);
      }
      setError(null);
    }
  }, [isOpen, itemToEdit, config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    for (const field of config.fields) {
        if (typeof item[field.name] === 'string' && !item[field.name].trim()) {
            setError(`${field.label} is a required field.`);
            return;
        }
    }

    onSave(item);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${itemToEdit ? 'Edit' : 'Create'} ${config.title}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {config.fields.map(field => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-slate-700">{field.label}</label>
            {field.type === 'textarea' ? (
                <textarea 
                    name={field.name} 
                    id={field.name} 
                    value={item[field.name] || ''} 
                    onChange={handleChange} 
                    required 
                    rows={3}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            ) : (
                <input 
                    type="text" 
                    name={field.name} 
                    id={field.name} 
                    value={item[field.name] || ''} 
                    onChange={handleChange} 
                    required 
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            )}
          </div>
        ))}
        
        <div className="pt-5 mt-4 border-t">
          {error && <div className="text-red-600 text-sm mb-3 text-center">{error}</div>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Save {config.title}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default MasterFormModal;