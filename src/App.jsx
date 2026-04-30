import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { AuthProvider } from "./auth/AuthContext";
import { ROLE_ADMIN, ROLE_CUSTOMER, ROLE_SHOP_OWNER } from "./auth/session";
import { RedirectAuthenticated, RequireAuth } from "./components/auth/RequireAuth";

import HomePage from "./pages/customer/HomePage.jsx";
import MallPage from "./pages/customer/MallPage.jsx";
import SearchPage from "./pages/customer/SearchPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import SignupPage from "./pages/customer/SignupPage.jsx";
import CustomerAccountPage from "./pages/customer/CustomerAccountPage.jsx";
import ShopOwnerRequestPage from "./pages/auth/ShopOwnerRequestPage.jsx";

import { AdminLayout } from "./components/admin/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdsManagement from "./pages/admin/AdsManagement/AdsManagement.jsx";
import ShopManagement from "./pages/admin/ShopManagement/ShopManagement.jsx";
import UserManagement from "./pages/admin/UserManagement/UserManagement.jsx";
import MallManagement from "./pages/admin/MallManagement/MallManagement.jsx";
import AdminFileManager from "./pages/admin/FileManager/FileManager.jsx";
import ShopOwnerRequests from "./pages/admin/ShopOwnerRequests/ShopOwnerRequests.jsx";
import CityManagement from "./pages/admin/CityManagement/CityManagement.jsx";
import RoleManagement from "./pages/admin/RoleManagement/RoleManagement.jsx";

import { ShopOwnerLayout } from "./components/shopOwner/layout/ShopOwnerLayout";
import ShopOwnerDashboard from "./pages/shopOwner/ShopOwnerDashboard";
import ShopProfile from "./pages/shopOwner/ShopProfile/ShopProfile";
import Products from "./pages/shopOwner/Products/Products";
import ComingSoon from "./pages/shopOwner/ComingSoon";
import Ads from "./pages/shopOwner/Ads/Ads";
import ShopOwnerFileManager from "./pages/shopOwner/FileManager/FileManager.jsx";
import ShopRequests from "./pages/shopOwner/ShopRequests/ShopRequests.jsx";

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
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/malls/:mallId" element={<MallPage />} />
            <Route path="/stores/:storeId" element={<StorePage />} />
            <Route
              path="/login"
              element={
                <RedirectAuthenticated>
                  <LoginPage />
                </RedirectAuthenticated>
              }
            />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/shop-owner-request" element={<ShopOwnerRequestPage />} />
            <Route
              path="/account"
              element={(
                <RequireAuth roles={[ROLE_CUSTOMER]}>
                  <CustomerAccountPage />
                </RequireAuth>
              )}
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={(
                <RequireAuth roles={[ROLE_ADMIN]}>
                  <AdminLayout appearance={appearance} onToggleTheme={toggleAppearance} />
                </RequireAuth>
              )}
            >
              <Route index element={<AdminDashboard />} />
              <Route path="malls" element={<MallManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="shops" element={<ShopManagement />} />
              <Route path="shop-requests" element={<ShopOwnerRequests />} />
              <Route path="cities" element={<CityManagement />} />
              <Route path="roles" element={<RoleManagement />} />
              <Route path="orders" element={<ShopManagement />} />
              <Route path="ads" element={<AdsManagement />} />
              <Route path="files" element={<AdminFileManager />} />
            </Route>

            {/* Shop Owner */}
            <Route
              path="/shop-owner"
              element={(
                <RequireAuth roles={[ROLE_SHOP_OWNER]}>
                  <ShopOwnerLayout appearance={appearance} onToggleTheme={toggleAppearance} />
                </RequireAuth>
              )}
            >
              <Route index element={<ShopOwnerDashboard />} />
              <Route path="profile" element={<ShopProfile />} />
              <Route path="products" element={<Products />} />
              <Route path="shop-requests" element={<ShopRequests />} />
              <Route path="files" element={<ShopOwnerFileManager />} />
              <Route path="orders" element={<ComingSoon title="إدارة الطلبات" />} />
              <Route path="returns" element={<ComingSoon title="إدارة الإرجاعات" />} />
              <Route path="ads" element={<Ads />} />
              <Route path="finance" element={<ComingSoon title="المستحقات المالية" />} />
              <Route path="offers" element={<ComingSoon title="إدارة العروض" />} />
              <Route path="subscription" element={<ComingSoon title="إدارة الاشتراك" />} />
            </Route>

            <Route path="*" element={<div style={{ padding: 16 }}>Page Not Found</div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Theme>
  );
}
