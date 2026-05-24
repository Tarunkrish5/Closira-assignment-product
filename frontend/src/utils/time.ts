/**
 * Lightweight time helpers — no external dep on date-fns / dayjs so the
 * bundle stays slim. Good enough for the UI here.
 */

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffSec = Math.round((now.getTime() - then.getTime()) / 1000);

  if (Number.isNaN(diffSec)) return '';

  const abs = Math.abs(diffSec);
  const past = diffSec >= 0;

  if (abs < 45) return past ? 'just now' : 'in a moment';
  if (abs < HOUR) {
    const mins = Math.round(abs / MINUTE);
    return past ? `${mins}m ago` : `in ${mins}m`;
  }
  if (abs < DAY) {
    const hrs = Math.round(abs / HOUR);
    return past ? `${hrs}h ago` : `in ${hrs}h`;
  }
  const days = Math.round(abs / DAY);
  if (days < 7) return past ? `${days}d ago` : `in ${days}d`;

  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatClock(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}
