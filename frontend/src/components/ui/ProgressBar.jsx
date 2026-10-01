import { motion } from 'framer-motion';

export default function ProgressBar({ percent = 0, statut = 'normal' }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const color =
    statut === 'exceeded' ? 'bg-coral-500' : statut === 'warning' ? 'bg-gold-400' : 'bg-mint-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
