"use client"

import { Component, type ComponentType, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorBoundaryProps extends PropsWithChildren {
  fallback?: ReactNode
  /** Nama segmen untuk log yang lebih jelas */
  segment?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.segment ? `:${this.props.segment}` : ""}]`,
      error,
      errorInfo,
    )
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <Card className="mx-auto max-w-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-center">
                <AlertTriangle className="size-5 text-destructive" />
                Terjadi Kesalahan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Terjadi kesalahan yang tidak terduga. Silakan coba lagi.
              </p>
              {this.state.error?.message && (
                <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                  {this.state.error.message}
                </p>
              )}
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="w-full"
              >
                <RefreshCw data-icon="inline-start" />
                Muat Ulang
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
