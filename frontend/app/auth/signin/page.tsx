"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { APP_CONFIG } from "@/lib/app-config"
import GoogleIcon from "@/components/logo/google-icon"
import { authClient } from "@/lib/auth-client"

const formSchema = z.object({
  email: z.string().email({ message: "Masukkan alamat email yang valid." }),
  password: z.string().min(8, { message: "Kata sandi minimal 8 karakter." }),
  remember: z.boolean().optional(),
})

export default function SignInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", remember: false },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true)
    const { data: result, error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: data.remember,
    })

    if (error) {
      setLoading(false)
      toast.error(error.message ?? "Gagal masuk")
      return
    }

    // Kalau email belum diverifikasi → jangan lanjut ke dashboard
    if (result?.user && !result.user.emailVerified) {
      setLoading(false)
      toast.warning("Email belum diverifikasi. Silakan cek email Anda.")
      router.push("/auth/verify-email")
      return
    }

    // Tunggu session stabil, lalu ambil daftar organisasi
    // dengan retry jika masih kosong (session mungkin belum siap)
    let orgs: any[] | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await authClient.organization.list()
      if (res.data && res.data.length > 0) {
        orgs = res.data as any[]
        break
      }
      // Tunggu 300ms sebelum coba lagi
      if (attempt < 2) await new Promise((r) => setTimeout(r, 300))
    }

    setLoading(false)

    toast.success("Berhasil masuk!", {
      description: "Mengarahkan ke dashboard...",
    })

    if (orgs && orgs.length > 0) {
      await authClient.organization.setActive({ organizationId: orgs[0].id })
      // Gunakan window.location untuk hard redirect — lebih reliable
      window.location.href = `/orgs/${orgs[0].slug}/dashboard`
    } else {
      router.push("/boarding")
    }
  }

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-87.5">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium">Masuk ke akun Anda</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan detail Anda untuk masuk.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              authClient.signIn.social({
                provider: "google",
                callbackURL: `${window.location.origin}/auth/oauth-callback`,
              })
            }
          >
            <GoogleIcon />
            Lanjutkan dengan Google
          </Button>

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              Atau
            </span>
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
                    <FieldLabel htmlFor="signin-email">Alamat Email</FieldLabel>
                    <Input
                      {...field}
                      id="signin-email"
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
              <Controller
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="signin-password">
                      Kata Sandi
                    </FieldLabel>
                    <Input
                      {...field}
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                name="remember"
                render={({ field, fieldState }) => (
                  <Field
                    orientation="horizontal"
                    data-invalid={fieldState.invalid}
                  >
                    <Checkbox
                      id="signin-remember"
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldContent>
                      <FieldLabel
                        htmlFor="signin-remember"
                        className="font-normal"
                      >
                        Ingat saya selama 30 hari
                      </FieldLabel>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Spinner />}
              Masuk
            </Button>
          </form>
        </div>

        <div className="text-center text-sm">
          <div className="text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              prefetch={false}
              className="text-foreground"
              href={APP_CONFIG.links.signup}
            >
              Daftar
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <Link
          prefetch={false}
          className="text-sm text-muted-foreground hover:text-foreground"
          href={APP_CONFIG.links.forgotPassword}
        >
          Lupa kata sandi?
        </Link>
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
