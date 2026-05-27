interface AuthHeaderProps {
  title: string
  subtitle: string
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="p-6 border-b border-white/10 text-center">
      <h1 className="font-heading text-2xl sm:text-3xl tracking-[0.2em] text-white/90 text-glow-gold">
        {title}
      </h1>
      <div className="font-serif italic text-xs text-[#d4a853] tracking-widest mt-2">
        {subtitle}
      </div>
    </div>
  )
}
