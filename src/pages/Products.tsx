import { useState } from "react";
import { motion } from "framer-motion";
import { Package, TrendingUp, Plus, Loader2, Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProducts, useProductTypes, ProductRow } from "@/hooks/useProducts";

const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "";
  let strValue = typeof value === 'number' ? value.toFixed(2) : String(value);
  const numericValue = strValue.replace(/\D/g, "");
  if (!numericValue) return "";
  const floatValue = parseInt(numericValue, 10) / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(floatValue);
};

const parseCurrency = (value: string) => {
  if (!value) return null;
  const numericValue = value.replace(/\D/g, "");
  return numericValue ? parseInt(numericValue, 10) / 100 : null;
};

export default function Products() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const productTypes = useProductTypes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [typeId, setTypeId] = useState("");

  const openNew = () => {
    setEditing(null);
    setName(""); setDescription(""); setPrice(""); setCost(""); setTypeId("");
    setDialogOpen(true);
  };

  const openEdit = (p: ProductRow) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description || "");
    setPrice(formatCurrency(p.price));
    setCost(formatCurrency(p.cost));
    setTypeId(p.product_type_id || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const values = {
      name,
      description: description || null,
      price: parseCurrency(price),
      cost: parseCurrency(cost),
      product_type_id: typeId || null,
    };
    if (editing) {
      const ok = await updateProduct(editing.id, values);
      if (ok) setDialogOpen(false);
    } else {
      const ok = await addProduct(values);
      if (ok) setDialogOpen(false);
    }
  };

  const activeProducts = products.filter(p => p.is_active);
  const inputCls = "bg-white/[0.05] border-white/[0.1] rounded-lg h-9 text-xs focus:border-primary/50";

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Produtos e Serviços</h1>
          <p className="text-sm text-white/50 mt-1">{activeProducts.length} ativos · {products.length} total</p>
        </div>
        <Button onClick={openNew} className="gradient-primary border-0 text-white font-semibold gap-2 rounded-full px-5">
          <Plus className="h-4 w-4" /> Novo Produto
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : activeProducts.length === 0 ? (
        <div className="text-center py-20 text-white/30">Nenhum produto cadastrado</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeProducts.map((product) => {
            const priceVal = Number(product.price) || 0;
            const costVal = Number(product.cost) || 0;
            const margin = priceVal > 0 ? Math.round(((priceVal - costVal) / priceVal) * 100) : 0;
            const typeName = (product.product_types as any)?.name || "—";

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-xl p-5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30 px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.04]">
                      {typeName}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md hover:bg-white/[0.06] text-white/30 hover:text-white/60">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#271c1d] border-white/[0.1] text-white" align="end">
                        <DropdownMenuItem onClick={() => openEdit(product)} className="text-xs focus:bg-white/[0.06]">
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteProduct(product.id)} className="text-xs text-red-400 focus:bg-white/[0.06] focus:text-red-400">
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Desativar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{product.name}</h3>
                {product.description && <p className="text-xs text-white/40 mb-3">{product.description}</p>}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="font-mono text-sm font-bold">
                      {priceVal > 0 ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(priceVal) : "—"}
                    </div>
                    <div className="text-[10px] text-white/30 mt-0.5">Preço</div>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold">
                      {costVal > 0 ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(costVal) : "—"}
                    </div>
                    <div className="text-[10px] text-white/30 mt-0.5">Custo</div>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-emerald-400 flex items-center justify-center gap-1">
                      {priceVal > 0 ? <><TrendingUp className="h-3 w-3" /> {margin}%</> : "—"}
                    </div>
                    <div className="text-[10px] text-white/30 mt-0.5">Margem</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1e1516] border-white/[0.1] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Nome *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Nome do produto/serviço" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Descrição</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Descrição breve" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Tipo</label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Selecionar tipo" /></SelectTrigger>
                <SelectContent className="bg-[#271c1d] border-white/[0.1] text-white">
                  {productTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Preço</label>
                <Input type="text" value={price} onChange={(e) => setPrice(formatCurrency(e.target.value))} className={inputCls} placeholder="R$ 0,00" />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Custo</label>
                <Input type="text" value={cost} onChange={(e) => setCost(formatCurrency(e.target.value))} className={inputCls} placeholder="R$ 0,00" />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-white/50 hover:text-white hover:bg-white/[0.06]">Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim()} className="gradient-primary border-0 text-white font-semibold rounded-full px-6">
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
