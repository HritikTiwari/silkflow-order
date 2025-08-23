import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, Role } from '../types';
import { USERS } from '../constants';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => string | null;
  logout: () => void;
  saveUser: (user: Omit<User, 'id'> | User) => void;
  toggleBlockUser: (userId: number) => void;
  deleteUser: (userId: number) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(USERS);

  const login = (email: string, password: string): string | null => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (foundUser) {
      if(foundUser.isBlocked) {
        return "This user account is blocked.";
      }
      setUser(foundUser);
      return null;
    }
    return "Invalid email or password.";
  };

  const logout = () => {
    setUser(null);
  };

  const saveUser = (userData: Omit<User, 'id'> | User) => {
    setUsers(prevUsers => {
      if ('id' in userData) { // Editing
        return prevUsers.map(u => 
          u.id === userData.id 
            ? { ...u, ...userData, password: userData.password || u.password } 
            : u
        );
      } else { // Creating
        const newUser: User = { 
            ...(userData as Omit<User, 'id'>), 
            id: Date.now(), 
            isBlocked: false,
            password: userData.password!,
        };
        return [...prevUsers, newUser];
      }
    });
  };
  
  const toggleBlockUser = (userId: number) => {
    setUsers(prevUsers =>
      prevUsers.map(u => (u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u))
    );
  };

  const deleteUser = (userId: number) => {
    if(window.confirm("Are you sure you want to delete this user? This action cannot be undone.")){
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === Role.ADMIN;
  const isUser = user?.role === Role.USER;

  return (
    <AuthContext.Provider value={{ user, users, login, logout, saveUser, toggleBlockUser, deleteUser, isAuthenticated, isAdmin, isUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
