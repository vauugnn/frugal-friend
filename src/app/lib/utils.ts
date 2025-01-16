import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

type LocaleConfig = {
  locale: 'en-PH',
  currency: 'PHP',
  dateFormat: Intl.DateTimeFormatOptions,
  shortDateFormat: Intl.DateTimeFormatOptions
}

const config: LocaleConfig = {
  locale: 'en-PH',
  currency: 'PHP',
  dateFormat: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  shortDateFormat: {
    month: 'short',
    day: 'numeric',
  }
}

// Merge class names with Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2
  }).format(amount)
}

// Format date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat(
    config.locale, 
    config.dateFormat
  ).format(new Date(date))
}

// Format short date
export function formatShortDate(date: string | Date): string {
  return new Intl.DateTimeFormat(
    config.locale,
    config.shortDateFormat
  ).format(new Date(date))
}

// Group by date
export function groupByDate<T extends { date: string }>(
  items: T[],
  dateFormatter: (date: string) => string = formatShortDate
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const date = dateFormatter(item.date)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

// Sort by date
export function sortByDate<T extends { date: string }>(
  items: T[],
  direction: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return direction === 'desc' ? dateB - dateA : dateA - dateB
  })
}