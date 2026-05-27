import { ReactNode } from "react"

interface AuthCardProps {
  children: ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="ark-card scanlines overflow-hidden slide-in-top">
      {children}
    </div>
  )
}
