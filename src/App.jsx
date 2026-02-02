import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import HomePage from "./pages/HomePage";
import MallPage from "./pages/MallPage";

function StorePage() {
  return <div style={{ padding: 16 }}>Store Page</div>;
}

export default function App() {
  return (
    <Theme>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* ✅ Mall Page */}
          <Route path="/malls/:mallId" element={<MallPage />} />

          {/* ✅ Store Page */}
          <Route path="/stores/:storeId" element={<StorePage />} />

          {/* ✅ Optional: 404 */}
          <Route path="*" element={<div style={{ padding: 16 }}>Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </Theme>
  );
}
