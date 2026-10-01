import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function TiltCard({ children, className = '', glow = true, ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [9, -9]), { stiffness: 220, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-9, 9]), { stiffness: 220, damping: 20 });
  const glowX = useTransform(x, [-0.5, 0.5], ['10%', '90%']);
  const glowY = useTransform(y, [-0.5, 0.5], ['10%', '90%']);

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      data-tilt
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-850/80 ${className}`}
      {...props}
    >
      {glow && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([gx, gy]) => `radial-gradient(280px circle at ${gx} ${gy}, rgba(63,224,165,0.10), transparent 70%)`
            ),
          }}
        />
      )}
      <div style={{ transform: 'translateZ(20px)' }} className="relative">
        {children}
      </div>
    </motion.div>
  );
}
