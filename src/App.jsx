import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { AuthProvider } from "./auth/AuthContext";
import { CartProvider } from "./cart/CartContext";
import { ROLE_ADMIN, ROLE_CUSTOMER, ROLE_SHOP_OWNER } from "./auth/session";
import { RedirectAuthenticated, RequireAuth } from "./components/auth/RequireAuth";

import HomePage from "./pages/customer/HomePage.jsx";
import MallPage from "./pages/customer/MallPage.jsx";
import SearchPage from "./pages/customer/SearchPage.jsx";
import StorePage from "./pages/customer/StorePage.jsx";
import ProductDetailsPage from "./pages/customer/ProductDetailsPage.jsx";
import FavoritesPage from "./pages/customer/FavoritesPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import SignupPage from "./pages/customer/SignupPage.jsx";
import CustomerAccountPage from "./pages/customer/CustomerAccountPage.jsx";
import ShopOwnerRequestPage from "./pages/auth/ShopOwnerRequestPage.jsx";
import CartPage from "./pages/customer/CartPage.jsx";
import MallCartPage from "./pages/customer/MallCartPage.jsx";
import OrdersPage from "./pages/customer/OrdersPage.jsx";
import OrderDetailsPage from "./pages/customer/OrderDetailsPage.jsx";
import ReturnsPage from "./pages/customer/ReturnsPage.jsx";
import ReturnDetailsPage from "./pages/customer/ReturnDetailsPage.jsx";

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
import CatalogOverview from "./pages/admin/Catalog/CatalogOverview.jsx";
import CatalogMetadataPage from "./pages/admin/Catalog/CatalogMetadataPage.jsx";
import CatalogProductsPage from "./pages/admin/Catalog/CatalogProductsPage.jsx";
import CatalogCommentsPage from "./pages/admin/Catalog/CatalogCommentsPage.jsx";

import { ShopOwnerLayout } from "./components/shopOwner/layout/ShopOwnerLayout";
import ShopOwnerDashboard from "./pages/shopOwner/ShopOwnerDashboard";
import ShopProfile from "./pages/shopOwner/ShopProfile/ShopProfile";
import Products from "./pages/shopOwner/Products/Products";
import ComingSoon from "./pages/shopOwner/ComingSoon";
import Ads from "./pages/shopOwner/Ads/Ads";
import Offers from "./pages/shopOwner/Offers/Offers.jsx";
import Subscription from "./pages/shopOwner/Subscription/Subscription.jsx";
import ShopOwnerFileManager from "./pages/shopOwner/FileManager/FileManager.jsx";
import ShopRequests from "./pages/shopOwner/ShopRequests/ShopRequests.jsx";

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
        <CartProvider>
          <BrowserRouter>
            <Routes>
            {/* Customer */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/malls/:mallId" element={<MallPage />} />
            <Route path="/stores/:storeId" element={<StorePage />} />
            <Route path="/products/slug/:slug" element={<ProductDetailsPage />} />
            <Route path="/products/:productId" element={<ProductDetailsPage />} />
            <Route
              path="/favorites"
              element={(
                <RequireAuth roles={[ROLE_CUSTOMER]}>
                  <FavoritesPage />
                </RequireAuth>
              )}
            />
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
            <Route
              path="/cart"
              element={(
                <RequireAuth roles={[ROLE_CUSTOMER]}>
                  <CartPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/cart/mall/:mallId"
              element={(
                <RequireAuth roles={[ROLE_CUSTOMER]}>
                  <MallCartPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/orders"
              element={(
                <RequireAuth roles={[ROLE_CUSTOMER]}>
                  <OrdersPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/orders/:shopOrderId"
              element={(
                <RequireAuth roles={[ROLE_CUSTOMER]}>
                  <OrderDetailsPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/returns"
              element={(
                <RequireAuth roles={[ROLE_CUSTOMER]}>
                  <ReturnsPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/returns/:returnRequestId"
              element={(
                <RequireAuth roles={[ROLE_CUSTOMER]}>
                  <ReturnDetailsPage />
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
              <Route path="catalog" element={<CatalogOverview />} />
              <Route path="catalog/categories" element={<CatalogMetadataPage type="categories" />} />
              <Route path="catalog/brands" element={<CatalogMetadataPage type="brands" />} />
              <Route path="catalog/attributes" element={<CatalogMetadataPage type="attributes" />} />
              <Route path="catalog/tags" element={<CatalogMetadataPage type="tags" />} />
              <Route path="catalog/products" element={<CatalogProductsPage />} />
              <Route path="catalog/comments" element={<CatalogCommentsPage />} />
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
              <Route path="offers" element={<Offers />} />
              <Route path="subscription" element={<Subscription />} />
            </Route>

            <Route path="*" element={<div style={{ padding: 16 }}>Page Not Found</div>} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </Theme>
  );
}
