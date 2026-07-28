"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Globe, KeyRound } from "lucide-react"

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

const formSchema = z
  .object({
    password: z.string().min(8, { message: "Kata sandi minimal 8 karakter." }),
    confirmPassword: z
      .string()
      .min(8, { message: "Konfirmasi kata sandi minimal 8 karakter." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi tidak cocok.",
    path: ["confirmPassword"],
  })

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!token) return
    setLoading(true)

    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token,
    })

    if (error) {
      setLoading(false)
      toast.error(error.message ?? "Gagal mereset kata sandi")
      return
    }

    toast.success("Kata sandi berhasil diubah!", {
      description: "Silakan masuk dengan kata sandi baru Anda.",
    })
    router.push("/auth/signin")
  }

  if (!token) {
    return (
      <>
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:w-sm">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <KeyRound className="size-6 text-destructive" />
            </div>
            <h1 className="text-3xl font-medium">Tautan tidak valid</h1>
            <p className="text-sm text-muted-foreground">
              Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.
              Silakan ajukan ulang.
            </p>
          </div>
          <Link
            href={APP_CONFIG.links.forgotPassword}
            className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Ajukan Reset Ulang
          </Link>
        </div>

        <div className="absolute bottom-5 flex w-full justify-between px-4 lg:px-10">
          <div className="text-sm">{APP_CONFIG.copyright}</div>
          <div className="flex items-center gap-1 text-sm">
            <Globe className="size-4 text-muted-foreground" />
            ID
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:w-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <KeyRound className="size-6 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-medium">Reset kata sandi</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan kata sandi baru Anda.
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
              name="password"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password">
                    Kata Sandi Baru
                  </FieldLabel>
                  <Input
                    {...field}
                    id="reset-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-confirm-password">
                    Konfirmasi Kata Sandi Baru
                  </FieldLabel>
                  <Input
                    {...field}
                    id="reset-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
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
            Ubah Kata Sandi
          </Button>
        </form>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-4 lg:px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          ID
        </div>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
