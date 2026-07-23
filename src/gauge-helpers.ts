import { MAX, MIN, CENTERX, CENTERY, RADIUS, STARTANGLE, TOTALANGLE } from './gauge-const';

export const calculatePoint = (value: number, min: number = MIN, max: number = MAX, radius: number = RADIUS) => {
  // Clamp temp so markers don't fly off the track
  const safeValue = Math.max(min, Math.min(max, value));
  const factor = (safeValue - min) / (max - min);

  const angleDeg = STARTANGLE + factor * TOTALANGLE;
  const angleRad = (angleDeg * Math.PI) / 180;

  return {
    x: CENTERX + radius * Math.cos(angleRad),
    y: CENTERY + radius * Math.sin(angleRad),
  };
};

/**
 * Calculates the physical stroke length of the 270-degree arc dynamically based on its radius.
 */
export function getGaugeLength(radius: number): number {
  // Circumference of 3/4 (270 degrees) of a circle: 2 * PI * r * 0.75
  return 2 * Math.PI * radius * 0.75;
}

/**
 * Calculates the exact SVG path string for a 270-degree gauge arc centered at (CENTERX, CENTERY).
 */
export function renderPath(radius: number): string {
  const angleRad = (45 * Math.PI) / 180;
  const startX = (CENTERX - radius * Math.cos(angleRad)).toFixed(3);
  const startY = (CENTERY + radius * Math.sin(angleRad)).toFixed(3);
  const endX = (CENTERX + radius * Math.cos(angleRad)).toFixed(3);
  const endY = (CENTERY + radius * Math.sin(angleRad)).toFixed(3);
  const gaugePath = `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`;
  //const gaugePath = `M 21.716 78.284 A 40 40 0 1 1 78.284 78.284`;

  return gaugePath;
}