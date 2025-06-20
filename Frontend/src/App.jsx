import { Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import "./index.css";
import PurchaseOrder from "./pages/PurchaseOrder";
import SalesOrder from "./pages/SalesOrder";
import Employees from "./pages/Employees";
import Profile from "./pages/Profile";
import LandingPage from "./pages/LandingPage";
import LoginForm from "./pages/LoginForm";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import StockLevel from "./pages/StockLevel";

function App() {
  return (
    <Routes>
      <Route path="/app" element={<RootLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="purchase" element={<PurchaseOrder />} />
        <Route path="sales" element={<SalesOrder />} />
        <Route path="employees" element={<Employees />} />
        <Route path="profile" element={<Profile />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="customers" element={<Customers />} />
        <Route path="products" element={<Products />} />
        <Route path="stock-levels" element={<StockLevel />} />
      </Route>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginForm />} />
    </Routes>
  );
}

export default App;
