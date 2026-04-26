import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface shadow-[0_2px_12px_rgba(0,0,0,0.04)]",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

export { Card }
