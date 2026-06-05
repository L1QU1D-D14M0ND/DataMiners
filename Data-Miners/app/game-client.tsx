"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, useCallback, useMemo } from "react"
import { ArrowRight, Home, Lock, Mail, Settings, ShieldCheck, User, UserPlus } from "lucide-react"
import { MainMenu } from "@/components/game/main-menu"
import { MatchmakingLobby } from "@/components/matchmaking/matchmaking-lobby"
import type { GameSettings } from "@/lib/game/types"
import axios from "@/lib/axios"
import { isAxiosError } from "axios"
import type { FormEvent } from "react"
import { AuthBackground } from "@/components/auth/auth-background"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthHeader } from "@/components/auth/auth-header"
import { AuthInput } from "@/components/auth/auth-input"
import { AuthButton } from "@/components/auth/auth-button"
import { AuthError } from "@/components/auth/auth-error"
import { AuthDecoration } from "@/components/auth/auth-decoration"

const isDev = process.env.NODE_ENV === "development"

const getAdminDashboardUrl = (redirectUrl?: string | null) => {
  const baseUrl = axios.defaults.baseURL ?? "http://localhost:8000"

  try {
    return new URL(redirectUrl || "/dashboard", baseUrl).toString()
  } catch {
    return `${baseUrl}/dashboard`
  }
}

const Icons = {
  user: <User className="w-4 h-4" aria-hidden="true" />,
  email: <Mail className="w-4 h-4" aria-hidden="true" />,
  lock: <Lock className="w-4 h-4" aria-hidden="true" />,
  shield: <ShieldCheck className="w-4 h-4" aria-hidden="true" />,
  arrowRight: <ArrowRight className="w-5 h-5" aria-hidden="true" />,
  userPlus: <UserPlus className="w-5 h-5" aria-hidden="true" />,
  home: <Home className="w-5 h-5" aria-hidden="true" />,
  settings: <Settings className="w-5 h-5" aria-hidden="true" />,
} as const

const GameCanvas = dynamic(() => import("@/components/game/game-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="text-primary font-mono text-sm tracking-widest uppercase animate-pulse">
          Initializing Grid...
        </div>
      </div>
    </div>
  ),
})

interface UserProfile {
  id: number
  name: string
  email: string
  role: string
}

export default function GameClient() {
  const [gameStarted, setGameStarted] = useState(false)
  const [deckIds, setDeckIds] = useState<string[]>([])
  const [matchId, setMatchId] = useState<string | null>(null)
  const [inMatchmaking, setInMatchmaking] = useState(false)
  const [settings, setSettings] = useState<GameSettings>({
    volume: 0.7,
    soundEnabled: true,
    musicVolume: 0.5,
    musicEnabled: true,
  })
  const [user, setUser] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<"loading" | "guest" | "authenticated" | "admin_choice">("loading")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerPasswordConfirmation, setRegisterPasswordConfirmation] = useState("")
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [registerLoading, setRegisterLoading] = useState(false)

  const adminDashboardUrl = useMemo(() => getAdminDashboardUrl(pendingRedirectUrl), [pendingRedirectUrl])

  // Helper functions
  const fetchCsrfToken = useCallback(async () => {
    await axios.get("/sanctum/csrf-cookie")
  }, [])

  const getErrorMessage = useCallback((error: unknown, fallback: string): string => {
    if (isAxiosError(error)) {
      const responseData = error.response?.data
      const validationErrors = responseData?.errors

      if (validationErrors && typeof validationErrors === "object") {
        const firstValidationError = Object.values(validationErrors as Record<string, unknown>)
          .flatMap((value) => (Array.isArray(value) ? value : [value]))
          .find((value): value is string => typeof value === "string")

        if (firstValidationError) {
          return firstValidationError
        }
      }

      return responseData?.message || fallback
    }
    return error instanceof Error ? error.message : fallback
  }, [])

  useEffect(() => {
    let isMounted = true

    async function fetchUser() {
      try {
        const response = await axios.get("/spa/user")

        if (!isMounted) return

        if (!response.data?.user) {
          setStatus("guest")
          return
        }

        if (response.data.user.role === "Administrator") {
          setUser(response.data.user)
          setPendingRedirectUrl(getAdminDashboardUrl())
          setStatus("admin_choice")
          return
        }

        setUser(response.data.user)
        setStatus("authenticated")
      } catch (error) {
        if (isMounted) {
          if (isAxiosError(error) && error.response?.status === 401) {
            setStatus("guest")
          } else {
            console.error("Failed to fetch user session:", error)
            setStatus("guest")
          }
        }
      }
    }

    fetchUser()

    return () => {
      isMounted = false
    }
  }, [])

  const handleReturnToMenu = useCallback(() => {
    setGameStarted(false)
    setDeckIds([])
    setMatchId(null)
  }, [])

  const handleStartGame = useCallback((selectedDeckIds: string[]) => {
    setDeckIds(selectedDeckIds)
    setGameStarted(true)
  }, [])

  const handleStartMatchmaking = useCallback(() => {
    setInMatchmaking(true)
  }, [])

  const handleMatchFound = useCallback(async (foundMatchId: string, gameSessionId: number) => {
    if (isDev) {
      console.log("handleMatchFound called with:", foundMatchId, gameSessionId)
    }
    try {
      // Initialize card mapping first
      const { initializeCardMapping, fetchDecks, toFrontendCardIds } = await import("@/lib/game/cards/card-mapping")
      await initializeCardMapping()

      // Fetch user's decks to get the default deck
      const backendDecks = await fetchDecks()
      if (isDev) {
        console.log("Fetched decks:", backendDecks)
      }
      const userDecks = backendDecks.map((bd: any) => ({
        id: bd.id,
        name: bd.name,
        cardIds: toFrontendCardIds(bd.card_ids),
      }))

      // Use the first deck as default
      const defaultDeck = userDecks[0]
      if (isDev) {
        console.log("Default deck:", defaultDeck)
      }
      if (defaultDeck) {
        setDeckIds(defaultDeck.cardIds)
      }

      setMatchId(foundMatchId)
      setInMatchmaking(false)
      setGameStarted(true)
      if (isDev) {
        console.log("Game started with matchId:", foundMatchId)
      }
    } catch (error) {
      console.error("Failed to load deck for match:", error)
      // Still start the game even if deck loading fails
      setMatchId(foundMatchId)
      setInMatchmaking(false)
      setGameStarted(true)
    }
  }, [])

  const handleMatchmakingCancel = useCallback(() => {
    setInMatchmaking(false)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await axios.post("/spa/logout")
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setUser(null)
      setStatus("guest")
      setLoginEmail("")
      setLoginPassword("")
      setLoginError(null)
    }
  }, [])

  const handleLogin = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginError(null)
    setLoginLoading(true)

    try {
      await fetchCsrfToken()

      const response = await axios.post("/spa/login", {
        email: loginEmail.trim(),
        password: loginPassword,
      })

      const data = response.data

      if (data.redirect_to?.includes("/dashboard")) {
        setUser(data.user)
        setPendingRedirectUrl(getAdminDashboardUrl(data.redirect_to))
        setLoginPassword("")
        setStatus("admin_choice")
        return
      }

      setUser(data.user)
      setLoginPassword("")
      setStatus("authenticated")
    } catch (error_) {
      setLoginError(getErrorMessage(error_, "Login failed."))
    } finally {
      setLoginLoading(false)
    }
  }, [fetchCsrfToken, getErrorMessage, loginEmail, loginPassword])

  const handleRegister = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRegisterError(null)

    if (registerPassword !== registerPasswordConfirmation) {
      setRegisterError("Passwords do not match.")
      return
    }

    setRegisterLoading(true)

    try {
      await fetchCsrfToken()

      const response = await axios.post("/spa/register", {
        name: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
        password_confirmation: registerPasswordConfirmation,
      })

      setUser(response.data.user)
      setRegisterPassword("")
      setRegisterPasswordConfirmation("")
      setStatus("authenticated")
    } catch (error_) {
      setRegisterError(getErrorMessage(error_, "Registration failed."))
    } finally {
      setRegisterLoading(false)
    }
  }, [fetchCsrfToken, getErrorMessage, registerName, registerEmail, registerPassword, registerPasswordConfirmation])

  if (status === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-primary font-mono text-sm tracking-widest uppercase">Checking login status...</div>
      </div>
    )
  }

  if (status === "guest") {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <AuthBackground />
        <div className="relative z-10 w-full max-w-md">
          <AuthCard>
            <AuthHeader
              title={showRegister ? "USER REGISTRATION" : "USER LOGIN"}
              subtitle={showRegister ? "CREATE NEW ACCOUNT" : "AUTHENTICATION REQUIRED"}
            />

            <div className="p-6 space-y-4">
              {showRegister ? (
                <form className="space-y-4" onSubmit={handleRegister}>
                  <AuthInput
                    label="USERNAME"
                    icon={Icons.user}
                    value={registerName}
                    onChange={setRegisterName}
                    placeholder="Enter your username"
                    name="name"
                    autoComplete="name"
                    disabled={registerLoading}
                    required
                  />
                  <AuthInput
                    label="EMAIL ADDRESS"
                    type="email"
                    icon={Icons.email}
                    value={registerEmail}
                    onChange={setRegisterEmail}
                    placeholder="Enter your email"
                    name="email"
                    autoComplete="email"
                    disabled={registerLoading}
                    required
                  />
                  <AuthInput
                    label="PASSWORD"
                    type="password"
                    icon={Icons.lock}
                    value={registerPassword}
                    onChange={setRegisterPassword}
                    placeholder="Enter your password"
                    name="password"
                    autoComplete="new-password"
                    disabled={registerLoading}
                    minLength={8}
                    required
                  />
                  <AuthInput
                    label="CONFIRM PASSWORD"
                    type="password"
                    icon={Icons.shield}
                    value={registerPasswordConfirmation}
                    onChange={setRegisterPasswordConfirmation}
                    placeholder="Confirm your password"
                    name="password_confirmation"
                    autoComplete="new-password"
                    disabled={registerLoading}
                    minLength={8}
                    required
                  />
                  <AuthError message={registerError} />
                  <AuthButton
                    icon={Icons.userPlus}
                    loading={registerLoading}
                    loadingText="CREATING ACCOUNT..."
                  >
                    REGISTER
                  </AuthButton>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <AuthInput
                    label="EMAIL ADDRESS"
                    type="email"
                    icon={Icons.email}
                    value={loginEmail}
                    onChange={setLoginEmail}
                    placeholder="Enter your email"
                    name="email"
                    autoComplete="email"
                    disabled={loginLoading}
                    required
                  />
                  <AuthInput
                    label="PASSWORD"
                    type="password"
                    icon={Icons.lock}
                    value={loginPassword}
                    onChange={setLoginPassword}
                    placeholder="Enter your password"
                    name="password"
                    autoComplete="current-password"
                    disabled={loginLoading}
                    required
                  />
                  <AuthError message={loginError} />
                  <AuthButton
                    icon={Icons.arrowRight}
                    loading={loginLoading}
                    loadingText="AUTHENTICATING..."
                  >
                    SIGN IN
                  </AuthButton>
                </form>
              )}
            </div>
          </AuthCard>

          {/* Toggle button */}
          <div className="flex items-center justify-center mt-6">
            <button
              type="button"
              onClick={() => {
                setShowRegister(!showRegister)
                setLoginError(null)
                setRegisterError(null)
                if (showRegister) {
                  setRegisterName("")
                  setRegisterEmail("")
                  setRegisterPassword("")
                  setRegisterPasswordConfirmation("")
                } else {
                  setLoginEmail("")
                  setLoginPassword("")
                }
              }}
              disabled={loginLoading || registerLoading}
              className="text-[#d4a853]/70 hover:text-[#d4a853] text-sm font-heading tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showRegister ? "Already have an account? Sign In" : "Need an account? Register"}
            </button>
          </div>

          <AuthDecoration />
        </div>
      </div>
    )
  }

  if (status === "admin_choice") {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <AuthBackground />
        <div className="relative z-10 w-full max-w-md">
          <AuthCard>
            <AuthHeader
              title="ADMIN ACCESS"
              subtitle="CHOOSE YOUR DESTINATION"
            />

            {/* Choice content */}
            <div className="p-6 space-y-4">
              <div className="text-center text-white/70 text-sm mb-4">
                Welcome, {user?.name}. You have administrator privileges.
              </div>

              {/* Frontend Menu button */}
              <button
                onClick={() => setStatus("authenticated")}
                className="group relative w-full ark-floppy p-4 flex items-center justify-center gap-3 transition-all duration-200 border-[#d4a853]/50 hover:border-[#d4a853] hover:bg-[#d4a853]/10"
              >
                <div className="flex-shrink-0 text-[#d4a853]">{Icons.home}</div>
                <div className="font-heading text-sm tracking-wider text-[#d4a853]">
                  FRONTEND MENU
                </div>
              </button>

              {/* Backend Dashboard button */}
              <button
                onClick={() => {
                  window.location.href = adminDashboardUrl
                }}
                className="group relative w-full ark-floppy p-4 flex items-center justify-center gap-3 transition-all duration-200 border-[#d4a853]/50 hover:border-[#d4a853] hover:bg-[#d4a853]/10"
              >
                <div className="flex-shrink-0 text-[#d4a853]">{Icons.settings}</div>
                <div className="font-heading text-sm tracking-wider text-[#d4a853]">
                  BACKEND DASHBOARD
                </div>
              </button>
            </div>
          </AuthCard>

          <AuthDecoration />
        </div>
      </div>
    )
  }

  if (inMatchmaking) {
    return (
      <MatchmakingLobby
        onMatchFound={handleMatchFound}
        onCancel={handleMatchmakingCancel}
      />
    )
  }

  if (!gameStarted) {
    return (
      <MainMenu
        onStartGame={handleStartGame}
        onStartMatchmaking={handleStartMatchmaking}
        settings={settings}
        onSettingsChange={setSettings}
        onLogout={handleLogout}
        user={user}
        adminDashboardUrl={adminDashboardUrl}
      />
    )
  }

  return (
    <GameCanvas
      onReturnToMenu={handleReturnToMenu}
      deckIds={deckIds}
      matchId={matchId}
      settings={settings}
      onSettingsChange={setSettings}
    />
  )
}
