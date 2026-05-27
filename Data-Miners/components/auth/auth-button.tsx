import type { ButtonHTMLAttributes, ReactNode } from "react"

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  loading?: boolean
  loadingText?: string
  children: ReactNode
}

export function AuthButton({ icon, loading = false, loadingText = "LOADING...", children, disabled, className = "", ...props }: AuthButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={`
        group relative w-full ark-floppy p-4 flex items-center justify-center gap-3 transition-all duration-200
        border-[#d4a853]/50 hover:border-[#d4a853] hover:bg-[#d4a853]/10
        ${loading || disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      {...props}
    >
      <div className="flex-shrink-0 text-[#d4a853]">
        {icon}
      </div>
      <div className="font-heading text-sm tracking-wider text-[#d4a853]">
        {loading ? loadingText : children}
      </div>
    </button>
  )
}
