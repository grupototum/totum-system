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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`glass-card rounded-xl p-6 ${pulse ? "animate-pulse-red" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            changeType === "positive" ? "text-emerald-600 dark:text-emerald-400" :
            changeType === "negative" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
          }`}>
            {changeType === "positive" ? <TrendingUp className="h-3 w-3" /> :
             changeType === "negative" ? <TrendingDown className="h-3 w-3" /> : null}
            {change}
          </div>
        )}
      </div>
      <div className="metric-value text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{title}</div>
    </motion.div>
  );
}
