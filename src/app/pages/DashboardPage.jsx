import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery, gql } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, AlertTriangle, Calendar, ChevronRight } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";

// Main Stats Query
const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($startDate: String, $endDate: String) {
    dashboardStats(startDate: $startDate, endDate: $endDate) {
      totalRevenue
      revenueGrowth
      totalSales
      averageTicket
      topProducts { name revenue count }
      lowStock { id name stock }
      salesChart { date total }
    }
  }
`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [datePreset, setDatePreset] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [pageKey, setPageKey] = useState(0);

  useEffect(() => {
    setPageKey(prev => prev + 1);
  }, []);

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    let start = new Date();
    if (datePreset === "7d") start.setDate(end.getDate() - 7);
    else if (datePreset === "30d") start.setDate(end.getDate() - 30);
    else if (datePreset === "month") start = new Date(end.getFullYear(), end.getMonth(), 1);
    else if (datePreset === "year") start = new Date(end.getFullYear(), 0, 1);
    else if (datePreset === "custom" && customStart && customEnd) {
      return {
        startDate: new Date(customStart + "T00:00:00").toISOString().split('.')[0] + "Z",
        endDate: new Date(customEnd + "T23:59:59").toISOString().split('.')[0] + "Z"
      };
    }
    return { startDate: start.toISOString().split('.')[0] + "Z", endDate: end.toISOString().split('.')[0] + "Z" };
  }, [datePreset, customStart, customEnd]);

  const { loading, error, data } = useQuery(GET_DASHBOARD_STATS, { 
    variables: { startDate, endDate },
    fetchPolicy: 'network-only' 
  });

  const formatCurrency = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  if (loading && !data) return <div className="p-8 text-center text-primary font-medium animate-pulse mt-10">Carregando indicadores...</div>;
  if (error) return <div className="p-6 text-destructive font-bold border border-border bg-destructive/10 rounded-lg text-center max-w-lg mx-auto mt-10">Erro na sincronização de dados.</div>;
  
  const stats = data?.dashboardStats || {};
  const isGrowthPositive = (stats.revenueGrowth || 0) >= 0;

  return (
    <div key={pageKey} className="space-y-6 pb-12 animate-in fade-in duration-700">
      {/* Dynamic Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground text-sm">Acompanhamento de desempenho financeiro e operacional.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto items-start sm:items-center gap-2 sm:gap-3">
          {datePreset === "custom" && (
            <div className="flex items-center gap-2 bg-card p-1.5 rounded-lg border border-border w-full sm:w-auto justify-between sm:justify-start">
              <Input type="date" className="h-8 text-xs border-none bg-transparent p-0" value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <span className="text-muted-foreground text-[10px] font-bold uppercase">até</span>
              <Input type="date" className="h-8 text-xs border-none bg-transparent p-0" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          )}

          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-card border-border transition-all">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="month">Mês Atual</SelectItem>
              <SelectItem value="year">Ano Corrente</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Faturamento", val: formatCurrency(stats.totalRevenue), icon: <DollarSign size={20}/>, color: "text-primary", bg: "bg-primary/10", growth: true },
          { title: "Pedidos", val: stats.totalSales || 0, icon: <ShoppingCart size={20}/>, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Ticket Médio", val: formatCurrency(stats.averageTicket), icon: <Package size={20}/>, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((m, i) => (
          <Card key={i} className="shadow-sm border-border bg-card hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{m.title}</p>
                  <h3 className="text-2xl font-black mt-1 tracking-tight truncate max-w-[150px]">{m.val}</h3>
                </div>
                <div className={`p-2 ${m.bg} ${m.color} rounded-lg shrink-0`}>{m.icon}</div>
              </div>
              {m.growth && (
                <div className="flex items-center mt-3">
                  <Badge variant="outline" className={`border-none px-1.5 py-0.5 font-bold ${isGrowthPositive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                    {isGrowthPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                    {Math.abs(stats.revenueGrowth || 0).toFixed(1)}%
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Card className="shadow-sm border-border bg-card cursor-pointer hover:border-orange-500/50 transition-all active:scale-95" onClick={() => navigate("/products?filter=low-stock")}>
          <CardContent className="p-5 flex justify-between items-start h-full">
            <div className="flex flex-col h-full justify-between">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Estoque Crítico</p>
              <h3 className="text-2xl font-black mt-1 tracking-tight">{stats.lowStock?.length || 0}</h3>
              <div className="mt-auto text-[9px] font-bold uppercase text-primary flex items-center pt-3">
                Ver Itens <ChevronRight size={10} className="ml-1" />
              </div>
            </div>
            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg shrink-0">
              <AlertTriangle size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Revenue Chart */}
      <Card className="shadow-sm border-border bg-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-widest">Vendas Diárias</CardTitle>
          <CardDescription className="text-xs">Volume de receita bruta por dia.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.salesChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/20" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} 
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><TrendingUp size={16} className="text-primary"/> Top 5 Produtos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {stats.topProducts?.length > 0 ? (stats.topProducts || []).slice(0, 5).map((prod, i) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-3 last:border-0 hover:bg-muted/30 transition-colors px-1 rounded-md">
                <span className="font-medium truncate max-w-[180px]">{i+1}. {prod.name}</span>
                <span className="font-bold text-primary shrink-0">{formatCurrency(prod.revenue)}</span>
              </div>
            )) : (
              <p className="text-center py-4 text-xs text-muted-foreground italic">Nenhuma venda registrada no período.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Inventory Alarms */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={16} className="text-orange-500"/> Alertas de Estoque</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 text-xs text-muted-foreground mb-2">
               {stats.lowStock?.length || 0} produtos abaixo da margem de segurança.
             </div>
             <div className="space-y-2">
               {(stats.lowStock || []).slice(0, 4).map((item) => (
                 <div key={item.id} className="flex justify-between items-center bg-muted/30 p-2.5 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <Package size={14} className="text-muted-foreground shrink-0" />
                      <span className="text-xs font-semibold truncate">{item.name}</span>
                    </div>
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 font-bold shrink-0">
                      {item.stock} un
                    </Badge>
                 </div>
               ))}
             </div>
             <Button variant="ghost" className="w-full text-primary hover:bg-primary/5 text-xs font-bold mt-2" onClick={() => navigate("/products?filter=low-stock")}>
               Gerenciar Estoque <ChevronRight size={14} className="ml-1" />
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}