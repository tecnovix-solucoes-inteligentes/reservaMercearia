import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-custom-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-orange-custom-600 text-white hover:bg-orange-custom-700 active:bg-orange-800 shadow-orange-custom-200",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-red-200",
        outline:
          "border-2 border-gray-600 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white hover:border-gray-500",
        secondary:
          "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
        ghost: "hover:bg-gray-100 text-gray-700 shadow-none",
        link: "text-orange-custom-600 underline-offset-4 hover:underline shadow-none",
        success: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-green-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }