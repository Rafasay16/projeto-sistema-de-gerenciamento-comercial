import { createBrowserRouter } from "react-router";
import DashboardLayout from "./layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import CustomersPage from "./pages/CustomersPage";
import SalesPage from "./pages/SalesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import MarketingPage from "./pages/MarketingPage";

const ComingSoonPage = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 text-3xl">
      🚧
    </div>
    <h2 className="text-2xl font-bold mb-2">Funcionalidade em Construção</h2>
    <p className="text-gray-500 max-w-md">Esta secção estará disponível nas próximas atualizações do sistema.</p>
  </div>
);

const ErrorBoundaryPage = () => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-7xl font-bold text-[#008060] mb-4">404</h1>
    <h2 className="text-2xl font-semibold mb-2">Página não encontrada</h2>
    <p className="text-gray-500 mb-8 max-w-md">O recurso solicitado não existe ou foi movido.</p>
    <a href="/" className="px-6 py-3 bg-[#008060] text-white rounded-lg font-medium hover:bg-[#006e52] transition-colors shadow-sm">
      Voltar ao Início
    </a>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage
  },
  {
    path: "/signup",
    Component: SignupPage
  },
  {
    path: "/",
    Component: DashboardLayout,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, Component: DashboardPage },
      { path: "products", Component: ProductsPage },
      { path: "customers", Component: CustomersPage },
      { path: "sales", Component: SalesPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "marketing", Component: MarketingPage },
      { path: "settings", Component: ComingSoonPage },
      { path: "*", Component: ErrorBoundaryPage }
    ]
  }
]);