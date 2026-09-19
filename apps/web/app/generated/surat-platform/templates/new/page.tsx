"use client"
import PageShell from "@/components/layout/PageShell"
import GeneratedTemplateForm from "@/components/forms/generated/GeneratedTemplateForm"

export default function NewTemplatePage(){
  return (
    <PageShell title="Tambah Template" description="Buat template baru dengan JSON Tree." breadcrumbs={[{label:"Surat Platform", href:"/"},{label:"Templates", href:"/generated/surat-platform/templates"}, {label:"Baru"}]}>
      <GeneratedTemplateForm mode="create" />
    </PageShell>
  )
}
