import { useEffect, useRef } from 'react';

/*
 * NeuralBrainBackground
 * ---------------------
 * Full-viewport, GPU-accelerated canvas rendering a neural network that
 * spans the ENTIRE screen. A denser cluster of nodes forms a brain
 * silhouette near the centre, while scattered nodes and connections
 * extend to every edge and corner.
 *
 * pointer-events: none — never interferes with UI.
 */

// ── Palette (from the app's existing dark-theme) ────────────────────────
const PALETTE = {
  purple: [108, 71, 255] as const,
  teal: [0, 212, 170] as const,
  cyan: [0, 180, 255] as const,
  blue: [60, 120, 255] as const,
  white: [240, 240, 240] as const,
};

// ── Types ───────────────────────────────────────────────────────────────
interface Vec2 { x: number; y: number }
interface NeuralNode {
  /** pixel-space position (updated every frame) */
  px: number; py: number;
  /** base normalised position (0-1 of viewport) */
  baseX: number; baseY: number;
  r: number;
  phase: number;
  speed: number;
  color: readonly [number, number, number];
  brightness: number;
  activateAt: number;
  firing: boolean;
}

interface Particle {
  fromIdx: number;
  toIdx: number;
  t: number;
  speed: number;
  color: readonly [number, number, number];
  size: number;
}

// ── Brain silhouette test (normalised coords, centre = 0,0) ────────────
function insideBrain(nx: number, ny: number): boolean {
  const a = 0.44, b = 0.38;
  const ey = ny + 0.04;
  const e = (nx * nx) / (a * a) + (ey * ey) / (b * b);
  if (e > 1) return false;
  const cx = nx + 0.02, cy = ny - 0.22;
  if ((cx * cx) / (0.18 * 0.18) + (cy * cy) / (0.12 * 0.12) < 1) return true;
  if (Math.abs(nx) < 0.06 && ny > 0.28 && ny < 0.42) return true;
  return e < 1;
}

// ── Component ───────────────────────────────────────────────────────────
export default function NeuralBrainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<Vec2>({ x: 0.5, y: 0.5 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W = 0, H = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / W, y: e.clientY / H };
    };
    window.addEventListener('mousemove', onMouse);

    // ── Colour helpers ───────────────────────────────────────────────
    const colors = [PALETTE.purple, PALETTE.teal, PALETTE.cyan, PALETTE.blue, PALETTE.white];
    const rgba = (c: readonly [number, number, number], a: number) =>
      `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const pick = () => colors[Math.floor(Math.random() * colors.length)];

    // ── Generate nodes across the FULL viewport ──────────────────────
    // ~40% concentrated inside the brain shape (centre), ~60% scattered everywhere
    const TOTAL_NODES = Math.min(350, Math.max(180, Math.round(W * H / 4000)));
    const BRAIN_NODES = Math.round(TOTAL_NODES * 0.4);
    const SCATTER_NODES = TOTAL_NODES - BRAIN_NODES;
    const nodes: NeuralNode[] = [];

    const makeNode = (bx: number, by: number): NeuralNode => ({
      px: 0, py: 0,
      baseX: bx, baseY: by,
      r: 1 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.5,
      color: pick(),
      brightness: 0.1 + Math.random() * 0.2,
      activateAt: Date.now() + Math.random() * 8000,
      firing: false,
    });

    // Brain-shaped cluster (centre of screen, slight offset)
    for (let i = 0; i < BRAIN_NODES; i++) {
      let nx: number, ny: number;
      do { nx = Math.random() - 0.5; ny = Math.random() - 0.5; } while (!insideBrain(nx, ny));
      // Map brain coords (-0.5..0.5) → viewport coords centred at (0.52, 0.42)
      nodes.push(makeNode(0.52 + nx * 0.55, 0.42 + ny * 0.55));
    }

    // Scattered across entire viewport (with padding)
    for (let i = 0; i < SCATTER_NODES; i++) {
      const bx = 0.03 + Math.random() * 0.94; // 3%–97% of viewport
      const by = 0.03 + Math.random() * 0.94;
      nodes.push(makeNode(bx, by));
    }

    // ── Connections (proximity-based, in normalised space) ────────────
    const MAX_DIST = 0.1; // ~10% of viewport diagonal
    const edges: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      let edgesForI = 0;
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].baseX - nodes[j].baseX;
        const dy = nodes[i].baseY - nodes[j].baseY;
        if (dx * dx + dy * dy < MAX_DIST * MAX_DIST) {
          edges.push([i, j]);
          edgesForI++;
          if (edgesForI > 6) break; // cap per-node connections for perf
        }
      }
    }

    // ── Particles ────────────────────────────────────────────────────
    const MAX_PARTICLES = 80;
    const particles: Particle[] = [];
    const spawnParticle = () => {
      if (edges.length === 0) return;
      const [a, b] = edges[Math.floor(Math.random() * edges.length)];
      particles.push({
        fromIdx: Math.random() > 0.5 ? a : b,
        toIdx: Math.random() > 0.5 ? b : a,
        t: 0,
        speed: 0.12 + Math.random() * 0.3,
        color: pick(),
        size: 1 + Math.random() * 1.5,
      });
    };

    // ── Coordinate conversion ────────────────────────────────────────
    const toScreen = (bx: number, by: number): Vec2 => {
      const px = (mouseRef.current.x - 0.5) * 14;
      const py = (mouseRef.current.y - 0.5) * 14;
      return { x: bx * W + px, y: by * H + py };
    };

    // ── Render loop ──────────────────────────────────────────────────
    let lastSpawn = Date.now();
    const GLOBAL_OPACITY = 0.24;
    const HOVER_RADIUS = 160;     // px – glow influence radius around cursor
    const HOVER_RADIUS_SQ = HOVER_RADIUS * HOVER_RADIUS;

    const frame = () => {
      animRef.current = requestAnimationFrame(frame);
      const now = Date.now();
      const t = now / 1000;

      // Mouse position in screen-space pixels
      const mx = mouseRef.current.x * W;
      const my = mouseRef.current.y * H;

      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = GLOBAL_OPACITY;

      // ── Update nodes ──────────────────────────────────────────────
      for (const node of nodes) {
        const drift = Math.sin(t * node.speed + node.phase) * 0.003;
        const nx = node.baseX + drift;
        const ny = node.baseY + Math.cos(t * node.speed * 0.7 + node.phase) * 0.002;
        const sp = toScreen(nx, ny);
        node.px = sp.x;
        node.py = sp.y;

        if (now > node.activateAt) {
          node.firing = true;
          node.activateAt = now + 3000 + Math.random() * 10000;
        }
        if (node.firing) {
          node.brightness = Math.min(node.brightness + 0.03, 1);
          if (node.brightness >= 0.95) node.firing = false;
        } else {
          node.brightness = Math.max(
            node.brightness - 0.006,
            0.18 + Math.sin(t * 0.5 + node.phase) * 0.1
          );
        }

        // ── Mouse proximity boost ──────────────────────────────────
        const dx = node.px - mx;
        const dy = node.py - my;
        const distSq = dx * dx + dy * dy;
        if (distSq < HOVER_RADIUS_SQ) {
          const proximity = 1 - Math.sqrt(distSq) / HOVER_RADIUS; // 1 at cursor, 0 at edge
          node.brightness = Math.min(node.brightness + proximity * 0.7, 1);
        }
      }

      // ── Draw edges ────────────────────────────────────────────────
      for (const [i, j] of edges) {
        const a = nodes[i], b = nodes[j];
        const bright = Math.max(a.brightness, b.brightness) * 0.5;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.strokeStyle = rgba(a.color, bright);
        ctx.lineWidth = 0.6 + Math.max(a.brightness, b.brightness) * 0.5;
        ctx.stroke();
      }

      // ── Draw nodes ────────────────────────────────────────────────
      for (const node of nodes) {
        const glow = node.brightness;

        // outer glow halo (larger + brighter when active)
        if (glow > 0.2) {
          const glowRadius = node.r * (8 + glow * 6);
          const g = ctx.createRadialGradient(node.px, node.py, 0, node.px, node.py, glowRadius);
          g.addColorStop(0, rgba(node.color, glow * 0.55));
          g.addColorStop(0.5, rgba(node.color, glow * 0.15));
          g.addColorStop(1, rgba(node.color, 0));
          ctx.beginPath();
          ctx.arc(node.px, node.py, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }

        // core dot
        ctx.beginPath();
        ctx.arc(node.px, node.py, node.r * (0.7 + glow * 0.6), 0, Math.PI * 2);
        ctx.fillStyle = rgba(node.color, 0.5 + glow * 0.5);
        ctx.fill();
      }

      // ── Mouse cursor glow ───────────────────────────────────────
      const cursorGrad = ctx.createRadialGradient(mx, my, 0, mx, my, HOVER_RADIUS);
      cursorGrad.addColorStop(0, rgba(PALETTE.purple, 0.12));
      cursorGrad.addColorStop(0.4, rgba(PALETTE.cyan, 0.05));
      cursorGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(mx, my, HOVER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = cursorGrad;
      ctx.fill();

      // ── Particles ─────────────────────────────────────────────────
      if (now - lastSpawn > 100 && particles.length < MAX_PARTICLES) {
        spawnParticle();
        lastSpawn = now;
      }

      for (let pi = particles.length - 1; pi >= 0; pi--) {
        const p = particles[pi];
        p.t += p.speed * 0.012;
        if (p.t >= 1) { particles.splice(pi, 1); continue; }

        const fromN = nodes[p.fromIdx], toN = nodes[p.toIdx];
        const sx = fromN.px + (toN.px - fromN.px) * p.t;
        const sy = fromN.py + (toN.py - fromN.py) * p.t;
        const alpha = Math.sin(p.t * Math.PI) * 0.85;

        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size * 4);
        g.addColorStop(0, rgba(p.color, alpha));
        g.addColorStop(1, rgba(p.color, 0));
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fillStyle = rgba(p.color, alpha);
        ctx.fill();
      }

      // ── Breathing pulse ───────────────────────────────────────────
      ctx.globalAlpha = GLOBAL_OPACITY + Math.sin(t * 0.4) * 0.02;

      // ── Ambient glow (large, covers most of the viewport) ─────────
      const gcx = W * 0.52 + (mouseRef.current.x - 0.5) * 14;
      const gcy = H * 0.42 + (mouseRef.current.y - 0.5) * 14;
      const gs = Math.max(W, H) * 0.45;
      const coreGrad = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, gs);
      coreGrad.addColorStop(0, rgba(PALETTE.purple, 0.05 + Math.sin(t * 0.3) * 0.015));
      coreGrad.addColorStop(0.4, rgba(PALETTE.cyan, 0.02));
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(gcx, gcy, gs, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.globalAlpha = 0.3;
      ctx.fill();

      ctx.globalAlpha = 1;
    };

    animRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    />
  );
}
