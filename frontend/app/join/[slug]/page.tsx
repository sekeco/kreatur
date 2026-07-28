"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { ArrowRight, CheckCheck, Globe } from "lucide-react"

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
import { api } from "@/lib/eden-client"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

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

export default function JoinPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [loading, setLoading] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [joinStatus, setJoinStatus] = useState<"loading" | "open" | "closed">(
    "loading"
  )

  const { data: session, isPending: sessionPending } = authClient.useSession()
  const { data: organizations, isPending: orgsPending } =
    authClient.useListOrganizations()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { nama: "", email: "", password: "", confirmPassword: "" },
  })

  // Cek apakah ruang kerja mengizinkan publik join
  useEffect(() => {
    if (!slug) {
      setJoinStatus("closed")
      return
    }
    api.api
      .orgs({ slug })
      .joinStatus.get()
      .then(({ data: res }) => {
        const isOpen = res?.data && (res.data as any).publicJoinEnabled === true
        setJoinStatus(isOpen ? "open" : "closed")
      })
      .catch(() => setJoinStatus("closed"))
  }, [slug])

  // ── Loading — tunjukkan spinner ──

  if (joinStatus === "loading") {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:w-sm">
        <div className="flex justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  // ── Publik join nonaktif ──

  if (joinStatus === "closed") {
    return (
      <>
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:w-sm">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Globe />
              </EmptyMedia>
              <EmptyTitle className="text-3xl font-medium">
                Pendaftaran Ditutup
              </EmptyTitle>
              <EmptyDescription className="text-sm text-muted-foreground">
                Ruang kerja <strong>{slug}</strong> saat ini tidak menerima
                anggota baru melalui tautan publik.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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

  // ── Slug tidak valid (hanya jika joinStatus bukan loading) ──

  if (!slug) {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:w-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <Globe className="size-6 text-destructive" />
          </div>
          <h1 className="text-3xl font-medium">Tautan tidak valid</h1>
          <p className="text-sm text-muted-foreground">
            Tautan yang Anda akses tidak valid.
          </p>
        </div>
      </div>
    )
  }

  // ── Join terbuka untuk publik ──

  const checkingMembership = sessionPending || (!!session && orgsPending)
  const isMember =
    !!session && !!organizations
      ? organizations.some((o: { slug: string }) => o.slug === slug)
      : false

  // ── Sedang cek membership ──

  if (checkingMembership && session) {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:w-sm">
        <div className="flex justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  // ── Sudah login & sudah menjadi anggota ──

  if (session && isMember) {
    return (
      <>
        <div className="mx-auto flex w-full flex-col justify-center space-y-8">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckCheck />
              </EmptyMedia>
              <EmptyTitle className="text-3xl font-medium">
                Anda sudah bergabung
              </EmptyTitle>
              <EmptyDescription className="text-sm text-muted-foreground">
                Anda sudah menjadi anggota di ruang kerja{" "}
                <strong>{slug}</strong>.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <Button
                variant="link"
                onClick={() => router.push(`/orgs/${slug}/dashboard`)}
              >
                Buka Dashboard
                <ArrowRight />
              </Button>
            </EmptyContent>
          </Empty>
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

  // ── Sudah login & belum menjadi anggota → tombol bergabung ──

  async function handleJoin() {
    if (!slug) return
    setAccepting(true)

    const { error } = await api.api.orgs({ slug }).join.post()

    if (error) {
      setAccepting(false)
      toast.error(
        (error as { value?: { error?: string } })?.value?.error ??
          "Gagal bergabung ke ruang kerja"
      )
      return
    }

    await authClient.organization.setActive({ organizationSlug: slug })
    toast.success("Berhasil bergabung ke ruang kerja!", {
      description: "Mengarahkan ke dashboard...",
    })
    router.push(`/orgs/${slug}/dashboard`)
  }

  if (session && !isMember) {
    return (
      <>
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:w-sm">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <Globe className="size-6 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-medium">Bergabung ke ruang kerja</h1>
            <p className="text-sm text-muted-foreground">
              Anda akan bergabung sebagai Kontributor di ruang kerja{" "}
              <strong>{slug}</strong>.
            </p>
          </div>
          <Button className="w-full" onClick={handleJoin} disabled={accepting}>
            {accepting && <Spinner />}
            Bergabung Sekarang
          </Button>
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

  // ── Belum login → form registrasi ──

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true)

    const { error: signUpError } = await authClient.signUp.email({
      name: data.nama,
      email: data.email,
      password: data.password,
    })

    if (signUpError) {
      setLoading(false)
      toast.error(signUpError.message ?? "Gagal mendaftar")
      return
    }

    // Simpan slug untuk diproses setelah verifikasi email
    localStorage.setItem("pendingJoinSlug", slug)

    setLoading(false)
    toast.success("Akun berhasil dibuat!", {
      description:
        "Silakan periksa email untuk verifikasi. Setelah itu Anda akan bergabung ke ruang kerja.",
    })
    router.push("/auth/verify-email")
  }

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:w-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium">Bergabung ke ruang kerja</h1>
          <p className="text-sm text-muted-foreground">
            Buat akun untuk bergabung sebagai Kontributor di ruang kerja{" "}
            <strong>{slug}</strong>.
          </p>
        </div>

        <div className="space-y-4">
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
                    <FieldLabel htmlFor="join-nama">Nama Lengkap</FieldLabel>
                    <Input
                      {...field}
                      id="join-nama"
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
                    <FieldLabel htmlFor="join-email">Alamat Email</FieldLabel>
                    <Input
                      {...field}
                      id="join-email"
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
                    <FieldLabel htmlFor="join-password">Kata Sandi</FieldLabel>
                    <Input
                      {...field}
                      id="join-password"
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
                    <FieldLabel htmlFor="join-confirm-password">
                      Konfirmasi Kata Sandi
                    </FieldLabel>
                    <Input
                      {...field}
                      id="join-confirm-password"
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
              Daftar & Bergabung
            </Button>
          </form>
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-4 lg:px-10">
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
