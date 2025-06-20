import { Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import "./index.css";
import PurchaseOrder from "./pages/PurchaseOrder";
import SalesHistory from "./pages/SalesHistory";
import Sales from "./pages/Sales";
import Employees from "./pages/Employees";
import Profile from "./pages/Profile";
import LandingPage from "./pages/LandingPage";
import LoginForm from "./pages/LoginForm";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import StockLevel from "./pages/StockLevel";
import Reports from "./pages/Reports";
import Unauthorized401 from "./pages/Unauthorized401";

function App() {
  return (
    <Routes>
      <Route path="/app" element={<RootLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="forecast" element={<Inventory />} />
        <Route path="purchase" element={<PurchaseOrder />} />
        <Route path="sales-history" element={<SalesHistory />} />
        <Route path="sales" element={<Sales />} />
        <Route path="employees" element={<Employees />} />
        <Route path="profile" element={<Profile />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="customers" element={<Customers />} />
        <Route path="products" element={<Products />} />
        <Route path="stock-levels" element={<StockLevel />} />
        <Route path="reports" element={<Reports />} />
        <Route path="unauthorized" element={<Unauthorized401 />} />
      </Route>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginForm />} />
    </Routes>
  );
}

export default App;
