import { type ReactNode, useId } from "react"

interface AuthInputProps {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  autoComplete?: string
  disabled?: boolean
  minLength?: number
  name?: string
}

export function AuthInput({
  label,
  icon,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  autoComplete,
  disabled = false,
  minLength,
  name,
}: AuthInputProps) {
  const inputId = useId()

  return (
    <div className="ark-floppy p-3 flex items-center gap-3">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-white/60">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <label htmlFor={inputId} className="block font-heading text-[10px] tracking-wider text-white/50 mb-1">
          {label}
        </label>
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          minLength={minLength}
          className="w-full bg-transparent border-none outline-none text-white/90 text-sm placeholder-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
