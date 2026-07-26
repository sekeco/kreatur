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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { APP_CONFIG } from "@/lib/app-config"
import GoogleIcon from "@/components/logo/google-icon"
import { authClient } from "@/lib/auth-client"

const formSchema = z
  .object({
    nama: z.string().min(2, { message: "Nama minimal 2 karakter." }),
    email: z.string().email({ message: "Masukkan alamat email yang valid." }),
    password: z.string().min(8, { message: "Kata sandi minimal 8 karakter." }),
    confirmPassword: z
      .string()
      .min(8, { message: "Konfirmasi kata sandi minimal 8 karakter." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi tidak cocok.",
    path: ["confirmPassword"],
  })

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { nama: "", email: "", password: "", confirmPassword: "" },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true)
    const { error } = await authClient.signUp.email({
      name: data.nama,
      email: data.email,
      password: data.password,
    })

    if (error) {
      console.log(error)
      setLoading(false)
      toast.error(error.message ?? "Gagal mendaftar")
      return
    }

    setLoading(false)
    toast.success("Akun berhasil dibuat!", {
      description: "Silakan periksa email untuk verifikasi.",
    })
    router.push("/auth/verify-email")
  }

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-87.5">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium">Buat akun baru</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan detail Anda untuk mendaftar.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => toast.info("Google OAuth akan segera tersedia.")}
          >
            <GoogleIcon />
            Lanjutkan dengan Google
          </Button>

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              Atau isi form berikut
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
                name="nama"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="signup-nama">Nama Lengkap</FieldLabel>
                    <Input
                      {...field}
                      id="signup-nama"
                      type="text"
                      placeholder="Budi Santoso"
                      autoComplete="name"
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
                name="email"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="signup-email">Alamat Email</FieldLabel>
                    <Input
                      {...field}
                      id="signup-email"
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
                    <FieldLabel htmlFor="signup-password">
                      Kata Sandi
                    </FieldLabel>
                    <Input
                      {...field}
                      id="signup-password"
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
                    <FieldLabel htmlFor="signup-confirm-password">
                      Konfirmasi Kata Sandi
                    </FieldLabel>
                    <Input
                      {...field}
                      id="signup-confirm-password"
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
              Daftar
            </Button>
          </form>
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            prefetch={false}
            className="text-foreground"
            href={APP_CONFIG.links.signin}
          >
            Masuk
          </Link>
        </div>
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
