import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";

const CUSTOMER_ROUTE_PATTERNS = [
  "/",
  "/search",
  "/malls/:mallId",
  "/stores/:storeId",
  "/products/:productId",
  "/faq",
  "/return-policy",
  "/terms-and-conditions",
  "/favorites",
  "/cart",
  "/checkout/:mallId",
  "/orders",
  "/orders/:orderId",
  "/orders/success",
  "/customer/login",
  "/customer/forgot-password",
  "/customer/signup",
  "/customer/profile",
];

function isCustomerPath(pathname) {
  return CUSTOMER_ROUTE_PATTERNS.some((pattern) =>
    matchPath({ path: pattern, end: true }, pathname),
  );
}

export default function CustomerScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isCustomerPath(pathname)) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
