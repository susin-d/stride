import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  if (isNaN(date.getTime())) return '';

  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatShortDate(dateString?: string | null): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return format(date, 'MMM d');
}

export function formatTime(timeString?: string | null): string {
  if (!timeString) return '';
  // Handle HH:mm or HH:mm:ss
  const parts = timeString.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }
  return timeString;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning,';
  if (hour < 18) return 'Good Afternoon,';
  return 'Good Evening,';
}
