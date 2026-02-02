import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function LoadingSpinner({
  className,
  size = 'md',
  fullPage = false,
}: LoadingSpinnerProps): React.ReactElement {
  const spinner = (
    <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size], className)} />
  )

  if (fullPage) {
    return <div className="flex min-h-[400px] items-center justify-center">{spinner}</div>
  }

  return spinner
}
