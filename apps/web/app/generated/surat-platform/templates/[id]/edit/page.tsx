"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import GeneratedTemplateForm from "@/components/forms/generated/GeneratedTemplateForm"

export default function EditTemplatePage(){
  const params = useParams() as { id: string }
  return (
    <PageShell title="Edit Template" breadcrumbs={[{label:"Surat Platform", href:"/"},{label:"Templates", href:"/generated/surat-platform/templates"}, {label:`Edit #${params.id}`} ]}>
      <GeneratedTemplateForm mode="edit" id={params.id} />
    </PageShell>
  )
}
