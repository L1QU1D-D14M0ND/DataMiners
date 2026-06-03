/**
 * Animated sci-fi background used across auth pages and the main menu.
 * Renders a grid pattern, rotating SVG reticles, and a scanlines overlay.
 */
export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Rotating corner reticles */}
      <svg
        className="absolute top-4 left-4 w-12 h-12 sm:top-6 sm:left-6 sm:w-16 sm:h-16 lg:w-32 lg:h-32 opacity-20 reticle-spin"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(212,168,83,0.3)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
        <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(212,168,83,0.2)" strokeWidth="0.5" />
      </svg>
      <svg
        className="absolute bottom-4 right-4 w-16 h-16 sm:bottom-6 sm:right-6 sm:w-20 sm:h-20 lg:w-40 lg:h-40 opacity-20 reticle-spin-reverse"
        viewBox="0 0 100 100"
      >
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.5"
          strokeDasharray="8 4"
        />
      </svg>

      {/* Scanlines */}
      <div className="absolute inset-0 scanlines opacity-30" />
    </div>
  )
}
