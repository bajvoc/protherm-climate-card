import { HassEntity } from 'home-assistant-js-websocket';
import { MAX, MIN, CENTERX, CENTERY, RADIUS, STARTANGLE, TOTALANGLE } from './const';
import { formatTimestamp, HomeAssistant, relativeTime } from 'custom-card-helpers';

export const calculatePoint = (temp: number, min: number, max: number) => {
  // Clamp temp so markers don't fly off the track
  const safeTemp = Math.max(min, Math.min(max, temp));
  const factor = (safeTemp - min) / (max - min);

  const angleDeg = STARTANGLE + factor * TOTALANGLE;
  const angleRad = (angleDeg * Math.PI) / 180;

  return {
    x: CENTERX + RADIUS * Math.cos(angleRad),
    y: CENTERY + RADIUS * Math.sin(angleRad),
  };
};

export const calculateTempFromPoint = (clickX: number, clickY: number, rect: DOMRect): number => {
  // 1. Get click coordinates relative to the center of the element (CENTERX, CENTERY)
  // We normalize the click to the coordinate system of the SVG
  const x = clickX - (rect.left + rect.width / 2);
  const y = clickY - (rect.top + rect.height / 2);

  // 2. Calculate the angle in Radians, then to Degrees
  let angleDeg = Math.atan2(y, x) * (180 / Math.PI);

  // 3. Normalize angle to match your STARTANGLE (135°)
  // atan2 returns -180 to 180. We need to align it with our 135 -> 405 range.
  if (angleDeg < STARTANGLE - 45) {
    angleDeg += 360;
  }

  // 4. Calculate the "factor" (0 to 1) along the 270° arc
  let factor = (angleDeg - STARTANGLE) / TOTALANGLE;

  // 5. Clamp the factor so clicks outside the arc don't produce crazy temps
  factor = Math.max(0, Math.min(1, factor));

  // 6. Map the factor back to the Temperature range
  return MIN + factor * (MAX - MIN);
};

export const calculateprogressPercentage = (
  hass: HomeAssistant,
  currentSchedule: HassEntity | undefined,
):
  | {
      progress: number;
      start: string;
      end: string;
      next_trigger: string;
    }
  | undefined => {
  if (!currentSchedule || !currentSchedule.attributes) {
    console.warn('Current schedule entity is missing or has no attributes');
    /*return {
      progress: 43,
      start: '09:00',
      end: '14:00',
      next_trigger: relativeTime(new Date('2026-05-08T15:00:00+02:00'), hass.locale),
    };*/
    return undefined;
  }

  const timeSlot = currentSchedule.attributes.timeslots[currentSchedule.attributes.current_slot];
  const [startStr, endStr] = timeSlot.split(' - ').map((t: string) => t.substring(0, 5));

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const windowStart = getMinutes(startStr);
  const windowEnd = getMinutes(endStr === '00:00' ? '24:00' : endStr);
  const totalDuration = windowEnd - windowStart;
  const elapsed = currentTime - windowStart;

  // Ensure percentage is between 0 and 100
  let progressPercentage = (elapsed / totalDuration) * 100;
  progressPercentage = Math.max(0, Math.min(100, progressPercentage));

  return {
    progress: progressPercentage,
    start: startStr,
    end: endStr,
    next_trigger: relativeTime(new Date(currentSchedule.attributes.next_trigger), hass.locale),
  };
};

export const toTimeRemaining = (timeStr: string | undefined): string => {
  if (!timeStr) return '';

  // Parse the ISO string to a Date object and get seconds from now
  const target = new Date(timeStr).getTime();
  const now = new Date().getTime();
  const seconds = Math.floor((target - now) / 1000);

  if (seconds <= 0) return 'now';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  // Formats to: "1h 30m" or just "30m" if hours are 0
  return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
};

export const toShortTime = (timeStr: string | undefined): string => {
  if (!timeStr) return '';

  // The time "HH:MM" starts at index 11 and ends at 16
  // "2026-04-29T20:30:00+02:00" -> "20:30"
  return timeStr.slice(11, 16);
};

export const getMinutes = (str: string): number => {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
};

export const toPrecission = (number: string, precision?: number): string => {
  const parts = number.split('.');
  return parts[0] + '.' + parts[1].slice(0, precision || 0);
};

export const lastHours = (hours: number): number => {
  return hours * 60 * 60 * 1000;
};

export const lastDays = (days: number): number => {
  return days * lastHours(24);
};
