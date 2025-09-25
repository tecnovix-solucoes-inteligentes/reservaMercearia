import * as React from "react"
import { cn } from "../../lib/utils"

const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div className={cn("grid gap-2", className)} ref={ref} {...props} />
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      type="radio"
      className={cn(
        "h-4 w-4 border-gray-300 text-orange-custom-600 focus:ring-2 focus:ring-orange-custom-500",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }