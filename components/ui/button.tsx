import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-on-primary shadow-sm hover:bg-primary/90 active:scale-95": variant === 'primary',
            "bg-secondary text-on-secondary shadow-sm hover:bg-secondary/90 active:scale-95": variant === 'secondary',
            "border border-outline bg-transparent hover:bg-surface-container active:scale-95 text-on-surface": variant === 'outline',
            "hover:bg-surface-container active:scale-95 text-on-surface": variant === 'ghost',
            "h-10 px-4 py-2": size === 'default',
            "h-9 rounded-md px-3": size === 'sm',
            "h-14 rounded-2xl px-8 text-lg min-h-[56px] min-w-[56px]": size === 'lg',
            "h-14 w-14 min-h-[56px] min-w-[56px]": size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
