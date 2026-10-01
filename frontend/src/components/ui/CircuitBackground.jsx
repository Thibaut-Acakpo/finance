import { useEffect, useRef } from 'react';

/**
 * Fond animé : un maillage de "nœuds" reliés par des lignes, avec des impulsions
 * lumineuses qui voyagent le long des lignes — une métaphore de flux financiers
 * (revenus/dépenses qui circulent) plutôt qu'une décoration générique.
 */
export default function CircuitBackground({ tone = 'mint' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width, height, nodes, edges, pulses, raf;
    const accent = tone === 'coral' ? [242, 86, 74] : [63, 224, 165];

    function setup() {
      width = canvas.width = canvas.offsetWidth * devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * devicePixelRatio;
      const cols = Math.max(5, Math.floor(canvas.offsetWidth / 140));
      const rows = Math.max(4, Math.floor(canvas.offsetHeight / 140));
      nodes = [];
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const jitter = 40 * devicePixelRatio;
          nodes.push({
            x: (i / cols) * width + (Math.random() - 0.5) * jitter,
            y: (j / rows) * height + (Math.random() - 0.5) * jitter,
          });
        }
      }
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 190 * devicePixelRatio) edges.push({ a: i, b: j, dist });
        }
      }
      pulses = Array.from({ length: 14 }, () => spawnPulse());
    }

    function spawnPulse() {
      const edge = edges[Math.floor(Math.random() * edges.length)];
      return { edge, t: Math.random(), speed: 0.0025 + Math.random() * 0.004 };
    }

    function frame() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1 * devicePixelRatio;
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        const alpha = Math.max(0, 0.09 - e.dist / (190 * devicePixelRatio) * 0.09);
        ctx.strokeStyle = `rgba(238,241,246,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const n of nodes) {
        ctx.fillStyle = 'rgba(238,241,246,0.12)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.4 * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of pulses) {
        if (!p.edge) continue;
        const a = nodes[p.edge.a];
        const b = nodes[p.edge.b];
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 10 * devicePixelRatio);
        grad.addColorStop(0, `rgba(${accent[0]},${accent[1]},${accent[2]},0.9)`);
        grad.addColorStop(1, `rgba(${accent[0]},${accent[1]},${accent[2]},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 10 * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
        p.t += p.speed;
        if (p.t >= 1) Object.assign(p, spawnPulse());
      }
      raf = requestAnimationFrame(frame);
    }

    setup();
    frame();
    if (reduceMotion) cancelAnimationFrame(raf);

    const onResize = () => setup();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [tone]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
