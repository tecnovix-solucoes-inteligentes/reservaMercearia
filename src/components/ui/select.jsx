import * as React from "react"
import { cn } from "../../lib/utils"

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{ borderColor: '#262D34' }}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
})
Select.displayName = "Select"

export { Select }