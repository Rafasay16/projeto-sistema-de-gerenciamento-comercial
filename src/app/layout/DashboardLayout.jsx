import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useQuery, gql } from "@apollo/client";
import { 
  LayoutDashboard, ShoppingCart, Package, Users, 
  Activity, Megaphone, Bell, Sun, Moon, LogOut, 
  Menu, X, Store 
} from "lucide-react";

// Query para buscar dados globais de notificações (estoque baixo)
const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    dashboardStats { lowStock { id name stock } }
    sales { id customerName total createdAt }
  }
`;

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userData, setUserData] = useState({ name: "Usuário", email: "", initials: "U" });

  useEffect(() => {
    // Recupera e decodifica o Token JWT para exibir dados do usuário logado
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        const name = payload.name || "Usuário";
        setUserData({
          name,
          email: payload.email || "",
          initials: name.substring(0, 2).toUpperCase()
        });
      } catch (e) { 
        console.error("Erro ao processar token de autenticação", e); 
      }
    }

    // Sincronização do Tema Dark/Light
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleNotifClick = (path) => {
    setIsNotifOpen(false);
    if (path) navigate(path);
  };

  const { data: notifData } = useQuery(GET_NOTIFICATIONS, { fetchPolicy: "network-only", pollInterval: 30000 });
  
  const notifications = [];
  if (notifData) {
    (notifData.dashboardStats?.lowStock || []).forEach(item => {
      notifications.push({
        id: `stock-${item.id}`,
        title: "Estoque Crítico",
        desc: `${item.name} tem apenas ${item.stock} un!`,
        path: `/products?search=${encodeURIComponent(item.name)}`,
        icon: <Package className="w-4 h-4 text-orange-600" />,
        color: "bg-orange-100 dark:bg-orange-900/30"
      });
    });
  }

  const navLinks = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: "Pedidos", path: "/sales", icon: <ShoppingCart className="w-4 h-4" /> },
    { name: "Produtos", path: "/products", icon: <Package className="w-4 h-4" /> },
    { name: "Clientes", path: "/customers", icon: <Users className="w-4 h-4" /> },
    { name: "Analytics", path: "/analytics", icon: <Activity className="w-4 h-4" /> },
    { name: "Marketing", path: "/marketing", icon: <Megaphone className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      
      {/* Header Principal */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-primary font-bold text-xl cursor-pointer" onClick={() => navigate("/")}>
            <Store size={24} />
            <span className="hidden sm:inline">InsightGestor</span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.path 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          
          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-secondary transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notificações */}
          <div className="relative">
            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 rounded-full hover:bg-secondary relative">
              <Bell size={20} />
              {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-card" />}
            </button>
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-border font-bold text-xs uppercase text-muted-foreground">Notificações</div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} onClick={() => handleNotifClick(n.path)} className="flex gap-3 p-3 border-b border-border hover:bg-secondary cursor-pointer">
                      <div className={`p-2 rounded-full ${n.color}`}>{n.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="lg:hidden p-2 hover:bg-secondary rounded-md" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Seção de Perfil Desktop */}
          <div className="relative hidden sm:block">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              {userData.initials}
            </button>
            
            {/* Menu Dropdown do Perfil */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-50 p-1 animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-border mb-1">
                  <p className="text-sm font-bold truncate text-foreground">{userData.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{userData.email}</p>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} /> Sair da Conta
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <nav className="lg:hidden bg-card border-b border-border p-4 space-y-2 animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {link.icon} {link.name}
            </Link>
          ))}
          <div className="pt-4 mt-2 border-t border-border">
             <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 w-full hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors">
               <LogOut size={18} /> Sair
             </button>
          </div>
        </nav>
      )}

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

    </div>
  );
}