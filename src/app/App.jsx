import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import DashboardLayout from "./layout/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import SalesPage from "./pages/SalesPage";
import CustomersPage from "./pages/CustomersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import MarketingPage from "./pages/MarketingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas de Autenticação */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Rotas Privadas */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/marketing" element={<MarketingPage />} />
        </Route>

        {/* Fallback de Segurança */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}