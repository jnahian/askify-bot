import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  noPadding?: boolean
}

export function Card({ children, className, hover = false, noPadding = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg)] rounded-[var(--radius-lg)] border border-[var(--border)]',
        'shadow-[var(--shadow-sm)]',
        'dark:bg-[var(--bg-muted)] dark:shadow-lg',
        hover && 'transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]',
        !noPadding && 'p-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Card Header Component
 */
interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

/**
 * Card Title Component
 */
interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-xl font-semibold text-[var(--text-primary)]', className)}>
      {children}
    </h3>
  )
}

/**
 * Card Description Component
 */
interface CardDescriptionProps {
  children: ReactNode
  className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-[var(--text-secondary)] leading-relaxed', className)}>
      {children}
    </p>
  )
}

/**
 * Card Content Component
 */
interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(className)}>{children}</div>
}

/**
 * Card Footer Component
 */
interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-[var(--border)]', className)}>
      {children}
    </div>
  )
}
