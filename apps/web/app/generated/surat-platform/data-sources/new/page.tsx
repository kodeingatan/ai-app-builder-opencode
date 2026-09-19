"use client"
import PageShell from "@/components/layout/PageShell"
import GeneratedDataSourceForm from "@/components/forms/generated/GeneratedDataSourceForm"

export default function NewDataSourcePage(){
  return (
    <PageShell title="Tambah Data Source" breadcrumbs={[{label:"Surat Platform", href:"/"},{label:"Data Sources", href:"/generated/surat-platform/data-sources"}, {label:"Baru"}]}>
      <GeneratedDataSourceForm mode="create" />
    </PageShell>
  )
}
