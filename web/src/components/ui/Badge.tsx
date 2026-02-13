import type {ReactNode} from 'react';
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  variant?:
    | 'feature'
    | 'improvement'
    | 'fix'
    | 'breaking'
    | 'version'
    | 'default'
  className?: string
}

const variantClasses = {
  feature:
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  improvement:
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  fix: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  breaking:
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  version:
    'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  default:
    'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
}

export function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
        'uppercase tracking-wide',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
