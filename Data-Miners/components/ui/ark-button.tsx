import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const arkButtonVariants = cva(
  [
    "group relative",
    "flex items-center justify-center gap-3",
    "transition-all duration-200",
    "ark-floppy",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        default: "hover:border-white/40 hover:bg-white/5",
        gold: "border-[#d4a853]/50 hover:border-[#d4a853] hover:bg-[#d4a853]/10",
        danger: "border-red-500/50 hover:border-red-500 hover:bg-red-500/10",
      },
      size: {
        sm: "p-2 text-xs",
        md: "p-3 sm:p-4 text-sm",
        lg: "p-4 sm:p-5 text-base",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
    },
  }
)

interface ArkButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof arkButtonVariants> {
  icon?: ReactNode
  children: ReactNode
}

export function ArkButton({
  icon,
  children,
  className,
  variant,
  size,
  fullWidth,
  disabled,
  ...props
}: ArkButtonProps) {
  return (
    <button
      disabled={disabled}
      className={twMerge(clsx(arkButtonVariants({ variant, size, fullWidth }), className))}
      {...props}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1 text-left min-w-0 font-heading tracking-wider uppercase">
        {children}
      </div>
    </button>
  )
}
