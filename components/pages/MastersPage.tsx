import React, { useState } from 'react';
import { Product, Status, Remark } from '../../types';
import MasterFormModal from '../MasterFormModal';

type MasterRecord = Product | Status | Remark;
type MasterRecordWithId = MasterRecord & { id: number };

interface MastersPageProps {
  masters: {
    products: Product[];
    statuses: Status[];
    remarks: Remark[];
  };
  setters: {
    products: React.Dispatch<React.SetStateAction<Product[]>>;
    statuses: React.Dispatch<React.SetStateAction<Status[]>>;
    remarks: React.Dispatch<React.SetStateAction<Remark[]>>;
  };
  onSaveMaster: <T extends MasterRecord>(item: Omit<T, 'id'> | T, setter: React.Dispatch<React.SetStateAction<T[]>>) => void;
  onDeleteMaster: <T extends MasterRecordWithId>(itemId: number, setter: React.Dispatch<React.SetStateAction<T[]>>, masterName: string) => void;
}

type MasterKey = 'products' | 'statuses' | 'remarks';

const masterConfig: { [key in MasterKey]: { title: string; fields: { name: string; label: string; type: 'text' | 'textarea' }[] } } = {
  products: {
    title: 'Product',
    fields: [
      { name: 'name', label: 'Product Name', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  statuses: {
    title: 'Status',
    fields: [{ name: 'name', label: 'Status Name', type: 'text' }],
  },
  remarks: {
    title: 'Remark',
    fields: [{ name: 'text', label: 'Remark Text', type: 'text' }],
  },
};

const MastersPage: React.FC<MastersPageProps> = ({ masters, setters, onSaveMaster, onDeleteMaster }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterRecordWithId | null>(null);
  
  const [activeView, setActiveView] = useState<MasterKey | null>(null);
  const [modalMasterKey, setModalMasterKey] = useState<MasterKey | null>(null);

  const handleOpenModal = (key: MasterKey, item: MasterRecordWithId | null = null) => {
    setModalMasterKey(key);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setModalMasterKey(null);
  };
  
  const handleSave = (item: any) => {
      if(modalMasterKey) {
        const setter = setters[modalMasterKey];
        onSaveMaster(item, setter as any);
      }
      handleCloseModal();
  }
  
  const handleDelete = (key: MasterKey, id: number) => {
      const setter = setters[key];
      onDeleteMaster(id, setter as any, masterConfig[key].title.toLowerCase());
  }

  // HUB VIEW
  if (!activeView) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Masters Management</h1>
        <p className="text-slate-500 mb-8">Select a category to manage its items.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(masterConfig) as MasterKey[]).map(key => {
            const config = masterConfig[key];
            return (
              <div 
                key={key} 
                onClick={() => setActiveView(key)}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                    <h2 className="text-xl font-bold text-indigo-700">Manage {config.title}s</h2>
                    <p className="text-slate-600 mt-2">Add, edit, or delete {config.title.toLowerCase()} records.</p>
                </div>
                <div className="text-right text-indigo-500 font-semibold mt-4">Go &rarr;</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // DETAIL VIEW
  const config = masterConfig[activeView];
  const data = masters[activeView];

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => setActiveView(null)} 
          className="mr-4 bg-white p-2 rounded-full shadow hover:bg-slate-100 transition flex items-center justify-center"
          aria-label="Back to masters menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-3xl font-bold text-slate-800">Manage {config.title}s</h1>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{config.title} Records ({data.length})</h2>
          <button onClick={() => handleOpenModal(activeView)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700">Add New</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {config.fields.map(field => <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{field.label}</th>)}
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {(data as any[]).map((item: any) => (
                <tr key={item.id}>
                  {config.fields.map(field => <td key={field.name} className="px-6 py-4 whitespace-pre-wrap text-sm text-slate-600 align-top">{item[field.name]}</td>)}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4 align-top">
                    <button onClick={() => handleOpenModal(activeView, item)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => handleDelete(activeView, item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {(data as any[]).length === 0 && <p className="text-center p-8 text-slate-500">No {config.title.toLowerCase()} records found.</p>}
        </div>
      </div>

       {isModalOpen && modalMasterKey && (
        <MasterFormModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSave}
            itemToEdit={editingItem}
            config={masterConfig[modalMasterKey]}
        />
       )}
    </div>
  );
};

export default MastersPage;