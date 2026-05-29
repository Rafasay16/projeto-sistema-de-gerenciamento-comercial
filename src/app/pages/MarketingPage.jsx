import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Megaphone, Target, DollarSign, Percent, Plus, Share2, Globe, Facebook, Instagram, Sparkles, Trophy } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";

const GET_MARKETING = gql`
  query GetMarketing {
    campaigns { id name platform status budget spent impressions clicks conversions roi }
  }
`;

const ADD_CAMPAIGN = gql`
  mutation AddCampaign($input: CampaignInput!) {
    addCampaign(input: $input) { id name }
  }
`;

export default function MarketingPage() {
  const { loading, error, data, refetch } = useQuery(GET_MARKETING, { fetchPolicy: 'network-only' });
  const [addCampaign] = useMutation(ADD_CAMPAIGN);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", platform: "Google Ads", budget: 0, status: "Ativa" });
  const [animatedData, setAnimatedData] = useState([]);

  const platforms = [
    { name: "Google Ads", type: "Pago" },
    { name: "Meta Ads (FB/IG)", type: "Pago" },
    { name: "TikTok Ads", type: "Pago" },
    { name: "Instagram (Orgânico)", type: "Orgânico" },
    { name: "TikTok (Orgânico)", type: "Orgânico" },
  ];

  const campaigns = data?.campaigns || [];
  const totalSpent = useMemo(() => campaigns.reduce((sum, camp) => sum + camp.spent, 0), [campaigns]);
  const totalConversions = useMemo(() => campaigns.reduce((sum, camp) => sum + camp.conversions, 0), [campaigns]);
  const avgROI = useMemo(() => campaigns.length > 0 ? campaigns.reduce((sum, camp) => sum + camp.roi, 0) / campaigns.length : 0, [campaigns]);
  
  const topCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => b.conversions - a.conversions).slice(0, 8);
  }, [campaigns]);

  useEffect(() => {
    if (topCampaigns.length > 0) {
      setAnimatedData([]);
      const timer = setTimeout(() => { setAnimatedData(topCampaigns); }, 50);
      return () => clearTimeout(timer);
    }
  }, [topCampaigns]);

  const formatCurrency = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleCreate = async () => {
    if (!newCampaign.name) return toast.error("Insira o nome da campanha.");
    try {
      await addCampaign({ variables: { input: { ...newCampaign, budget: parseFloat(newCampaign.budget) } } });
      toast.success("Campanha registada.");
      setIsModalOpen(false);
      setNewCampaign({ name: "", platform: "Google Ads", budget: 0, status: "Ativa" });
      refetch();
    } catch (e) { toast.error("Erro ao criar campanha."); }
  };

  if (loading && !data) return <div className="p-10 text-center animate-pulse text-primary font-bold">Sincronizando estratégias...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground text-sm">Gestão de tráfego e ROI.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary font-bold shadow-lg shadow-primary/20">
          <Plus size={16} className="mr-2" /> Nova Campanha
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5 flex justify-between items-center">
            <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Investimento Total</p><h3 className="text-2xl font-black">{formatCurrency(totalSpent)}</h3></div>
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><DollarSign size={20} /></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5 flex justify-between items-center">
            <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Conversões</p><h3 className="text-2xl font-black">{totalConversions.toLocaleString()}</h3></div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Target size={20} /></div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5 flex justify-between items-center">
            <div><p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">ROI Médio</p><h3 className="text-2xl font-black text-primary">{avgROI.toFixed(1)}%</h3></div>
            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl"><Percent size={20} /></div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Top 8 Campanhas</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">Conversões por Campanha</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={animatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'currentColor' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'hsl(var(--primary)/0.08)' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
              <Bar dataKey="clicks" name="Cliques" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="conversions" name="Conversões" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm overflow-hidden mt-6">
        <CardHeader className="border-b border-border bg-muted/20 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest">Histórico de Campanhas</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-muted-foreground uppercase bg-card/95 font-bold border-b border-border sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3">Campanha</th>
                <th className="px-6 py-3">Canal</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Gasto</th>
                <th className="px-6 py-3 text-right">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-bold truncate max-w-[200px]">{camp.name}</td>
                  <td className="px-6 py-4"><Badge variant="secondary" className="text-[9px] font-bold">{camp.platform}</Badge></td>
                  <td className="px-6 py-4"><Badge variant="outline" className={camp.status === 'Ativa' ? 'text-green-500 border-green-500/30 bg-green-500/10 text-[9px]' : 'text-[9px]'}>{camp.status}</Badge></td>
                  <td className="px-6 py-4 font-bold text-xs text-right text-muted-foreground">{formatCurrency(camp.spent)}</td>
                  <td className={`px-6 py-4 text-right font-black ${camp.roi > 0 ? 'text-primary' : 'text-red-500'}`}>{camp.roi.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-card border-border shadow-2xl">
          <DialogHeader><DialogTitle className="text-sm font-bold uppercase tracking-widest">Nova Campanha</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome</label>
              <Input placeholder="Ex: Lançamento Verão 2026" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Canal</label>
              <select className="w-full h-10 bg-background border border-border rounded-md px-3 text-sm focus:ring-2 ring-primary/20 outline-none" value={newCampaign.platform} onChange={e => setNewCampaign({...newCampaign, platform: e.target.value})}>
                {platforms.map(p => <option key={p.name} value={p.name}>{p.name} ({p.type})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Orçamento (R$)</label>
                <Input type="number" value={newCampaign.budget} onChange={e => setNewCampaign({...newCampaign, budget: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Status</label>
                <select className="w-full h-10 bg-background border border-border rounded-md px-3 text-sm" value={newCampaign.status} onChange={e => setNewCampaign({...newCampaign, status: e.target.value})}>
                  <option value="Ativa">Ativa</option>
                  <option value="Pausada">Pausada</option>
                </select>
              </div>
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleCreate} className="flex-1 bg-primary font-bold">Criar</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}