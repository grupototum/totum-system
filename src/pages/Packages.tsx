import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Box, Plus, Loader2, Pencil, MoreHorizontal, Trash2, TrendingUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { usePackages, PackageRow } from "@/hooks/usePackages";
import { useProducts } from "@/hooks/useProducts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "R$ 0,00";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
};

export default function Packages() {
  const { packages, loading, addPackage, updatePackage, deletePackage } = usePackages();
  const { products } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PackageRow | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [loyaltyMonths, setLoyaltyMonths] = useState("12");
  const [selectedItems, setSelectedItems] = useState<{product_id: string, quantity: number, unit_price: number, discount: number}[]>([]);
  const [totalSale, setTotalSale] = useState(0);

  const openNew = () => {
    setEditing(null);
    setName(""); setDescription(""); setLoyaltyEnabled(true); setLoyaltyMonths("12"); setSelectedItems([]); setTotalSale(0);
    setDialogOpen(true);
  };

  const openEdit = (p: PackageRow) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description || "");
    setLoyaltyEnabled(!!p.loyalty_enabled);
    setLoyaltyMonths(p.loyalty_months?.toString() || "12");
    setSelectedItems((p as any).items?.map((it: any) => ({
      product_id: it.product_id,
      quantity: it.quantity,
      unit_price: it.unit_price,
      discount: it.discount || 0
    })) || []);
    setTotalSale(Number(p.total_sale) || 0);
    setDialogOpen(true);
  };

  // Calculations
  const metrics = useMemo(() => {
    let cost = 0;
    let sale = 0;
    selectedItems.forEach(item => {
      const prod = products.find(pr => pr.id === item.product_id);
      cost += (Number(prod?.cost) || 0) * item.quantity;
      sale += item.unit_price * item.quantity;
    });

    const profit = totalSale - cost;
    const margin = totalSale > 0 ? (profit / totalSale) * 100 : 0;
    const loyaltyProfit = profit * (parseFloat(loyaltyMonths) || 12);

    return { totalCost: cost, totalBaseSale: sale, profit, margin, loyaltyProfit };
  }, [selectedItems, products, totalSale, loyaltyMonths]);

  const handleToggleProduct = (productId: string, checked: boolean) => {
    if (checked) {
      const prod = products.find(p => p.id === productId);
      const newItems = [...selectedItems, { 
        product_id: productId, 
        quantity: 1, 
        unit_price: Number((prod as any)?.price_package) || Number(prod?.price) || 0,
        discount: 0
      }];
      setSelectedItems(newItems);
      // Auto-update total sale
      setTotalSale(newItems.reduce((acc, curr) => acc + (curr.unit_price * curr.quantity), 0));
    } else {
      const newItems = selectedItems.filter(i => i.product_id !== productId);
      setSelectedItems(newItems);
      setTotalSale(newItems.reduce((acc, curr) => acc + (curr.unit_price * curr.quantity), 0));
    }
  };

  const handleUpdateItem = (productId: string, field: string, val: any) => {
    const newItems = selectedItems.map(item => {
      if (item.product_id === productId) {
        return { ...item, [field]: val };
      }
      return item;
    });
    setSelectedItems(newItems);
    if (field === 'unit_price' || field === 'quantity') {
      setTotalSale(newItems.reduce((acc, curr) => acc + (curr.unit_price * curr.quantity), 0));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const values = {
      name,
      description: description || null,
      loyalty_enabled: loyaltyEnabled,
      loyalty_months: parseInt(loyaltyMonths) || 12,
      total_cost: metrics.totalCost,
      total_sale: totalSale,
    };
    const items = selectedItems.map(it => ({
      product_id: it.product_id,
      quantity: it.quantity,
      unit_price: it.unit_price,
      discount: it.discount
    }));

    if (editing) {
      const ok = await updatePackage(editing.id, values, items);
      if (ok) setDialogOpen(false);
    } else {
      const ok = await addPackage(values, items);
      if (ok) setDialogOpen(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Módulo de Pacotes</h1>
          <p className="text-sm text-muted-foreground mt-1">Precificação inteligente e gestão de lucratividade</p>
        </div>
        <Button onClick={openNew} className="gradient-primary border-0 text-white font-semibold gap-2 rounded-full px-5">
          <Plus className="h-4 w-4" /> Novo Pacote
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground/30">
          <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground/50 border-2 border-dashed rounded-2xl">
          <Box className="h-12 w-12 mx-auto mb-4 opacity-10" />
          Nenhum pacote estratégico cadastrado
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Box className="h-16 w-16" />
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Box className="h-5 w-5" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(pkg)}><Pencil className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deletePackage(pkg.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="text-lg font-bold mb-1">{pkg.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{pkg.description || "Sem descrição"}</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor de Venda (Mensal):</span>
                  <span className="font-bold text-primary">{formatCurrency(pkg.total_sale)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lucro p/ Contrato:</span>
                  <span className="text-emerald-500 font-semibold">{formatCurrency(Number(pkg.total_sale) - Number(pkg.total_cost))}</span>
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold">
                  <span className="text-muted-foreground">Fidelidade:</span>
                  <span className={pkg.loyalty_enabled ? "text-primary" : "text-muted-foreground opacity-50"}>
                    {pkg.loyalty_enabled ? `${pkg.loyalty_months} Meses` : "Não"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  Margem: {Math.round(((Number(pkg.total_sale) - Number(pkg.total_cost)) / (Number(pkg.total_sale) || 1)) * 100)}%
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {(pkg as any).items?.length || 0} Itens
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Package Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-heading">{editing ? "Editar Pacote Estratégico" : "Criar Novo Pacote Estratégico"}</DialogTitle>
            <DialogDescription>Personalize e valide a lucratividade deste pacote de serviços.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Pacote</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pacote Business Gold" />
              </div>
              <div className="flex gap-4 items-end pb-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border flex-1">
                  <Switch checked={loyaltyEnabled} onCheckedChange={setLoyaltyEnabled} />
                  <Label className="text-xs cursor-pointer">Fidelidade Obrigatória</Label>
                </div>
                {loyaltyEnabled && (
                  <div className="w-24 space-y-2">
                    <Label className="text-[10px]">Meses</Label>
                    <Input type="number" value={loyaltyMonths} onChange={(e) => setLoyaltyMonths(e.target.value)} className="h-9 px-2 text-center" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição / Argumento de Venda</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Destaque os benefícios deste pacote..." className="resize-none" rows={2} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-primary font-bold">Composição do Pacote</Label>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" /> Selecione os produtos que compõem este pacote.
                </div>
              </div>
              
              <div className="border rounded-xl overflow-hidden bg-accent/20">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Produto/Serviço</TableHead>
                      <TableHead className="w-20 text-center">Qtd.</TableHead>
                      <TableHead className="w-32 text-right">Preço Un.</TableHead>
                      <TableHead className="w-32 text-right font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.filter(p => p.is_active).map((p) => {
                      const isSelected = selectedItems.find(it => it.product_id === p.id);
                      return (
                        <TableRow key={p.id} className={isSelected ? "bg-primary/5" : ""}>
                          <TableCell>
                            <Checkbox 
                              checked={!!isSelected} 
                              onCheckedChange={(checked) => handleToggleProduct(p.id, checked === true)} 
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-xs">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground">Custo: {formatCurrency(p.cost)}</div>
                          </TableCell>
                          <TableCell>
                            {isSelected && (
                              <Input 
                                type="number" 
                                value={isSelected.quantity} 
                                onChange={(e) => handleUpdateItem(p.id, 'quantity', parseInt(e.target.value) || 1)}
                                className="h-7 w-12 mx-auto px-1 text-center text-xs"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isSelected && (
                               <div className="flex items-center justify-end">
                                 <span className="text-[10px] mr-1 text-muted-foreground">R$</span>
                                 <input 
                                   type="number" 
                                   value={isSelected.unit_price} 
                                   onChange={(e) => handleUpdateItem(p.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                   className="bg-transparent text-right w-20 border-b border-border/50 outline-none h-6 text-xs hover:border-primary focus:border-primary"
                                 />
                               </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs">
                            {isSelected ? formatCurrency(isSelected.quantity * isSelected.unit_price) : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Intelligence Footer */}
          <div className="p-6 bg-accent/50 border-t border-border mt-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 items-center">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Custo Total (Indireto)</span>
                <div className="text-lg font-bold">{formatCurrency(metrics.totalCost)}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Valor de Venda Sugerido</span>
                <div className="text-lg font-bold text-emerald-500">{formatCurrency(metrics.totalCost * 1.3)} (+30%)</div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold">Valor de Venda Final</Label>
                <div className="relative">
                   <Input 
                    type="number" 
                    value={totalSale} 
                    onChange={(e) => setTotalSale(parseFloat(e.target.value) || 0)}
                    className="h-10 text-lg font-bold text-primary border-primary/20 bg-primary/5 focus:bg-primary/10 transition-colors" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary opacity-50">/mês</span>
                </div>
              </div>
              <div className="rounded-xl bg-primary shadow-lg p-4 text-white space-y-1">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold opacity-80">
                  <span>Margem Real Bruta</span>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-2xl font-black">{Math.round(metrics.margin)}%</div>
                <div className="text-[10px] font-medium opacity-90 truncate">
                   LTV Projetado: {formatCurrency(totalSale * (parseInt(loyaltyMonths) || 1))}
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-8 border-t border-border/20 pt-4 px-0">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-full">Cancelar</Button>
              <Button 
                onClick={handleSave} 
                disabled={!name.trim() || selectedItems.length === 0} 
                className="gradient-primary border-0 text-white font-bold rounded-full px-10 shadow-lg hover:shadow-primary/20 transition-all"
              >
                {editing ? "Salvar Alterações" : "Criar Pacote Estratégico"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
