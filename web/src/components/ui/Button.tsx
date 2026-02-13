import type {ButtonHTMLAttributes, ReactNode} from 'react';
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  external?: boolean
  className?: string
}

const variantClasses = {
  primary:
    'bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] text-white hover:opacity-90 shadow-md hover:shadow-lg',
  secondary:
    'bg-transparent border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white',
  ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-muted)]',
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  external = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )

  // Render as link if href is provided
  if (href) {
    return (
      <a
        href={href}
        className={classes}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    )
  }

  // Render as button
  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
