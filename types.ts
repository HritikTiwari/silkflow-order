export enum Role {
  ADMIN = 'Admin',
  USER = 'User',
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isBlocked: boolean;
  // In a real app, password would be a hash
  password?: string;
}

export interface Client {
  id: number;
  name: string;
  address: string;
  phone: string;
  gstin: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
}

export interface Status {
  id: number;
  name: string;
}

export interface Remark {
  id: number;
  text: string;
}

export interface OrderHistory {
  description: string;
  updatedBy: number; // User ID
  updatedAt: string; // ISO string format
}

export interface Dispatch {
  id: string;
  dispatchedBy: number; // User ID
  dispatchedAt: string; // ISO string format
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string; // Auto-generated serial no
  picture: string | null; // Base64 string or URL
  productId: number;
  designCode: string;
  meterOrdered: number;
  rate: number;
  statusId: number;
  remarkId: number;
  createdBy: number; // User ID
  clientId: number; 
  orderDate: string; // ISO string format
  expectedCompletionDate: string; // ISO string format (YYYY-MM-DD from input)
  history: OrderHistory[];
  dispatches: Dispatch[];
}

export interface Filter {
  statusId: number | null;
  searchQuery: string;
  clientId: number | null;
  remarkId: number | null;
}