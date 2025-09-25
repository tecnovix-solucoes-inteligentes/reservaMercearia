import * as React from "react"
import { cn } from "../../lib/utils"

const Checkbox = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-gray-300 text-orange-custom-600 focus:ring-2 focus:ring-orange-custom-500",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }