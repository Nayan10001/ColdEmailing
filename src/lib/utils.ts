import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  return formatDate(date)
}

export function getStatusColor(status: string) {
  const statusColors = {
    // Campaign statuses
    draft: 'badge-gray',
    active: 'badge-success',
    paused: 'badge-warning',
    completed: 'badge-info',
    
    // Lead statuses
    new: 'badge-gray',
    contacted: 'badge-info',
    replied: 'badge-success',
    converted: 'badge-success',
    unsubscribed: 'badge-error',
    
    // Email statuses
    generated: 'badge-gray',
    sent: 'badge-info',
    delivered: 'badge-success',
    opened: 'badge-success',
    failed: 'badge-error',
  }
  
  return statusColors[status as keyof typeof statusColors] || 'badge-gray'
}

export function getStatusIcon(status: string) {
  const statusIcons = {
    // Campaign statuses
    draft: '📝',
    active: '🟢',
    paused: '⏸️',
    completed: '✅',
    
    // Lead statuses
    new: '👤',
    contacted: '📧',
    replied: '💬',
    converted: '🎯',
    unsubscribed: '🚫',
    
    // Email statuses
    generated: '📝',
    sent: '📤',
    delivered: '📬',
    opened: '👀',
    replied: '💬',
    failed: '❌',
  }
  
  return statusIcons[status as keyof typeof statusIcons] || '❓'
}

export function calculatePercentage(value: number, total: number) {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function downloadCsv(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}