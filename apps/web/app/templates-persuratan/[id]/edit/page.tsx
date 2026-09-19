"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import PersuratanTemplateForm from "@/components/forms/PersuratanTemplateForm"

export default function EditTemplatePersuratanPage(){
  const params = useParams() as { id: string }
  return (
    <PageShell title="Edit Template Persuratan" description="Perbarui template persuratan." breadcrumbs={[{label:"Persuratan"}, {label:"Templates", href:"/templates-persuratan"}, {label:`Edit #${params.id}`} ]}>
      <PersuratanTemplateForm mode="edit" id={params.id} />
    </PageShell>
  )
}
