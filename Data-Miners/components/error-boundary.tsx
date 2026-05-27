"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
          <div className="ark-card scanlines max-w-md w-full p-6">
            <h2 className="font-serif text-xl text-white italic mb-4">System Error</h2>
            <p className="text-white/60 text-sm mb-4">
              An unexpected error occurred. The system has been notified and is working to resolve the issue.
            </p>
            {this.state.error && process.env.NODE_ENV === "development" && (
              <div className="bg-black/50 p-3 rounded font-mono text-xs text-red-400 mb-4">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="ark-button-gold w-full py-2"
            >
              Restart System
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
