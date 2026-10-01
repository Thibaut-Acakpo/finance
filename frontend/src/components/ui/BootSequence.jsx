import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LINES = [
  'INITIALISATION DU COFFRE FINANCIER…',
  'CHARGEMENT DES FLUX REVENUS / DÉPENSES…',
  'VÉRIFICATION DE LA SESSION…',
  'ACCÈS AUTORISÉ',
];

export default function BootSequence({ onDone }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone();
      return;
    }
    const timers = LINES.map((_, i) =>
      setTimeout(() => setLineIndex(i + 1), 420 + i * 420)
    );
    const finish = setTimeout(() => setDone(true), 420 + LINES.length * 420 + 500);
    const close = setTimeout(onDone, 420 + LINES.length * 420 + 1050);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
      clearTimeout(close);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {!done ? (
        <motion.div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-ink-950"
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
        >
          <div className="w-[min(520px,88vw)] font-mono text-[13px] leading-7 text-mint-400/90">
            {LINES.slice(0, lineIndex).map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-mint-500/60">$</span>
                <span className={i === LINES.length - 1 ? 'text-gold-400' : ''}>{line}</span>
              </div>
            ))}
            <motion.div
              className="mt-3 h-px w-full origin-left bg-mint-500/40"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: lineIndex / LINES.length }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
