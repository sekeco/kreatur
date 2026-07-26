"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Terjadi Kesalahan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {error.message || "Terjadi kesalahan yang tidak terduga."}
          </p>
          <Button onClick={reset} className="w-full">
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
