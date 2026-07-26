"use client";

import { Check, Circle, InfoIcon, Save } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Spinner } from "@/components/ui/spinner";

const TipTapEditor = dynamic(
	() => import("@/components/tiptap-editor").then((mod) => mod.TipTapEditor),
	{
		ssr: false,
		loading: () => (
			<div className="flex min-h-[250px] items-center justify-center rounded-lg border border-input">
				<span className="text-sm text-muted-foreground">Memuat editor…</span>
			</div>
		),
	},
);

import { api } from "@/lib/eden-client";
import { getErrorMessage } from "@/lib/utils";

interface Category {
	id: string;
	name: string;
	slug: string;
	color: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

const QUALITY_ITEMS = [
	{ key: "judul", label: "Judul artikel diisi" },
	{ key: "kategori", label: "Kategori dipilih" },
	{ key: "wordCount", label: "Jumlah kata 500–1000" },
	{ key: "konten", label: "Konten artikel ditulis" },
	{ key: "cover", label: "Cover gambar diisi" },
] as const;

export default function NewArticlePage() {
	const router = useRouter();
	const params = useParams<{ slug: string }>();
	const slug = params.slug;

	const [title, setTitle] = React.useState("");
	const [categoryId, setCategoryId] = React.useState("");
	const [coverImageUrl, setCoverImageUrl] = React.useState("");
	const [content, setContent] = React.useState("");
	const [categories, setCategories] = React.useState<Category[]>([]);
	const [saving, setSaving] = React.useState(false);

	// Fetch categories on mount
	React.useEffect(() => {
		api.api
			.orgs({ slug })
			.categories.get({ query: { pageSize: "100" } })
			.then(({ data }) => {
				if (data?.success && Array.isArray(data.data)) {
					setCategories(data.data);
				}
			});
	}, [slug]);

	// Word count
	const wordCount = React.useMemo(() => {
		const text = content.replace(/<[^>]*>/g, "");
		const words = text.trim() ? text.trim().split(/\s+/).length : 0;
		return words;
	}, [content]);

	const isCoverUrlPresent = coverImageUrl.trim().length > 0;
	const isCoverUrlValid = isCoverUrlPresent && isValidUrl(coverImageUrl);

	// Quality checklist
	const checklist = React.useMemo(() => {
		const hasContent = content.replace(/<[^>]*>/g, "").trim().length > 0;
		return {
			judul: title.trim().length > 0,
			kategori: categoryId.length > 0,
			wordCount: wordCount >= 500 && wordCount <= 1000,
			konten: hasContent,
			cover: isCoverUrlValid,
		};
	}, [title, categoryId, wordCount, isCoverUrlValid, content]);

	const checkedCount = Object.values(checklist).filter(Boolean).length;

	function handleSave() {
		if (!title.trim()) {
			toast.error("Judul artikel harus diisi");
			return;
		}

		setSaving(true);

		const slugified = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		api.api
			.orgs({ slug })
			.articles.post({
				title: title.trim(),
				slug: slugified,
				content,
				categoryId: categoryId || undefined,
			})
			.then(({ data, error }) => {
				if (error || !data?.success) {
					toast.error(getErrorMessage(error) ?? "Gagal menyimpan artikel");
					setSaving(false);
					return;
				}
				toast.success("Artikel berhasil dibuat!");
				router.push(`/orgs/${slug}/articles`);
				router.refresh();
			})
			.catch(() => {
				toast.error("Gagal menyimpan artikel");
				setSaving(false);
			});
	}

	return (
		<div className="@container/main space-y-6">
			{/* ── Header ─────────────────────────────────────── */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="space-y-1">
					<h1 className="text-2xl font-medium">Artikel Baru</h1>
					<p className="text-sm text-muted-foreground">
						Buat artikel baru untuk ruang kerja ini.
					</p>
				</div>
				<Button onClick={handleSave} disabled={saving}>
					{saving ? (
						<Spinner data-icon="inline-start" />
					) : (
						<Save data-icon="inline-start" />
					)}
					Simpan
				</Button>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* ── Left: Form ────────────────────────────────── */}
				<div className="space-y-6 lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Konten Artikel</CardTitle>
							<CardDescription>
								Tulis judul dan konten artikel Anda
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Field>
								<FieldLabel htmlFor="new-title">Judul Artikel</FieldLabel>
								<Input
									id="new-title"
									placeholder="Masukkan judul artikel..."
									value={title}
									onChange={(e) => setTitle(e.target.value)}
								/>
							</Field>

							<div className="flex gap-4">
								<Field
									className="flex-1"
									data-invalid={
										isCoverUrlPresent && !isCoverUrlValid ? "true" : undefined
									}
								>
									<FieldLabel htmlFor="new-cover">URL Gambar Cover</FieldLabel>
									<Input
										id="new-cover"
										placeholder="https://contoh.com/gambar.jpg"
										value={coverImageUrl}
										onChange={(e) => setCoverImageUrl(e.target.value)}
										aria-invalid={
											(isCoverUrlPresent && !isCoverUrlValid) || undefined
										}
									/>
								</Field>
								<Field className="flex-1">
									<FieldLabel htmlFor="new-category">Kategori</FieldLabel>
									<Select value={categoryId} onValueChange={setCategoryId}>
										<SelectTrigger id="new-category" className="w-full">
											<SelectValue placeholder="Pilih kategori..." />
										</SelectTrigger>
										<SelectContent>
											{categories.map((cat) => (
												<SelectItem key={cat.id} value={cat.id}>
													<span className="flex items-center gap-2">
														<span
															className="inline-block size-2.5 rounded-full"
															style={{ backgroundColor: cat.color }}
														/>
														{cat.name}
													</span>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							</div>

							<div>
								<FieldLabel className="mb-2 block">Konten</FieldLabel>
								<TipTapEditor
									content={content}
									onChange={setContent}
									editable
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* ── Right: Metadata & Checklist ──────────────── */}
				<div className="space-y-4">
					{/* Quality Checklist */}
					<Card>
						<CardHeader>
							<CardTitle>Cek Kualitas</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="text-sm text-muted-foreground">
								{checkedCount} dari {QUALITY_ITEMS.length} terpenuhi
							</div>
							<Progress value={(checkedCount / QUALITY_ITEMS.length) * 100} />
							<ul className="mt-3 space-y-1.5">
								{QUALITY_ITEMS.map((item) => {
									const done = checklist[item.key as keyof typeof checklist];
									const Icon = done ? Check : Circle;
									return (
										<li
											key={item.key}
											className="flex items-center gap-2 text-sm"
										>
											<Icon
												className={
													done ? "text-primary" : "text-muted-foreground"
												}
											/>
											<span
												className={
													done ? "text-foreground" : "text-muted-foreground"
												}
											>
												{item.label}
											</span>
										</li>
									);
								})}
							</ul>
						</CardContent>
					</Card>

					{/* Panduan Penulisan */}
					<Card>
						<CardHeader>
							<CardTitle>Panduan Penulisan</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<ul className="flex flex-col gap-1 text-sm text-muted-foreground">
									<li className="flex items-start gap-1.5">
										<InfoIcon className="mt-1 size-3 shrink-0" />
										<span>Judul jelas dan mencerminkan isi</span>
									</li>
									<li className="flex items-start gap-1.5">
										<InfoIcon className="mt-1 size-3 shrink-0" />
										<span>Kategori sesuai dengan topik</span>
									</li>
									<li className="flex items-start gap-1.5">
										<InfoIcon className="mt-1 size-3 shrink-0" />
										<span>500–1000 kata</span>
									</li>
									<li className="flex items-start gap-1.5">
										<InfoIcon className="mt-1 size-3 shrink-0" />
										<span>Konten orisinal dan bebas plagiarisme</span>
									</li>
									<li className="flex items-start gap-1.5">
										<InfoIcon className="mt-1 size-3 shrink-0" />
										<span>Menggunakan bahasa Indonesia yang baik</span>
									</li>
									<li className="flex items-start gap-1.5">
										<InfoIcon className="mt-1 size-3 shrink-0" />
										<span>Menyertakan sumber referensi jika ada</span>
									</li>
									<li className="flex items-start gap-1.5">
										<InfoIcon className="mt-1 size-3 shrink-0" />
										<span>Cover gambar menarik dan relevan</span>
									</li>
									<li className="flex items-start gap-1.5">
										<InfoIcon className="mt-1 size-3 shrink-0" />
										<span>Paragraf pembuka yang engaging</span>
									</li>
									<li className="flex items-start gap-1.5">
										<InfoIcon className="mt-1 size-3 shrink-0" />
										<span>Tidak mengandung SARA atau hoaks</span>
									</li>
									<li className="flex items-start gap-1.5">
										<InfoIcon className="mt-1 size-3 shrink-0" />
										<span>Mengikuti pedoman gaya penulisan</span>
									</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
