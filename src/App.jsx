import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";

import HomePage from "./pages/customer/HomePage.jsx";
import MallPage from "./pages/customer/MallPage.jsx";
import SearchPage from "./pages/customer/SearchPage.jsx";

import { AdminLayout } from "./components/admin/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdsManagement from "./pages/admin/AdsManagement/AdsManagement.jsx";
import ShopManagement from "./pages/admin/ShopManagement/ShopManagement.jsx";
import UserManagement from "./pages/admin/UserManagement/UserManagement.jsx";
import MallManagement from "./pages/admin/MallManagement/MallManagement.jsx";

function StorePage() {
  return <div style={{ padding: 16 }}>Store Page</div>;
}

export default function App() {
  const [appearance, setAppearance] = useState("light"); // "light" | "dark"

  useEffect(() => {
    const saved = localStorage.getItem("appearance");
    if (saved === "dark" || saved === "light") setAppearance(saved);
  }, []);

  const toggleAppearance = () => {
    const next = appearance === "dark" ? "light" : "dark";
    setAppearance(next);
    localStorage.setItem("appearance", next);
  };

  return (
    <Theme appearance={appearance} accentColor="blue" radius="large">
      <BrowserRouter>
        <Routes>
          {/* Customer */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/malls/:mallId" element={<MallPage />} />
          <Route path="/stores/:storeId" element={<StorePage />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={<AdminLayout appearance={appearance} onToggleTheme={toggleAppearance} />}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="malls" element={<MallManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="shops" element={<ShopManagement />} />
            <Route path="orders" element={<ShopManagement />} />
            <Route path="ads" element={<AdsManagement />} />
          </Route>

          <Route path="*" element={<div style={{ padding: 16 }}>Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </Theme>
  );
}