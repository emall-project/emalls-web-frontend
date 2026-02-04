import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import HomePage from "./pages/HomePage";
import MallPage from "./pages/MallPage";
import SearchPage from "./pages/SearchPage";

function StorePage() {
  return <div style={{ padding: 16 }}>Store Page</div>;
}

export default function App() {
  return (
    <Theme>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/malls/:mallId" element={<MallPage />} />
          <Route path="/stores/:storeId" element={<StorePage />} />
          <Route path="*" element={<div style={{ padding: 16 }}>Page Not Found</div>} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </BrowserRouter>
    </Theme>
  );
}
