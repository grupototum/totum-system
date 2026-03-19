import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  pulse?: boolean;
}

export function MetricCard({ title, value, change, changeType = "neutral", icon: Icon, pulse }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`glass-card-strong rounded-2xl p-6 border-white/10 hover:border-white/20 transition-all group ${pulse ? "animate-pulse-red" : ""}`}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {change && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            changeType === "positive" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
            changeType === "negative" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-white/5 text-white/50 border border-white/10"
          }`}>
            {changeType === "positive" ? <TrendingUp className="h-3 w-3" /> :
             changeType === "negative" ? <TrendingDown className="h-3 w-3" /> : null}
            {change}
          </div>
        )}
      </div>
      <div className="font-heading text-3xl font-bold tracking-tight text-white mb-1.5">{value}</div>
      <div className="font-heading text-xs font-bold text-white/30 uppercase tracking-[0.1em]">{title}</div>
    </motion.div>
  );
}
