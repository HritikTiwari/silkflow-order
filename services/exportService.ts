import { Order, Product, Status, Remark, Filter, Client, User } from '../types';
// In a real project, you would install these with npm
// For this environment, we assume they are available globally
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import * as XLSX from 'xlsx';

declare const jspdf: any;
declare const XLSX: any;

interface ExportData {
  orders: Order[];
  clients: Client[];
  products: Product[];
  statuses: Status[];
  remarks: Remark[];
  users: User[];
  filters: Filter;
}

const getMasterDataName = (id: number, collection: {id: number; name: string}[] | {id: number; text: string}[]) => {
  const item = collection.find(p => p.id === id);
  return item ? ('name' in item ? item.name : item.text) : 'N/A';
};

const getClientName = (id: number, clients: Client[]) => {
  const client = clients.find(c => c.id === id);
  return client ? client.name : 'Unknown Client';
}

export const exportToPDF = (data: ExportData) => {
  const { orders, clients, products, statuses } = data;
  const doc = new jspdf.jsPDF({ orientation: 'landscape' });

  doc.text("SilkFlow Order Report", 14, 16);
  
  const tableColumn = ["Order No.", "Client", "Product", "Design No.", "Ordered (m)", "Dispatched (m)", "Remaining (m)", "Status", "Expected Date"];
  const tableRows: (string | number)[][] = [];

  orders.forEach(order => {
    const totalDispatched = (order.dispatches || []).reduce((sum, d) => sum + d.quantity, 0);
    const remaining = order.meterOrdered - totalDispatched;
    const orderData = [
      order.id,
      getClientName(order.clientId, clients),
      getMasterDataName(order.productId, products),
      order.designCode,
      order.meterOrdered,
      totalDispatched,
      remaining,
      getMasterDataName(order.statusId, statuses),
      new Date(order.expectedCompletionDate).toLocaleDateString(),
    ];
    tableRows.push(orderData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });

  doc.save("silkflow_orders.pdf");
};


export const exportToExcel = (data: ExportData) => {
  const { orders, clients, products, statuses, remarks, users } = data;

  const worksheetData = orders.map(order => {
    const lastHistoryEntry = order.history && order.history.length > 0
        ? [...order.history].pop()!
        : null;
    const lastUpdateText = lastHistoryEntry ? lastHistoryEntry.description : 'N/A';
    const lastUpdateDate = lastHistoryEntry ? new Date(lastHistoryEntry.updatedAt).toLocaleDateString() : 'N/A';
    const lastUpdateTime = lastHistoryEntry ? new Date(lastHistoryEntry.updatedAt).toLocaleTimeString() : 'N/A';
    const updatedByUser = lastHistoryEntry ? users.find(u => u.id === lastHistoryEntry.updatedBy)?.name || 'Unknown' : 'N/A';

    const totalDispatched = (order.dispatches || []).reduce((sum, d) => sum + d.quantity, 0);

    return {
      "Picture": order.picture ? { t: 's', v: 'View Image', l: { Target: order.picture, Tooltip: 'Click to view image' } } : '',
      "Order No.": order.id,
      "Client": getClientName(order.clientId, clients),
      "Product": getMasterDataName(order.productId, products),
      "Design Number": order.designCode,
      "Order Date": new Date(order.orderDate).toLocaleDateString(),
      "Expected Completion Date": new Date(order.expectedCompletionDate).toLocaleDateString(),
      "Meter Ordered": order.meterOrdered,
      "Meter Dispatched": totalDispatched,
      "Meter Remaining": order.meterOrdered - totalDispatched,
      "Rate": order.rate,
      "Total Value": order.meterOrdered * order.rate,
      "Status": getMasterDataName(order.statusId, statuses),
      "Last Update": lastUpdateText,
      "Last Update Time": `${lastUpdateDate} ${lastUpdateTime}`,
      "Updated By": updatedByUser,
      "Remark": getMasterDataName(order.remarkId, remarks),
  }});

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  
  // Add styling for hyperlink cells
  for (const cellAddress in worksheet) {
      if (cellAddress[0] === '!' || !worksheet[cellAddress].l) continue;
      worksheet[cellAddress].s = {
          font: {
              color: { rgb: "0000FF" },
              underline: true
          }
      };
  }

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Picture
    { wch: 15 }, // Order No.
    { wch: 25 }, // Client
    { wch: 20 }, // Product
    { wch: 20 }, // Design Number
    { wch: 15 }, // Order Date
    { wch: 22 }, // Expected Completion Date
    { wch: 15 }, // Meter Ordered
    { wch: 18 }, // Meter Dispatched
    { wch: 18 }, // Meter Remaining
    { wch: 10 }, // Rate
    { wch: 15 }, // Total Value
    { wch: 15 }, // Status
    { wch: 40 }, // Last Update
    { wch: 22 }, // Last Update Time
    { wch: 18 }, // Updated By
    { wch: 25 }, // Remark
  ];

  XLSX.writeFile(workbook, "silkflow_orders.xlsx");
};