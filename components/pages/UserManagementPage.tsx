import React, { useState } from 'react';
import { User } from '../../types';
import UserFormModal from '../UserFormModal';

interface UserManagementPageProps {
    users: User[];
    onSaveUser: (user: Omit<User, 'id'> | User) => void;
    onToggleBlock: (userId: number) => void;
    onDeleteUser: (userId: number) => void;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ users, onSaveUser, onToggleBlock, onDeleteUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    const handleOpenModal = (user: User | null) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setUserToEdit(null);
    };

    const handleSave = (userData: Omit<User, 'id'> | User) => {
        onSaveUser(userData);
        handleCloseModal();
    };
    
    return (
        <div className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
                 <button onClick={() => handleOpenModal(null)} className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Create User
                </button>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.isBlocked ? 'Blocked' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleOpenModal(user)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <button onClick={() => onToggleBlock(user.id)} className={`${user.isBlocked ? 'text-green-600 hover:text-green-900' : 'text-yellow-600 hover:text-yellow-900'}`}>
                                          {user.isBlocked ? 'Unblock' : 'Block'}
                                        </button>
                                        <button onClick={() => onDeleteUser(user.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             {isModalOpen && (
                <UserFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    userToEdit={userToEdit}
                    allUsers={users}
                />
            )}
        </div>
    );
};

export default UserManagementPage;