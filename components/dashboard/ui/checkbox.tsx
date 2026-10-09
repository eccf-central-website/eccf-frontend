import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label className={cn("relative inline-flex items-center cursor-pointer select-none", disabled && "cursor-not-allowed opacity-50")}>
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <div
          aria-hidden="true"
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            checked ? "bg-primary text-primary-foreground" : "bg-transparent",
            className
          )}
        >
          {checked && <Check className="h-3 w-3 stroke-[3]" />}
        </div>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
