import { type ReactNode } from 'react'
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertProps {
  children: ReactNode
  variant?: 'info' | 'warning' | 'success' | 'error'
  className?: string
  icon?: boolean
}

const variantConfig = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  },
  warning: {
    container: 'bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300',
    icon: <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
  },
}

export function Alert({ children, variant = 'info', className, icon = true }: AlertProps) {
  const config = variantConfig[variant]

  return (
    <div
      className={cn(
        'rounded-lg border-l-4 p-4 flex gap-3',
        config.container,
        className,
      )}
      role="alert"
    >
      {icon && <div className="flex-shrink-0 mt-0.5">{config.icon}</div>}
      <div className="flex-1 text-sm leading-relaxed">{children}</div>
    </div>
  )
}
