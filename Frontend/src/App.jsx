import { Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import "./index.css";
import PurchaseOrder from "./pages/PurchaseOrder";
import SalesOrder from "./pages/SalesOrder";
import Account from "./pages/Account";
import Profile from "./pages/Profile";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <Routes>
      <Route path="/app" element={<RootLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="purchase" element={<PurchaseOrder />} />
        <Route path="sales" element={<SalesOrder />} />
        <Route path="account" element={<Account />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
}

export default App;
