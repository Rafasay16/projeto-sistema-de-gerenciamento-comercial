import { useState } from "react";
import { useSearchParams } from "react-router"; 
import { useQuery, useMutation, gql } from "@apollo/client";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Save, AlertCircle } from "lucide-react";

// Queries and Mutations
const GET_PRODUCTS = gql`
  query GetProducts {
    products { id name price stock }
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) { id name price stock }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput) {
    updateProduct(id: $id, input: $input) { id name price stock }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const { loading, error, data, refetch } = useQuery(GET_PRODUCTS, { fetchPolicy: 'network-only' });

  const [createProduct] = useMutation(CREATE_PRODUCT);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "" });

  const filteredProducts = (data?.products || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleSaveNew = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await createProduct({
        variables: {
          input: {
            name: newProduct.name,
            price: Number(newProduct.price),
            stock: Math.floor(Number(newProduct.stock))
          }
        }
      });
      toast.success("Produto cadastrado.");
      setIsAddingProduct(false);
      setNewProduct({ name: "", price: "", stock: "" });
      refetch();
    } catch (e) { toast.error("Erro ao cadastrar."); }
  };

  const handleSaveEdit = async () => {
    try {
      await updateProduct({
        variables: {
          id: editingProduct.id,
          input: {
            name: editingProduct.name,
            price: Number(editingProduct.price),
            stock: Math.floor(Number(editingProduct.stock))
          }
        }
      });
      toast.success("Dados atualizados.");
      setEditingProduct(null);
      refetch();
    } catch (e) { toast.error("Erro na atualização."); }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Excluir ${name} permanentemente?`)) {
      try {
        await deleteProduct({ variables: { id } });
        toast.success("Removido.");
        refetch();
      } catch (e) { toast.error("Erro ao remover."); }
    }
  };

  if (loading && !data) return <div className="p-10 text-center animate-pulse text-primary">Sincronizando produtos...</div>;
  if (error) return (
    <div className="p-6 text-center text-destructive bg-destructive/5 rounded-xl border border-destructive/20 mx-auto max-w-lg">
      <AlertCircle className="mx-auto mb-2" />
      <p className="font-bold">Falha de conexão</p>
      <code className="text-xs break-all">{error.message}</code>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground text-sm">Gestão de catálogo e estoque disponível.</p>
        </div>
        <Button onClick={() => setIsAddingProduct(true)} className="w-full sm:w-auto bg-primary font-bold shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Novo Produto
        </Button>
      </div>

      {/* Search Filter */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Localizar produto..." 
              className="pl-10 h-10 w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Table */}
      <Card className="border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest border-b">
              <tr>
                <th className="px-4 py-3 sm:px-6 sm:py-4">Nome</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-center">Qtd.</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Preço</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 sm:px-6 sm:py-4 font-semibold">
                    <div className="truncate max-w-[140px] sm:max-w-xs" title={p.name}>{p.name}</div>
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-center">
                    <span className={`font-bold ${p.stock < 10 ? 'text-orange-500' : 'text-foreground/70'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-right font-bold text-primary">
                    R$ {p.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => setEditingProduct(p)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(p.id, p.name)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-muted-foreground italic">Nenhum item encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals for CRUD operations - Standard Dialog size used for all viewports */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader><DialogTitle>Editar Informações</DialogTitle></DialogHeader>
          {editingProduct && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome</label>
                <Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Preço</label>
                  <Input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Qtd. Estoque</label>
                  <Input type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})} />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button className="w-full bg-primary font-bold" onClick={handleSaveEdit}><Save size={16} className="mr-2" /> Salvar Alterações</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader><DialogTitle>Cadastrar Novo Item</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome do Produto</label>
              <Input placeholder="Ex: Teclado Mecânico" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Preço Unitário</label>
                <Input type="number" placeholder="0.00" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Qtd. Inicial</label>
                <Input type="number" placeholder="0" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button className="w-full bg-primary font-bold" onClick={handleSaveNew}><Plus size={16} className="mr-2" /> Confirmar Cadastro</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}