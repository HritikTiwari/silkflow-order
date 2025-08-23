import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import Modal from './common/Modal';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<User, 'id'> | User) => void;
  userToEdit: User | null;
  allUsers: User[];
}

const initialUserState: Omit<User, 'id'> = {
  name: '',
  email: '',
  password: '',
  role: Role.USER,
  isBlocked: false,
};

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, userToEdit, allUsers }) => {
  const [user, setUser] = useState(initialUserState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setUser({ ...userToEdit, password: '' }); // Clear password field for editing
      } else {
        setUser(initialUserState);
      }
      setError(null);
    }
  }, [isOpen, userToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- Validation ---
    if (!user.name.trim() || !user.email.trim()) {
      setError("Name and Email are required fields.");
      return;
    }

    if (!userToEdit && !user.password) {
        setError("Password is required for new users.");
        return;
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        setError("Please enter a valid email address.");
        return;
    }

    // Email uniqueness validation
    const emailInUse = allUsers.some(
        u => u.email.toLowerCase() === user.email.toLowerCase() && u.id !== userToEdit?.id
    );

    if (emailInUse) {
        setError("This email address is already in use.");
        return;
    }

    // Create a payload, don't send empty password string on edit
    const payload = { ...user };
    if (userToEdit && !payload.password) {
        const { password, ...rest } = payload;
        onSave(rest);
    } else {
        onSave(payload);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? 'Edit User' : 'Create New User'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
          <input type="text" name="name" id="name" value={user.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
          <input type="email" name="email" id="email" value={user.email} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
          <input type="password" name="password" id="password" value={user.password || ''} onChange={handleChange} placeholder={userToEdit ? 'Leave blank to keep current password' : ''} required={!userToEdit} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-slate-700">Role</label>
          <select name="role" id="role" value={user.role} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value={Role.USER}>User</option>
            <option value={Role.ADMIN}>Admin</option>
          </select>
        </div>
        <div className="pt-5 mt-4 border-t">
          {error && <div className="text-red-600 text-sm mb-3 text-center">{error}</div>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Save User
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;