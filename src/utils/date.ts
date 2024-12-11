import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

export function getNextDay(date: Date): Date {
  return addDays(date, 1);
}

export function getPreviousDay(date: Date): Date {
  return subDays(date, 1);
}