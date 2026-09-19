"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import GeneratedDataSourceForm from "@/components/forms/generated/GeneratedDataSourceForm"

export default function EditDataSourcePage(){
  const params = useParams() as { id: string }
  return (
    <PageShell title="Edit Data Source" breadcrumbs={[{label:"Surat Platform", href:"/"},{label:"Data Sources", href:"/generated/surat-platform/data-sources"}, {label:`Edit #${params.id}`} ]}>
      <GeneratedDataSourceForm mode="edit" id={params.id} />
    </PageShell>
  )
}
