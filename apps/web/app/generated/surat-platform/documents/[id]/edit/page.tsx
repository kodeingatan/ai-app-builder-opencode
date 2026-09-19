"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import GeneratedDocumentForm from "@/components/forms/generated/GeneratedDocumentForm"

export default function EditDocumentPage(){
  const params = useParams() as { id: string }
  return (
    <PageShell title="Edit Dokumen" breadcrumbs={[{label:"Surat Platform", href:"/"},{label:"Documents", href:"/generated/surat-platform/documents"}, {label:`Edit #${params.id}`} ]}>
      <GeneratedDocumentForm mode="edit" id={params.id} />
    </PageShell>
  )
}
