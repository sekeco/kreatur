"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Globe, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { APP_CONFIG } from "@/lib/app-config"
import { authClient } from "@/lib/auth-client"

const formSchema = z.object({
  email: z.string().email({ message: "Masukkan alamat email yang valid." }),
})

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true)
    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setLoading(false)
      toast.error(error.message ?? "Gagal mengirim email reset")
      return
    }

    // Simpan email untuk tombol "Kirim Ulang" di halaman check-email
    sessionStorage.setItem("resetEmail", data.email)

    toast.success("Email terkirim!", {
      description:
        "Jika email terdaftar, Anda akan menerima tautan reset kata sandi.",
    })
    router.push("/auth/check-email")
  }

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-87.5">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Lock className="size-6 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-medium">Lupa kata sandi?</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset
            kata sandi.
          </p>
        </div>

        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-email">Alamat Email</FieldLabel>
                  <Input
                    {...field}
                    id="forgot-email"
                    type="email"
                    placeholder="nama@email.com"
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading && <Spinner />}
            Kirim Tautan Reset
          </Button>
          <div className="text-center text-sm">
            <Link
              prefetch={false}
              className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
              href={APP_CONFIG.links.signin}
            >
              Kembali ke halaman masuk
            </Link>
          </div>
        </form>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          ID
        </div>
      </div>
    </>
  )
}
