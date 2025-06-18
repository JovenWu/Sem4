export const PoData = [
  {
    id: "PO-001",
    supplierName: "ABC Supplier",
    orderDate: "2025-05-10T00:00:00.000Z",
    expectedDeliveryDate: "2025-05-20T00:00:00.000Z",
    status: "Ordered",
    products: [
      { name: "Laptop", quantity: 5, price: 1200 },
      { name: "Mouse", quantity: 10, price: 25 },
      { name: "Keyboard", quantity: 8, price: 45 }
    ],
    notes: "Priority delivery"
  },
  {
    id: "PO-002",
    supplierName: "XYZ Manufacturing",
    orderDate: "2025-05-05T00:00:00.000Z",
    expectedDeliveryDate: "2025-05-15T00:00:00.000Z",
    status: "Received",
    products: [
      { name: "Desk Chair", quantity: 20, price: 150 }
    ],
    notes: ""
  },
  {
    id: "PO-003",
    supplierName: "Office Essentials",
    orderDate: "2025-05-08T00:00:00.000Z",
    expectedDeliveryDate: "2025-05-18T00:00:00.000Z",
    status: "Ordered",
    products: [
      { name: "Paper (Reams)", quantity: 50, price: 4.5 },
      { name: "Pens (Box)", quantity: 30, price: 8 },
      { name: "Stapler", quantity: 10, price: 12 },
      { name: "Folders", quantity: 100, price: 0.75 }
    ],
    notes: "Office supplies for new location"
  },
  {
    id: "PO-004",
    supplierName: "Tech Wholesale",
    orderDate: "2025-04-28T00:00:00.000Z",
    expectedDeliveryDate: "2025-05-25T00:00:00.000Z",
    status: "Ordered",
    products: [
      { name: "Monitors", quantity: 15, price: 250 },
      { name: "Docking Stations", quantity: 15, price: 120 }
    ],
    notes: "For IT department upgrade"
  },
  {
    id: "PO-005",
    supplierName: "Furniture Plus",
    orderDate: "2025-05-01T00:00:00.000Z",
    expectedDeliveryDate: "2025-06-01T00:00:00.000Z",
    status: "Received",
    products: [
      { name: "Standing Desk", quantity: 5, price: 350 },
      { name: "Bookshelf", quantity: 3, price: 180 },
      { name: "Filing Cabinet", quantity: 2, price: 220 }
    ],
    notes: "Office renovation"
  }
];