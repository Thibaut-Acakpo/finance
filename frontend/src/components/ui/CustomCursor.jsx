import { useEffect, useRef, useState } from 'react';

// Curseur en anneau qui suit la souris avec un léger retard, et se resserre
// sur les éléments cliquables. Désactivé automatiquement sur tactile.
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [pointerType, setPointerType] = useState('default');

  useEffect(() => {
    const isFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    setEnabled(isFine);
    if (!isFine) return;
    document.body.classList.add('has-cursor');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      const target = e.target;
      const clickable = target.closest?.(
        'a, button, [role="button"], input, select, textarea, [data-tilt]'
      );
      setPointerType(clickable ? 'pointer' : 'default');
    };

    let raf;
    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }
      raf = requestAnimationFrame(animateRing);
    };
    raf = requestAnimationFrame(animateRing);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      document.body.classList.remove('has-cursor');
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[300] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint-400"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[300] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-[width,height,border-color] duration-200 ease-out"
        style={{
          width: pointerType === 'pointer' ? 44 : 28,
          height: pointerType === 'pointer' ? 44 : 28,
          borderColor: pointerType === 'pointer' ? 'rgba(63,224,165,0.8)' : 'rgba(238,241,246,0.35)',
          willChange: 'transform',
        }}
      />
    </>
  );
}
