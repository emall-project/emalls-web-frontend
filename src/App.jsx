import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import { useEffect, useState } from "react";

import { auth } from "./api/auth";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";

import Login from "./pages/Login";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import CustomerLogin   from "./pages/customer/CustomerLogin.jsx";
import CustomerSignup  from "./pages/customer/CustomerSignup.jsx";
import CustomerProfile from "./pages/customer/CustomerProfile.jsx";
import FavoritesPage from "./pages/customer/FavoritesPage.jsx";
import HomePage from "./pages/customer/HomePage.jsx";
import MallPage from "./pages/customer/MallPage.jsx";
import SearchPage from "./pages/customer/SearchPage.jsx";
import StorePage from "./pages/customer/StorePage.jsx";
import CustomerProductsPage from "./pages/customer/CustomerProductsPage.jsx";
import ProductPage from "./pages/customer/ProductPage.jsx";
import CartPage from "./pages/customer/CartPage.jsx";
import CheckoutPage from "./pages/customer/CheckoutPage.jsx";
import OrderSuccessPage from "./pages/customer/OrderSuccessPage.jsx";
import OrdersPage from "./pages/customer/OrdersPage.jsx";
import OrderDetailPage from "./pages/customer/OrderDetailPage.jsx";
import CustomerScrollToTop from "./components/customer/CustomerScrollToTop.jsx";
import ReturnsPage from "./pages/customer/ReturnsPage.jsx";
import ReturnDetailPage from "./pages/customer/ReturnDetailPage.jsx";
import FaqPage from "./pages/customer/FaqPage.jsx";
import ReturnPolicyPage from "./pages/customer/ReturnPolicyPage.jsx";
import TermsAndConditionsPage from "./pages/customer/TermsAndConditionsPage.jsx";

import { AdminLayout } from "./components/admin/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdsManagement from "./pages/admin/AdsManagement/AdsManagement.jsx";
import ShopManagement from "./pages/admin/ShopManagement/ShopManagement.jsx";
import UserManagement from "./pages/admin/UserManagement/UserManagement.jsx";
import MallManagement from "./pages/admin/MallManagement/MallManagement.jsx";
import OrdersManagement from "./pages/admin/OrdersManagement/OrdersManagement.jsx";
import FinanceManagement from "./pages/admin/FinanceManagement/FinanceManagement.jsx";
import ShopRequests from "./pages/admin/ShopRequests/ShopRequests.jsx";
import AdminAccount from "./pages/admin/Account/AdminAccount.jsx";
import CityManagement from "./pages/admin/CityManagement/CityManagement.jsx";
import RoleManagement from "./pages/admin/RoleManagement/RoleManagement.jsx";
import AdminFileManager from "./pages/admin/FileManager/AdminFileManager.jsx";
import CatalogOverview from "./pages/admin/Catalog/CatalogOverview.jsx";
import CatalogCommentsPage from "./pages/admin/Catalog/CatalogCommentsPage.jsx";
import CatalogProductsPage from "./pages/admin/Catalog/CatalogProductsPage.jsx";
import CatalogCategoriesPage from "./pages/admin/Catalog/CatalogCategoriesPage.jsx";
import CatalogBrandsPage from "./pages/admin/Catalog/CatalogBrandsPage.jsx";

import { ShopOwnerLayout } from "./components/shopOwner/layout/ShopOwnerLayout";
import ShopOwnerLogin from "./pages/shopOwner/ShopOwnerLogin";
import ShopOwnerSignup from "./pages/shopOwner/ShopOwnerSignup";
import ShopOwnerDashboard from "./pages/shopOwner/ShopOwnerDashboard";
import ShopProfile from "./pages/shopOwner/ShopProfile/ShopProfile";
import ProductList    from "./pages/shopOwner/Products/ProductList";
import ProductForm    from "./pages/shopOwner/Products/ProductForm";
import ProductDetails from "./pages/shopOwner/Products/ProductDetails";
import ComingSoon from "./pages/shopOwner/ComingSoon";
import Ads from "./pages/shopOwner/Ads/Ads";
import Offers from "./pages/shopOwner/Offers/Offers";
import Orders from "./pages/shopOwner/Orders/Orders";
import Returns from "./pages/shopOwner/Returns/Returns";
import ShopOwnerSubscriptionPage from "./pages/shopOwner/Subscription/ShopOwnerSubscriptionPage.jsx";
import ShopOwnerFinancePage from "./pages/shopOwner/Finance/ShopOwnerFinancePage.jsx";
import ShopOwnerAccount from "./pages/shopOwner/Account/ShopOwnerAccount.jsx";
import NewShopRequestPage from "./pages/shopOwner/ShopRequests/NewShopRequestPage.jsx";
import FileManager from "./pages/shopOwner/FileManager/FileManager.jsx";

// Redirects to /login if not authenticated; optionally checks role
function ProtectedRoute({ children, role, loginPath = "/login" }) {
  const user = auth.getUser();
  if (!user) return <Navigate to={loginPath} replace />;
  if (role && user.role !== role) return <Navigate to={loginPath} replace />;
  return children;
}

export default function App() {
  const [appearance, setAppearance] = useState("light");

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
        <CartProvider>
        <FavoritesProvider>
        <CustomerScrollToTop />
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage audience="admin" />} />
          <Route path="/customer/login"   element={<CustomerLogin />} />
          <Route path="/customer/forgot-password" element={<ForgotPasswordPage audience="customer" />} />
          <Route path="/customer/signup"  element={<CustomerSignup />} />
          <Route path="/customer/profile" element={
            <ProtectedRoute role="ROLE_CUSTOMER" loginPath="/customer/login">
              <CustomerProfile />
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute role="ROLE_CUSTOMER" loginPath="/customer/login">
              <FavoritesPage />
            </ProtectedRoute>
          } />
          <Route path="/shop-owner/login" element={<ShopOwnerLogin />} />
          <Route path="/shop-owner/forgot-password" element={<ForgotPasswordPage audience="shop-owner" />} />
          <Route path="/shop-owner/signup" element={<ShopOwnerSignup />} />

          {/* Customer */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/products" element={<CustomerProductsPage />} />
          <Route path="/malls/:mallId" element={<MallPage />} />
          <Route path="/stores/:storeId" element={<StorePage />} />
          <Route path="/products/:productId" element={<ProductPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
          <Route path="/cart" element={
            <ProtectedRoute role="ROLE_CUSTOMER" loginPath="/customer/login">
              <CartPage />
            </ProtectedRoute>
          } />
          <Route path="/checkout/:mallId" element={
            <ProtectedRoute role="ROLE_CUSTOMER" loginPath="/customer/login">
              <CheckoutPage />
            </ProtectedRoute>
          } />
          <Route path="/orders/success" element={<OrderSuccessPage />} />
          <Route path="/orders" element={
            <ProtectedRoute role="ROLE_CUSTOMER" loginPath="/customer/login">
              <OrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/orders/:orderId" element={
            <ProtectedRoute role="ROLE_CUSTOMER" loginPath="/customer/login">
              <OrderDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/returns" element={
            <ProtectedRoute role="ROLE_CUSTOMER" loginPath="/customer/login">
              <ReturnsPage />
            </ProtectedRoute>
          } />
          <Route path="/returns/:returnRequestId" element={
            <ProtectedRoute role="ROLE_CUSTOMER" loginPath="/customer/login">
              <ReturnDetailPage />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ROLE_ADMIN">
                <AdminLayout appearance={appearance} onToggleTheme={toggleAppearance} />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="malls"  element={<MallManagement />} />
            <Route path="users"  element={<UserManagement />} />
            <Route path="shops"  element={<ShopManagement />} />
            <Route path="shop-requests" element={<ShopRequests />} />
            <Route path="orders"  element={<OrdersManagement />} />
            <Route path="finance" element={<FinanceManagement />} />
            <Route path="ads"     element={<AdsManagement />} />
            <Route path="account" element={<AdminAccount />} />
            <Route path="cities"           element={<CityManagement />} />
            <Route path="roles"            element={<RoleManagement />} />
            <Route path="files"            element={<AdminFileManager />} />
            <Route path="catalog"            element={<CatalogOverview />} />
            <Route path="catalog/comments"   element={<CatalogCommentsPage />} />
            <Route path="catalog/products"   element={<CatalogProductsPage />} />
            <Route path="catalog/categories" element={<CatalogCategoriesPage />} />
            <Route path="catalog/brands"     element={<CatalogBrandsPage />} />
          </Route>

          {/* Shop Owner */}
          <Route
            path="/shop-owner"
            element={
              <ProtectedRoute role="ROLE_SHOP_OWNER" loginPath="/shop-owner/login">
                <ShopOwnerLayout appearance={appearance} onToggleTheme={toggleAppearance} />
              </ProtectedRoute>
            }
          >
            <Route index element={<ShopOwnerDashboard />} />
            <Route path="profile"      element={<ShopProfile />} />
            <Route path="products"          element={<ProductList />} />
            <Route path="products/new"      element={<ProductForm />} />
            <Route path="products/:id"      element={<ProductDetails />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="orders"       element={<Orders />} />
            <Route path="returns"      element={<Returns />} />
            <Route path="ads"          element={<Ads />} />
            <Route path="finance"      element={<ShopOwnerFinancePage />} />
            <Route path="offers"       element={<Offers />} />
            <Route path="subscription" element={<ShopOwnerSubscriptionPage />} />
            <Route path="account"        element={<ShopOwnerAccount />} />
            <Route path="shop-requests" element={<NewShopRequestPage />} />
            <Route path="files"         element={<FileManager />} />
          </Route>

          <Route path="*" element={<div style={{ padding: 16 }}>Page Not Found</div>} />
        </Routes>
        </FavoritesProvider>
        </CartProvider>
      </BrowserRouter>
    </Theme>
  );
}
