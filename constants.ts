import { Role, User, Product, Status, Remark, Order, Client } from './types';

export const USERS: User[] = [
  { id: 1, name: 'Admin User', email: 'admin@silkflow.com', password: 'admin', role: Role.ADMIN, isBlocked: false },
  { id: 2, name: 'Regular User', email: 'user@silkflow.com', password: 'user', role: Role.USER, isBlocked: false },
  { id: 4, name: 'Blocked User', email: 'blocked@silkflow.com', password: 'blocked', role: Role.USER, isBlocked: true },
];

export const CLIENTS: Client[] = [
    { id: 1, name: 'Aparna Silks', address: '123 Silk Road, Bangalore, KA 560001', phone: '9876543210', gstin: '29ABCDE1234F1Z5' },
    { id: 2, name: 'Nalli Sarees', address: '456 Weavers Lane, Chennai, TN 600017', phone: '9876543211', gstin: '33ABCDE1234F1Z6' },
    { id: 3, name: 'Kalamandir', address: '789 Brocade Blvd, Hyderabad, TS 500081', phone: '9876543212', gstin: '36ABCDE1234F1Z7' },
];

export const PRODUCTS: Product[] = [
  { id: 1, name: 'Kanjeevaram Silk', description: 'Heavy silk from Kanchipuram' },
  { id: 2, name: 'Mysore Silk', description: 'Lustrous silk from Karnataka' },
  { id: 3, name: 'Banarasi Silk', description: 'Fine silk with intricate brocades' },
  { id: 4, name: 'Tussar Silk', description: 'Wild silk with a rich texture' },
  { id: 5, name: 'Muga Silk', description: 'Golden yellow silk from Assam' },
];

export const STATUSES: Status[] = [
  { id: 1, name: 'Pending' },
  { id: 2, name: 'In Production' },
  { id: 3, name: 'Quality Check' },
  { id: 4, name: 'Shipped' },
  { id: 5, name: 'Delivered' },
  { id: 6, name: 'Cancelled' },
];

export const REMARKS: Remark[] = [
  { id: 1, text: 'Urgent' },
  { id: 2, text: 'Standard Priority' },
  { id: 3, text: 'Awaiting Payment' },
  { id: 4, text: 'Hold for Confirmation' },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: `ORD-${String(Date.now() - 10000).slice(-6)}`,
    picture: 'https://picsum.photos/seed/silk1/300/200',
    productId: 1,
    designCode: 'PCK-TRD-01',
    meterOrdered: 50,
    rate: 2500,
    statusId: 2,
    remarkId: 1,
    createdBy: 2,
    clientId: 1,
    orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    expectedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    history: [
      { description: "Order created.", updatedBy: 2, updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { description: "Status changed from 'Pending' to 'In Production'.", updatedBy: 1, updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
      { description: "Dispatched 20m. Notes: First partial shipment sent.", updatedBy: 1, updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    dispatches: [
       {
        id: `DIS-${Date.now() - 5000}`,
        dispatchedBy: 1, // Admin user
        dispatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        quantity: 20,
        notes: 'First partial shipment sent.'
      }
    ]
  },
  {
    id: `ORD-${String(Date.now() - 20000).slice(-6)}`,
    picture: 'https://picsum.photos/seed/silk2/300/200',
    productId: 3,
    designCode: 'FLR-JAL-05',
    meterOrdered: 120,
    rate: 3200,
    statusId: 4,
    remarkId: 2,
    createdBy: 2,
    clientId: 2,
    orderDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    expectedCompletionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    history: [
      { description: "Order created.", updatedBy: 2, updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
      { description: "Status changed from 'In Production' to 'Quality Check'.", updatedBy: 2, updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
      { description: "Status changed from 'Quality Check' to 'Shipped'.", updatedBy: 1, updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    dispatches: [],
  },
  {
    id: `ORD-${String(Date.now() - 30000).slice(-6)}`,
    picture: 'https://picsum.photos/seed/silk3/300/200',
    productId: 2,
    designCode: 'GLD-BDR-S02',
    meterOrdered: 75,
    rate: 1800,
    statusId: 5,
    remarkId: 2,
    createdBy: 1,
    clientId: 1,
    orderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    expectedCompletionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    history: [
       { description: "Order created.", updatedBy: 1, updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
       { description: "Status changed from 'Shipped' to 'Delivered'.", updatedBy: 1, updatedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    dispatches: [],
  },
  {
    id: `ORD-${String(Date.now() - 40000).slice(-6)}`,
    picture: 'https://picsum.photos/seed/silk4/300/200',
    productId: 4,
    designCode: 'TSR-GCH-W11',
    meterOrdered: 30,
    rate: 1500,
    statusId: 3, // In Quality Check
    remarkId: 4,
    createdBy: 1,
    clientId: 3,
    orderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    expectedCompletionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Overdue by 3 days
    history: [
        { description: "Order created.", updatedBy: 1, updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
        { description: "Status changed from 'In Production' to 'Quality Check'.", updatedBy: 1, updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    dispatches: [],
  },
];