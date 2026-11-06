/**
 * Pure math functions for Pink Rider hover reveal:
 * - Cover-fit layout
 * - Stamp scale curves
 * - Interpolation step count and points
 * - Auto-wander coordinates
 */

export function computeCoverDimensions(
  cw: number,
  ch: number,
  iw: number,
  ih: number
): { sx: number; sy: number; sw: number; sh: number } {
  if (iw <= 0 || ih <= 0 || cw <= 0 || ch <= 0) {
    return { sx: 0, sy: 0, sw: 0, sh: 0 };
  }
  const scale = Math.max(cw / iw, ch / ih);
  const sw = iw * scale;
  const sh = ih * scale;
  const sx = (cw - sw) / 2;
  const sy = ch - sh; // anchored to bottom
  return { sx, sy, sw, sh };
}

export function computeStampScale(age: number, life: number): number {
  const k = Math.max(0, 1 - age / life);
  return k < 0.75 ? k / 0.75 : 1;
}

export function computeInterpolation(
  last: { x: number; y: number },
  curr: { x: number; y: number },
  step: number,
  maxPoints: number = 40
): Array<{ x: number; y: number }> {
  const dx = curr.x - last.x;
  const dy = curr.y - last.y;
  const dist = Math.hypot(dx, dy);
  if (step <= 0 || dist < step) {
    return [];
  }
  const count = Math.min(Math.floor(dist / step), maxPoints);
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    points.push({
      x: last.x + dx * t,
      y: last.y + dy * t,
    });
  }
  return points;
}

export function computeAutoWanderPosition(
  W: number,
  H: number,
  autoT: number
): { x: number; y: number } {
  const x = W * (0.5 + Math.sin(autoT * 1.3) * 0.28);
  const y = H * (0.32 + Math.sin(autoT * 0.9 + 1) * 0.22);
  return { x, y };
}
