import { useState, useMemo } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { Mail, Search, Pencil, Phone, Plus, Trash2, UserPlus, AlertCircle } from "lucide-react";

// --- GraphQL Operations ---
const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers { id name email phone tier totalSpent }
  }
`;

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: CustomerInput) {
    updateCustomer(id: $id, input: $input) { id email phone }
  }
`;

const ADD_CUSTOMER = gql`
  mutation AddCustomer($input: CustomerInput!) {
    addCustomer(input: $input) { id name email phone tier totalSpent }
  }
`;

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

export default function CustomersPage() {
  const { loading, error, data, refetch } = useQuery(GET_CUSTOMERS, { fetchPolicy: 'network-only' });
  const [updateCustomer] = useMutation(UPDATE_CUSTOMER);
  const [addCustomer] = useMutation(ADD_CUSTOMER);
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER);

  // --- Interface State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTier, setActiveTier] = useState("todos");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });

  const formatCurrency = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  // --- Search and Filter Logic ---
  const filteredCustomers = useMemo(() => {
    const list = data?.customers || [];
    return list.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = activeTier === "todos" || c.tier?.toLowerCase() === activeTier;
      return matchesSearch && matchesTier;
    });
  }, [data, searchTerm, activeTier]);

  // --- Event Handlers ---
  const onSaveEdit = async () => {
    try {
      await updateCustomer({
        variables: {
          id: editingCustomer.id,
          input: { email: editingCustomer.email, phone: editingCustomer.phone }
        }
      });
      toast.success("Dados do cliente atualizados com sucesso.");
      setEditingCustomer(null);
      refetch();
    } catch (e) { toast.error("Ocorreu um erro ao salvar as alterações."); }
  };

  const onAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      return toast.error("Por favor, preencha os campos obrigatórios.");
    }
    try {
      await addCustomer({ variables: { input: newCustomer } });
      toast.success("Cliente registado com sucesso.");
      setIsAddModalOpen(false);
      setNewCustomer({ name: "", email: "", phone: "" });
      refetch();
    } catch (e) { toast.error("Falha ao criar novo registo de cliente."); }
  };

  const onDeleteCustomer = async (id, name) => {
    if (!confirm(`Confirmar a exclusão permanente de ${name}?`)) return;
    try {
      await deleteCustomer({ variables: { id } });
      toast.success("Registo removido.");
      refetch();
    } catch (e) { toast.error("Erro ao processar a exclusão."); }
  };

  if (loading && !data) return <div className="p-10 text-center animate-pulse text-primary font-medium">Sincronizando base de dados...</div>;
  if (error) return (
    <div className="p-6 text-center text-destructive bg-destructive/5 rounded-xl border border-destructive/20 max-w-lg mx-auto mt-10">
      <AlertCircle className="mx-auto mb-2" />
      <p className="font-bold">Erro na Sincronização</p>
      <code className="text-xs break-all">{error.message}</code>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Header Section: Responsive stacking */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gestão de contactos e níveis de fidelidade.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="flex bg-muted p-1 rounded-lg border border-border flex-1 sm:flex-none">
            {["todos", "bronze", "prata", "ouro"].map(t => (
              <button 
                key={t} 
                onClick={() => setActiveTier(t)} 
                className={`flex-1 sm:flex-none px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                  activeTier === t ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary font-bold px-4">
            <Plus size={16} className="mr-2" /> Novo Cliente
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-3 sm:p-4 flex items-center gap-2">
          <Search size={18} className="text-muted-foreground shrink-0"/>
          <Input 
            placeholder="Pesquisar por nome ou e-mail..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="border-none focus-visible:ring-0 w-full h-8"
          />
        </CardContent>
      </Card>

      {/* Customer Grid: Responsive column count */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => (
          <Card key={c.id} className="border-border hover:border-primary/40 transition-all group overflow-hidden">
            <CardContent className="p-5 flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex gap-4 min-w-0">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center font-bold text-primary border border-border shrink-0">
                  {c.name[0]}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold truncate text-sm" title={c.name}>{c.name}</p>
                    <Badge variant="outline" className="text-[8px] font-bold uppercase shrink-0">{c.tier}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Mail size={12} className="shrink-0"/> {c.email}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Phone size={12} className="shrink-0"/> {c.phone || "---"}
                  </p>
                </div>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-between border-t sm:border-t-0 pt-3 sm:pt-0 shrink-0">
                <p className="text-lg font-black text-primary">{formatCurrency(c.totalSpent)}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" onClick={() => setEditingCustomer({...c})}>
                    <Pencil size={14}/>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDeleteCustomer(c.id, c.name)}>
                    <Trash2 size={14}/>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground italic">
            Nenhum cliente corresponde aos critérios de pesquisa.
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full bg-card border-border shadow-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="text-primary"/> Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome Completo</label>
              <Input placeholder="Nome do cliente" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Endereço de E-mail</label>
              <Input placeholder="cliente@exemplo.com" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Telefone</label>
              <Input placeholder="(00) 00000-0000" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
            </div>
            <DialogFooter className="pt-2">
              <Button onClick={onAddCustomer} className="w-full font-bold">Concluir Registo</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full bg-card border-border shadow-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="text-primary"/> Editar Perfil</DialogTitle></DialogHeader>
          {editingCustomer && (
            <div className="space-y-4 pt-4">
              <div className="space-y-1 opacity-60">
                <label className="text-[10px] font-bold uppercase">Nome (Inalterável)</label>
                <Input value={editingCustomer.name} disabled />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Novo E-mail</label>
                <Input value={editingCustomer.email} onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Novo Telefone</label>
                <Input value={editingCustomer.phone || ""} onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})} />
              </div>
              <DialogFooter className="pt-2">
                <Button onClick={onSaveEdit} className="w-full font-bold">Salvar Alterações</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}