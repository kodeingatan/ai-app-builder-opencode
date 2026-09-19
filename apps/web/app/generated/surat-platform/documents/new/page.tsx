"use client"
import PageShell from "@/components/layout/PageShell"
import GeneratedDocumentForm from "@/components/forms/generated/GeneratedDocumentForm"

export default function NewDocumentPage(){
  return (
    <PageShell title="Buat Dokumen" description="Gabungkan template + data JSON." breadcrumbs={[{label:"Surat Platform", href:"/"},{label:"Documents", href:"/generated/surat-platform/documents"}, {label:"Baru"}]}>
      <GeneratedDocumentForm mode="create" />
    </PageShell>
  )
}
