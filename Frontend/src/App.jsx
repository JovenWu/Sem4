import { Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import "./index.css";
import PurchaseOrder from "./pages/PurchaseOrder";
import SalesOrder from "./pages/SalesOrder";

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="purchase" element={<PurchaseOrder />} />
        <Route path="sales" element={<SalesOrder />} />
      </Route>
    </Routes>
  );
}

export default App;
