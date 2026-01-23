import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { Theme } from "@radix-ui/themes";

export default function App() {
  return (
    <Theme>
      <HomePage />
    </Theme>
  );
}
