import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Store, ArrowRight, Loader2, Sun, Moon } from "lucide-react";
import ParticleBackground from "../components/ui/ParticleBackground";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Inicialização do tema com base nas preferências guardadas ou do sistema e verificação de token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(window.atob(token.split('.')[1]));
        if (!payload.exp || payload.exp * 1000 > Date.now()) {
          navigate("/");
          return;
        }
      } catch (e) { }
    }

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, [navigate]);

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Preencha todos os campos.");
    setLoading(true);
    try {
      const res = await fetch(`http://${window.location.hostname}:3000/api/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        toast.success(`Bem-vindo, ${data.user.name}.`);
        navigate("/");
      } else toast.error(data.error || "Credenciais inválidas.");
    } catch (err) { toast.error("Erro de conexão com o servidor."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background text-foreground transition-colors duration-300">
      <ParticleBackground />
      <button 
        onClick={toggleDarkMode} 
        className="absolute top-8 right-8 p-3 rounded-full hover:bg-secondary text-foreground transition-colors z-20"
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>
      <div className="absolute top-8 left-8 flex items-center gap-2 text-primary font-bold text-xl z-10 drop-shadow-sm">
        <Store size={28} /> <span className="hidden sm:inline">InsightGestor</span>
      </div>
      <Card className="w-full max-w-md border-border shadow-2xl relative z-10 bg-card/80 backdrop-blur-xl animate-in zoom-in-95 duration-500">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-black tracking-tight text-foreground">Login</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">Insira as suas credenciais de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Email</label>
              <Input type="email" placeholder="admin@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background/50" />
            </div>
            <div className="space-y-1 pb-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Palavra-passe</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background/50" />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar no Dashboard"}
            </Button>
          </form>
          <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border pt-6">
            Não tem uma conta?{" "}
            <Link to="/signup" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
              Criar conta <ArrowRight size={14} />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}