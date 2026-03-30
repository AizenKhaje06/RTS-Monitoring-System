"use client"

import { Loader2 } from "lucide-react"

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

export function FullPageLoading({ message = "Processing data..." }: LoadingStateProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="glass-strong rounded-2xl p-8 text-center max-w-md">
        <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">{message}</h3>
        <p className="text-muted-foreground">This may take a few moments...</p>
      </div>
    </div>
  )
}
