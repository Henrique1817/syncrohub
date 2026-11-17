export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

let counter = 0;
export function uid(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter}`;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** `dueDate` chega como 'YYYY-MM-DD': interpretar como data local evita "voltar um dia" em UTC-3. */
export function parseDate(value: string) {
  if (DATE_ONLY.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

export function isThisMonth(value?: string | null) {
  if (!value) return false;
  const date = parseDate(value);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === 'DONE') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDate(dueDate) < today;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function formatDate(value: string) {
  const date = parseDate(value);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatLongDate(date = new Date()) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

export function relativeTime(value: string) {
  const diffMinutes = Math.round((parseDate(value).getTime() - Date.now()) / 60_000);
  if (Math.abs(diffMinutes) < 1) return 'agora';
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day');
  return formatDate(value);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export const firstName = (name: string) => name.split(' ')[0];

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
