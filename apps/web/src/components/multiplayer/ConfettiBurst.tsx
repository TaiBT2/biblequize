import { useMemo } from 'react';

interface Props {
  /** Number of pieces to spawn. Mockup spec: 40 for host view, 25 for player. */
  count?: number;
  /** When true, suppress the burst (e.g. user opted out / reduced motion). */
  disabled?: boolean;
}

const COLORS = [
  '#e8a832', // gold
  '#fbbf24', // bright gold
  '#4ade80', // emerald
  '#38bdf8', // sky
  '#f87171', // coral
  '#c084fc', // violet
  '#f3f4f6', // off-white
];

/**
 * Sprint 2 S2-11 — confetti spawn on mount of QuizEndScreen.
 *
 * Implementation: a fixed-inset overlay layer with N absolutely-
 * positioned ribbons, each given random horizontal start, color,
 * size, rotation, fall duration, and animation-delay. The
 * `confettiFall` keyframe (added below) drives the fall + spin.
 *
 * Pure CSS, no JS animation loop, no external lib. Pointer-events
 * disabled so the burst can't intercept clicks on the screen below.
 */
export function ConfettiBurst({ count = 40, disabled = false }: Props) {
  const pieces = useMemo(() => {
    if (disabled) return [];
    return Array.from({ length: count }, () => ({
      left: Math.random() * 100,                       // %
      bg: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 8 + Math.random() * 10,                    // 8–18 px tall
      delay: Math.random() * 1.2,                      // s
      duration: 2.4 + Math.random() * 1.8,             // 2.4–4.2 s
      rotate: Math.random() * 720 - 360,               // initial rotation
      drift: (Math.random() - 0.5) * 60,               // horizontal drift px
    }));
  }, [count, disabled]);

  if (disabled) return null;

  return (
    <div
      data-testid="confetti-burst"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.bg,
            width: p.size * 0.6,
            height: p.size,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--confetti-drift' as string]: `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default ConfettiBurst;
