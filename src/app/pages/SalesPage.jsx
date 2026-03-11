import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { 
  User, Calendar, Package, Plus,
  ChevronRight, Receipt, Loader2, Search, ShoppingCart
} from "lucide-react";

const GET_SALES_DATA = gql`
  query GetSalesData {
    sales {
      id customerName total createdAt
      items { productName quantity price total }
    }
    customers { id name tier }
    products { id name price stock }
  }
`;

const ADD_SALE = gql`
  mutation AddSale($customerId: String!, $customerName: String!, $items: [SaleItemInput]!, $total: Float!) {
    addSale(customerId: $customerId, customerName: $customerName, items: $items, total: $total) {
      id
    }
  }
`;

export default function SalesPage() {
  const { loading, error, data, refetch } = useQuery(GET_SALES_DATA, { fetchPolicy: 'network-only' });
  const [addSale] = useMutation(ADD_SALE);

  // Estados de interface e paginação
  const [selectedSale, setSelectedSale] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [itemsToDisplay, setItemsToDisplay] = useState(50);
  const [isScrolling, setIsScrolling] = useState(false);

  // Estado do carrinho de compras
  const [newOrder, setNewOrder] = useState({ customerId: "", items: [], total: 0 });

  const formatCurrency = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  // Implementação de scroll infinito para a lista de vendas
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop + 50 >= document.documentElement.offsetHeight) {
        if (!loading && data?.sales && itemsToDisplay < data.sales.length) {
          setIsScrolling(true);
          setTimeout(() => {
            setItemsToDisplay(prev => prev + 50);
            setIsScrolling(false);
          }, 400);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, data, itemsToDisplay]);

  const visibleSales = useMemo(() => {
    return (data?.sales || []).slice(0, itemsToDisplay);
  }, [data, itemsToDisplay]);

  // Gestão de itens no carrinho
  const handleAddItem = (product) => {
    const existing = newOrder.items.find(i => i.productId === product.id);
    let updatedItems;

    if (existing) {
      updatedItems = newOrder.items.map(i => 
        i.productId === product.id 
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price } 
          : i
      );
    } else {
      updatedItems = [...newOrder.items, { 
        productId: product.id, 
        productName: product.name, 
        quantity: 1, 
        price: product.price, 
        total: product.price 
      }];
    }

    const newTotal = updatedItems.reduce((acc, item) => acc + item.total, 0);
    setNewOrder({ ...newOrder, items: updatedItems, total: newTotal });
  };

  const handleFinalizeSale = async () => {
    if (!newOrder.customerId || newOrder.items.length === 0) {
      return toast.error("Selecione um cliente e ao menos um produto.");
    }

    const customer = data.customers.find(c => c.id === newOrder.customerId);

    try {
      await addSale({
        variables: {
          customerId: newOrder.customerId,
          customerName: customer.name,
          items: newOrder.items,
          total: newOrder.total
        }
      });
      toast.success(`Pedido de ${customer.name} finalizado.`);
      setIsCreateModalOpen(false);
      setNewOrder({ customerId: "", items: [], total: 0 });
      refetch();
    } catch (e) {
      toast.error("Erro ao processar venda.");
    }
  };

  if (loading && !data) return <div className="p-10 text-center animate-pulse mt-10 text-primary">Sincronizando transações...</div>;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground text-sm">Histórico e geração de novos pedidos.</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="hidden md:flex bg-primary/5 text-primary border-primary/20 items-center gap-2">
            {data?.sales?.length || 0} Total
          </Badge>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary font-bold shadow-lg shadow-primary/20">
            <Plus size={16} className="md:mr-2" /> 
            <span className="hidden md:inline">Novo Pedido</span>
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Itens</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {visibleSales.map((sale) => (
                <tr key={sale.id} onClick={() => setSelectedSale(sale)} className="group hover:bg-muted/40 cursor-pointer transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar size={12} /> {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-foreground">{sale.customerName}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="secondary" className="bg-muted text-[10px]">{sale.items.length} un.</Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-primary">{formatCurrency(sale.total)}</td>
                  <td className="px-6 py-4"><ChevronRight size={16} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isScrolling && (
          <div className="p-4 flex justify-center bg-muted/10 border-t border-border">
            <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Carregando mais...</span>
          </div>
        )}
      </Card>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl bg-card border-border shadow-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShoppingCart className="text-primary"/> Gerar Novo Pedido</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">1. Seleção de Cliente</label>
                <select 
                  className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm focus:ring-2 ring-primary/20 outline-none"
                  value={newOrder.customerId}
                  onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value })}
                >
                  <option value="">Selecione o Cliente</option>
                  {data?.customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.tier})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">2. Adicionar Itens</label>
                <div className="max-h-[220px] overflow-y-auto border border-border rounded-lg divide-y bg-muted/20">
                  {data?.products.map(p => (
                    <div key={p.id} className="p-3 flex justify-between items-center hover:bg-background transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{p.name}</p>
                        <p className="text-[10px] text-primary font-black">{formatCurrency(p.price)}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 text-primary" onClick={() => handleAddItem(p)}>
                        <Plus size={16}/>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-muted/40 rounded-2xl border border-border p-5 flex flex-col">
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-4 flex items-center gap-2"><Package size={12}/> Resumo do Pedido</p>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                {newOrder.items.length === 0 && <p className="text-center text-muted-foreground text-xs py-10 italic">Carrinho vazio...</p>}
                {newOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-background p-2 rounded-lg border border-border/50 animate-in slide-in-from-right-2">
                    <div className="text-[11px]">
                      <span className="font-bold text-primary">{item.quantity}x</span> {item.productName}
                    </div>
                    <span className="text-[11px] font-bold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-dashed border-border/50 flex justify-between items-center">
                <span className="text-sm font-bold">Total Final:</span>
                <span className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(newOrder.total)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-border mt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleFinalizeSale} className="bg-primary font-bold shadow-lg shadow-primary/30">Confirmar e Gerar Venda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-md bg-card border-border shadow-2xl">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="flex items-center gap-2"><Receipt className="text-primary"/> Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-6 pt-4">
              <div className="flex justify-between bg-muted/30 p-3 rounded-xl border border-border">
                <div><p className="text-[9px] font-bold uppercase text-muted-foreground">Cliente</p><p className="text-sm font-bold">{selectedSale.customerName}</p></div>
                <div className="text-right"><p className="text-[9px] font-bold uppercase text-muted-foreground">Realizado em</p><p className="text-sm font-medium">{new Date(selectedSale.createdAt).toLocaleDateString()}</p></div>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase text-primary tracking-widest">Itens Adquiridos</p>
                {selectedSale.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs p-2 bg-background border border-border/40 rounded shadow-sm">
                    <span className="font-medium">{it.quantity}x {it.productName}</span>
                    <span className="font-black">{formatCurrency(it.total)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-dashed border-border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">Valor Pago</span>
                <span className="text-2xl font-black text-primary">{formatCurrency(selectedSale.total)}</span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setSelectedSale(null)}>Fechar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}