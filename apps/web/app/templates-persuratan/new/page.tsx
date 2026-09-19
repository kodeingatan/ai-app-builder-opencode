"use client"
import PageShell from "@/components/layout/PageShell"
import PersuratanTemplateForm from "@/components/forms/PersuratanTemplateForm"

export default function NewTemplatePersuratanPage(){
  return (
    <PageShell title="Buat Template Persuratan" description="Isi nama, deskripsi, dan konten. Klik kanan di editor untuk menyisipkan komponen." breadcrumbs={[{label:"Persuratan"}, {label:"Templates", href:"/templates-persuratan"}, {label:"Buat"}]}>
      <PersuratanTemplateForm mode="create" />
    </PageShell>
  )
}
