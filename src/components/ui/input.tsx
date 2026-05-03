import * as React from "react"
import { cn } from "@/lib/utils"

type InputProps = Omit<React.ComponentProps<"input">, "prefix"> & {
  variant?: "inline" | "filled"
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, prefix, suffix, containerClassName, variant = "inline", ...props }, ref) => {
    if (prefix !== undefined || suffix !== undefined) {
      if (variant === "filled") {
        return (
          <div
            className={cn(
              "flex items-center gap-2 bg-gym-zinc-100 rounded-xl px-4 h-11",
              "border border-gym-zinc-200",
              "focus-within:outline-none focus-within:ring-2 focus-within:ring-gym-black",
              "focus-within:ring-offset-2 focus-within:ring-offset-white",
              containerClassName,
            )}
          >
            {prefix}
            <input
              data-slot="input"
              ref={ref}
              className={cn(
                "flex-1 bg-transparent text-base font-medium outline-none",
                "text-gym-black placeholder:text-gym-zinc-400",
                className,
              )}
              {...props}
            />
            {suffix}
          </div>
        )
      }
      return (
        <div
          className={cn(
            "flex items-center gap-2 border-b border-gym-zinc-300 h-11",
            "focus-within:border-gym-black",
            containerClassName,
          )}
        >
          {prefix}
          <input
            data-slot="input"
            ref={ref}
            className={cn(
              "flex-1 bg-transparent text-base font-medium outline-none",
              "text-gym-black placeholder:text-gym-zinc-400",
              className,
            )}
            {...props}
          />
          {suffix}
        </div>
      )
    }

    if (variant === "filled") {
      return (
        <input
          data-slot="input"
          ref={ref}
          className={cn(
            "flex-1 bg-gym-zinc-100 rounded-xl px-3 h-11",
            "text-base font-medium text-gym-black",
            "placeholder:text-gym-zinc-400",
            "focus-ring outline-none",
            className,
          )}
          {...props}
        />
      )
    }

    return (
      <input
        data-slot="input"
        ref={ref}
        className={cn(
          "flex-1 bg-transparent border-b border-gym-zinc-300 h-11",
          "text-base font-medium text-gym-black",
          "placeholder:text-gym-zinc-400",
          "outline-none focus-visible:border-gym-black",
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
