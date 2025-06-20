export function checkUserRole(roles, userRole, navigate) {
  if (userRole === "Owner") return true;
  if (!roles.includes(userRole)) {
    navigate("/app/unauthorized");
    return false;
  }
  return true;
}

export const routeAccess = {
  dashboard: ["Owner", "Sales", "Procurement", "Inventory"],
  analytics: ["Owner", "Sales", "Procurement", "Inventory"],
  teamManagement: ["Owner"],
  sales: ["Owner", "Sales"],
  salesHistory: ["Owner", "Sales"],
  customers: ["Owner", "Sales"],
  purchaseOrders: ["Owner", "Procurement"],
  suppliers: ["Owner", "Procurement"],
  products: ["Owner", "Inventory"],
  stockLevels: ["Owner", "Inventory"],
};

export function canAccess(routeKey, userRole) {
  if (userRole === "Owner") return true;
  return routeAccess[routeKey]?.includes(userRole);
}
