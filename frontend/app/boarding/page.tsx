"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Plug,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperNext,
  StepperPrev,
  type StepperProps,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/eden-client"

// ─── Schema ───────────────────────────────────────────────

const formSchema = z.object({
  workspaceName: z.string().min(2, "Nama ruang kerja minimal 2 karakter"),
  workspaceSlug: z
    .string()
    .min(2, "Username minimal 2 karakter")
    .regex(/^[a-z0-9-]+$/, "Hanya boleh huruf kecil, angka, dan tanda strip"),
  wpSiteUrl: z.string().optional(),
  wpUsername: z.string().optional(),
  wpAppPassword: z.string().optional(),
})

type FormSchema = z.infer<typeof formSchema>

// ─── Slug Helper ──────────────────────────────────────────

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

// ─── Steps ────────────────────────────────────────────────

const steps = [
  {
    value: "workspace",
    title: "Ruang Kerja",
    description: "Buat ruang kerja baru",
  },
  {
    value: "wordpress",
    title: "WordPress",
    description: "Hubungkan ke WordPress",
  },
  {
    value: "review",
    title: "Review",
    description: "Periksa kembali pengaturan",
  },
]

// ─── Page ─────────────────────────────────────────────────

export default function BoardingPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [step, setStep] = React.useState("workspace")
  const [wpStatus, setWpStatus] = React.useState<
    "idle" | "testing" | "success" | "failed" | "skipped"
  >("idle")
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false)

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workspaceName: "",
      workspaceSlug: "",
      wpSiteUrl: "",
      wpUsername: "",
      wpAppPassword: "",
    },
  })

  const stepIndex = steps.findIndex((s) => s.value === step)

  // Auto-generate slug from workspace name
  const watchName = form.watch("workspaceName")
  React.useEffect(() => {
    if (!slugManuallyEdited && watchName) {
      form.setValue("workspaceSlug", toSlug(watchName))
    }
  }, [watchName, slugManuallyEdited, form])

  // Redirect if not authenticated or email not verified
  React.useEffect(() => {
    if (isPending) return
    if (!session) router.push("/auth/signin")
    else if (!session.user.emailVerified) router.push("/auth/verify-email")
  }, [session, isPending, router])

  // ponytail: useCallback must be before early returns (rules-of-hooks)
  const onValidate: NonNullable<StepperProps["onValidate"]> = React.useCallback(
    async (value, direction) => {
      if (direction === "prev") return true
      if (value === "wordpress") {
        const valid = await form.trigger(["workspaceName", "workspaceSlug"])
        if (!valid) toast.info("Lengkapi semua field yang wajib diisi")
        return valid
      }
      if (value === "review") {
        if (wpStatus === "skipped") return true
        if (wpStatus === "success") return true
        toast.info(
          "Uji koneksi WordPress terlebih dahulu, atau lewati langkah ini"
        )
        return false
      }
      return true
    },
    [form, wpStatus]
  )

  if (isPending) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </main>
    )
  }

  if (!session) return null

  // ── Uji Koneksi ────────────────────────────────────────

  function handleTestConnection() {
    const wpSiteUrl = form.getValues("wpSiteUrl")
    const wpUser = form.getValues("wpUsername")
    const wpPass = form.getValues("wpAppPassword")

    if (!wpSiteUrl) {
      toast.error("Isi Site URL WordPress")
      return
    }
    if (!wpUser || !wpPass) {
      toast.error("Isi username dan Application Password WordPress")
      return
    }

    setWpStatus("testing")

    api.api.connections.wordpress.test
      .post({ siteUrl: wpSiteUrl, username: wpUser, appPassword: wpPass })
      .then(({ data, error: wpError }) => {
        if (wpError) {
          setWpStatus("failed")
          const errMsg =
            wpError && typeof wpError === "object" && "value" in wpError
              ? ((wpError as any).value?.message ??
                (wpError as any).value?.toString() ??
                "Gagal terhubung ke WordPress")
              : "Gagal terhubung ke WordPress"
          toast.error(errMsg)
          return
        }
        if (!data?.success) {
          setWpStatus("failed")
          toast.error((data as any)?.message ?? "Gagal terhubung ke WordPress")
          return
        }
        setWpStatus("success")
        toast.success("Koneksi ke WordPress berhasil!")
      })
      .catch(() => {
        setWpStatus("failed")
        toast.error("Gagal terhubung ke WordPress")
      })
  }

  function handleSkipWp() {
    setWpStatus("skipped")
    setStep("review")
  }

  // ── Submit ──────────────────────────────────────────────

  async function onSubmit(data: FormSchema) {
    const { data: org, error } = await authClient.organization.create({
      name: data.workspaceName,
      slug: data.workspaceSlug,
      metadata: {},
    })
    if (error || !org) {
      toast.error(error?.message ?? "Gagal membuat ruang kerja")
      return
    }

    await authClient.organization.setActive({ organizationId: org.id })

    if (wpStatus === "success") {
      const wpSiteUrl = form.getValues("wpSiteUrl")
      const wpUser = form.getValues("wpUsername")
      const wpPass = form.getValues("wpAppPassword")
      await api.api.orgs({ slug: data.workspaceSlug }).connections.post({
        type: "wordpress",
        config: { siteUrl: wpSiteUrl, username: wpUser, appPassword: wpPass },
        status: "connected",
      })
    }

    toast.success("Ruang kerja berhasil dibuat!", {
      description: "Mengarahkan ke dashboard...",
    })
    window.location.href = "/orgs/" + data.workspaceSlug + "/dashboard"
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-16">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-medium">Siapkan Ruang Kerja</h1>
          <p className="text-sm text-muted-foreground">
            Beberapa langkah untuk memulai Kreatur
          </p>
        </div>

        <Stepper value={step} onValueChange={setStep} onValidate={onValidate}>
          <StepperList>
            {steps.map((s) => (
              <StepperItem key={s.value} value={s.value}>
                <StepperTrigger>
                  <StepperIndicator />
                  <div className="flex flex-col gap-px">
                    <StepperTitle>{s.title}</StepperTitle>
                    <StepperDescription>{s.description}</StepperDescription>
                  </div>
                </StepperTrigger>
                <StepperSeparator className="mx-4" />
              </StepperItem>
            ))}
          </StepperList>

          {/* ── Step 1: Ruang Kerja ─────────────────────── */}
          <StepperContent value="workspace">
            <div className="flex flex-col gap-4">
              <Controller
                control={form.control}
                name="workspaceName"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ws-name">Nama Ruang Kerja</FieldLabel>
                    <Input
                      {...field}
                      id="ws-name"
                      placeholder="Mis: Media OnlineKu"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Nama organisasi atau media Anda.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="workspaceSlug"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ws-slug">
                      Username Organisasi
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        /orgs/
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        id="ws-slug"
                        placeholder="media-onlineku"
                        onChange={(e) => {
                          setSlugManuallyEdited(true)
                          field.onChange(e)
                        }}
                        aria-invalid={fieldState.invalid}
                      />
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </StepperContent>

          {/* ── Step 2: WordPress ──────────────────────── */}
          <StepperContent value="wordpress">
            <div className="flex flex-col gap-4">
              <Controller
                control={form.control}
                name="wpSiteUrl"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="wp-site-url">
                      Alamat situs WordPress Anda
                    </FieldLabel>
                    <Input
                      {...field}
                      id="wp-site-url"
                      type="url"
                      placeholder="https://contoh.com"
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
                name="wpUsername"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="wp-user">
                      Username WordPress
                    </FieldLabel>
                    <Input
                      {...field}
                      id="wp-user"
                      placeholder="admin"
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
                name="wpAppPassword"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="wp-pass">
                      Application Password
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        id="wp-pass"
                        type="password"
                        placeholder="xxxx xxxx xxxx xxxx"
                        aria-invalid={fieldState.invalid}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="button"
                          variant="secondary"
                          disabled={wpStatus === "testing"}
                          onClick={handleTestConnection}
                        >
                          {wpStatus === "testing" ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />{" "}
                              Mengecek
                            </>
                          ) : (
                            <>
                              <Plug className="size-4" /> Uji Koneksi
                            </>
                          )}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      Buat di WordPress → Users → Application Passwords.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {wpStatus === "success" && (
                <Alert className="border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-50">
                  <CheckCircle2 />
                  <AlertTitle>Koneksi berhasil</AlertTitle>
                  <AlertDescription>
                    WordPress terhubung sebagai {form.watch("wpUsername")}.
                  </AlertDescription>
                </Alert>
              )}
              {wpStatus === "failed" && (
                <Alert variant="destructive">
                  <AlertTriangle />
                  <AlertTitle>Koneksi gagal</AlertTitle>
                  <AlertDescription>
                    Tidak dapat terhubung ke WordPress. Periksa kembali Site
                    URL, username, dan Application Password.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </StepperContent>

          {/* ── Step 3: Review ─────────────────────────── */}
          <StepperContent value="review">
            <div className="flex flex-col gap-4">
              <Alert className="border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-50">
                <CheckCircle2 />
                <AlertTitle>Semua sudah siap!</AlertTitle>
                <AlertDescription>
                  Periksa kembali pengaturan di bawah, lalu lanjutkan ke
                  dashboard.
                </AlertDescription>
              </Alert>

              {/* Workspace Card */}
              <Card
                role="button"
                tabIndex={0}
                className="cursor-pointer py-0"
                size="sm"
                onClick={() => setStep("workspace")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setStep("workspace")
                  }
                }}
              >
                <div className="flex items-start gap-3 p-(--card-spacing)">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Building2 className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>Ruang Kerja</CardTitle>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400">
                        <CheckCircle2 className="size-3" />
                        Selesai
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm">{form.watch("workspaceName")}</p>
                      <CardDescription>
                        /orgs/{form.watch("workspaceSlug")}/dashboard
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </Card>

              {/* WordPress Card */}
              <Card
                role="button"
                tabIndex={0}
                className="cursor-pointer py-0"
                size="sm"
                onClick={() => setStep("wordpress")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setStep("wordpress")
                  }
                }}
              >
                <div className="flex items-start gap-3 p-(--card-spacing)">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Globe className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>WordPress</CardTitle>
                      {wpStatus === "skipped" ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Dilewati
                        </span>
                      ) : wpStatus === "success" ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400">
                          <CheckCircle2 className="size-3" />
                          Terhubung
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                          Belum diatur
                        </span>
                      )}
                    </div>
                    {wpStatus === "success" ? (
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm">{form.watch("wpSiteUrl")}</p>
                        <CardDescription className="flex items-center gap-1.5 text-teal-600">
                          <CheckCircle2 className="size-3" />
                          Terhubung sebagai {form.watch("wpUsername")}
                        </CardDescription>
                      </div>
                    ) : wpStatus === "skipped" ? (
                      <CardDescription>
                        Dapat diatur nanti di halaman Pengaturan.
                      </CardDescription>
                    ) : (
                      <CardDescription>
                        Belum mengatur koneksi WordPress.
                      </CardDescription>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </StepperContent>

          {/* ── Navigation Buttons ─────────────────────── */}
          <div className="flex items-center justify-between">
            {stepIndex > 0 ? (
              <StepperPrev asChild>
                <Button variant="outline">Sebelumnya</Button>
              </StepperPrev>
            ) : (
              <div className="w-12" />
            )}

            <div className="text-sm text-muted-foreground">
              Langkah {stepIndex + 1} dari {steps.length}
            </div>

            {stepIndex === steps.length - 1 ? (
              <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
                Lanjutkan ke Dashboard
                <ArrowRight className="size-4" />
              </Button>
            ) : step === "wordpress" ? (
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={handleSkipWp}>
                  Lewati
                </Button>
                <StepperNext asChild>
                  <Button disabled={wpStatus !== "success"}>Lanjutkan</Button>
                </StepperNext>
              </div>
            ) : (
              <StepperNext asChild>
                <Button>Selanjutnya</Button>
              </StepperNext>
            )}
          </div>
        </Stepper>
      </div>
    </main>
  )
}
