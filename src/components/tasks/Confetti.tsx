import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Piece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  duration: number;
}

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const colors = ["#D4AF37", "#002B5B", "#F5F5F7", "#C5A028", "#001F44"];

  useEffect(() => {
    if (active) {
      const newPieces = Array.from({ length: 50 }).map((_, i) => ({
        id: Math.random() + i,
        x: Math.random() * 100,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        duration: Math.random() * 2 + 1,
      }));
      setPieces(newPieces);
      const timer = setTimeout(() => setPieces([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: "-10vh", x: `${p.x}vw`, rotate: 0, opacity: 1 }}
            animate={{ 
              y: "110vh", 
              x: `${p.x + (Math.random() * 20 - 10)}vw`,
              rotate: p.rotation + 720,
              opacity: 0
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.duration, ease: "easeIn" }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
