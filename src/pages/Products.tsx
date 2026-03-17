import { motion } from "framer-motion";
import { Package, TrendingUp } from "lucide-react";

const products = [
  { id: "1", name: "Plano Essencial", type: "Recorrente", price: 4800, cost: 2200, clients: 8 },
  { id: "2", name: "Plano Pro", type: "Recorrente", price: 7600, cost: 3800, clients: 12 },
  { id: "3", name: "Plano Premium", type: "Recorrente", price: 12500, cost: 5500, clients: 6 },
  { id: "4", name: "Landing Page", type: "Projeto", price: 8000, cost: 3500, clients: 3 },
  { id: "5", name: "Identidade Visual", type: "Projeto", price: 15000, cost: 6000, clients: 2 },
  { id: "6", name: "Consultoria Avulsa", type: "Avulso", price: 2500, cost: 800, clients: 5 },
];

export default function Products() {
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Produtos e Serviços</h1>
        <p className="text-sm text-white/50 mt-1">{products.length} cadastrados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map((product) => {
          const margin = Math.round(((product.price - product.cost) / product.price) * 100);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-xl p-5 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs text-white/30 px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.04]">
                  {product.type}
                </span>
              </div>
              <h3 className="font-semibold mb-3">{product.name}</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="font-mono text-sm font-bold">R$ {(product.price / 1000).toFixed(1)}k</div>
                  <div className="text-[10px] text-white/30 mt-0.5">Preço</div>
                </div>
                <div>
                  <div className="font-mono text-sm font-bold">R$ {(product.cost / 1000).toFixed(1)}k</div>
                  <div className="text-[10px] text-white/30 mt-0.5">Custo</div>
                </div>
                <div>
                  <div className="font-mono text-sm font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {margin}%
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5">Margem</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs text-white/40">
                {product.clients} cliente{product.clients !== 1 ? "s" : ""} ativo{product.clients !== 1 ? "s" : ""}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
