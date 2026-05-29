import { useState, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, MousePointerClick, TrendingUp, Calendar, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";

const GET_ANALYTICS = gql`
  query GetAnalytics($startDate: String, $endDate: String) {
    analytics(startDate: $startDate, endDate: $endDate) {
      id date visitors pageViews conversionRate
    }
  }
`;

export default function AnalyticsPage() {
  const [datePreset, setDatePreset] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    let start = new Date();
    if (datePreset === "7d") start.setDate(end.getDate() - 7);
    else if (datePreset === "30d") start.setDate(end.getDate() - 30);
    else if (datePreset === "month") start = new Date(end.getFullYear(), end.getMonth(), 1);
    else if (datePreset === "year") start = new Date(end.getFullYear(), 0, 1);
    else if (datePreset === "custom" && customStart && customEnd) {
      return { startDate: new Date(customStart + "T00:00:00").toISOString(), endDate: new Date(customEnd + "T23:59:59").toISOString() };
    }
    return { startDate: start.toISOString().split('.')[0] + "Z", endDate: end.toISOString().split('.')[0] + "Z" };
  }, [datePreset, customStart, customEnd]);

  const { loading, error, data } = useQuery(GET_ANALYTICS, { variables: { startDate, endDate }, fetchPolicy: 'network-only' });

  if (loading && !data) return <div className="p-8 text-center text-primary font-medium animate-pulse mt-10">Carregando tráfego...</div>;
  if (error) return <div className="p-8 text-destructive font-bold border border-destructive/20 bg-destructive/10 rounded-lg m-4">Erro: {error.message}</div>;

  const analyticsData = data?.analytics || [];
  const totalVisitors = analyticsData.reduce((sum, day) => sum + day.visitors, 0);
  const totalPageViews = analyticsData.reduce((sum, day) => sum + day.pageViews, 0);
  const avgConversion = analyticsData.length > 0 ? (analyticsData.reduce((sum, day) => sum + day.conversionRate, 0) / analyticsData.length) : 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Análise de Tráfego</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitoramento do comportamento dos visitantes.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {datePreset === "custom" && (
            <div className="flex items-center gap-2 bg-card p-1.5 rounded-lg border border-border">
              <Input type="date" className="h-8 text-xs border-none bg-transparent" value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <span className="text-muted-foreground text-xs font-medium">até</span>
              <Input type="date" className="h-8 text-xs border-none bg-transparent" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          )}
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[180px] h-10 bg-card border-border">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5 flex justify-between items-center">
            <div><p className="text-sm font-medium text-muted-foreground">Visitantes</p><h3 className="text-3xl font-bold">{totalVisitors.toLocaleString()}</h3></div>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={20} /></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5 flex justify-between items-center">
            <div><p className="text-sm font-medium text-muted-foreground">Visualizações</p><h3 className="text-3xl font-bold">{totalPageViews.toLocaleString()}</h3></div>
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><MousePointerClick size={20} /></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5 flex justify-between items-center">
            <div><p className="text-sm font-medium text-muted-foreground">Conversão</p><h3 className="text-3xl font-bold">{avgConversion.toFixed(2)}%</h3></div>
            <div className="p-2 bg-primary/10 text-primary rounded-lg"><TrendingUp size={20} /></div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> Evolução</CardTitle>
          <CardDescription>Comparativo de acessos diários.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/30" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="pageViews" name="Visualizações" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="visitors" name="Visitantes" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}