import type React from "react"

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  icon?: React.ReactNode
  label?: string
  description?: string
  disabled?: boolean
  "aria-label"?: string
}

export function ToggleSwitch({
  checked,
  onChange,
  icon,
  label,
  description,
  disabled = false,
  "aria-label": ariaLabel,
}: ToggleSwitchProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          {label && (
            <span className="text-sm font-heading uppercase tracking-wider text-white/80">
              {label}
            </span>
          )}
          {description && (
            <div className="font-serif italic text-[10px] text-white/40">
              {description}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          relative w-12 h-6 transition-colors
          ${checked ? "bg-[#d4a853]" : "bg-white/20"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label}
      >
        <div
          className={`
            absolute top-1 w-4 h-4 bg-white transition-transform
            ${checked ? "translate-x-6" : "translate-x-1"}
          `}
          style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0 50%)" }}
        />
      </button>
    </div>
  )
}
