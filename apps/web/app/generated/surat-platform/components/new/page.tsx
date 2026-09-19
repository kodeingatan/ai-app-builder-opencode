"use client"
import PageShell from "@/components/layout/PageShell"
import GeneratedComponentForm from "@/components/forms/generated/GeneratedComponentForm"

export default function NewComponentPage(){
  return (
    <PageShell title="Tambah Component" breadcrumbs={[{label:"Surat Platform", href:"/"},{label:"Components", href:"/generated/surat-platform/components"}, {label:"Baru"}]}>
      <GeneratedComponentForm mode="create" />
    </PageShell>
  )
}
