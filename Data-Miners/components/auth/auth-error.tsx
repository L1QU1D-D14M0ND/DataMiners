interface AuthErrorProps {
  message: string | null
}

export function AuthError({ message }: AuthErrorProps) {
  if (!message) return null

  return (
    <div className="ark-button ark-button-danger p-3 text-center text-sm">
      {message}
    </div>
  )
}
