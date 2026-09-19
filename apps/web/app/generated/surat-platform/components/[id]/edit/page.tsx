"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import GeneratedComponentForm from "@/components/forms/generated/GeneratedComponentForm"

export default function EditComponentPage(){
  const params = useParams() as { id: string }
  return (
    <PageShell title="Edit Component" breadcrumbs={[{label:"Surat Platform", href:"/"},{label:"Components", href:"/generated/surat-platform/components"}, {label:`Edit #${params.id}`} ]}>
      <GeneratedComponentForm mode="edit" id={params.id} />
    </PageShell>
  )
}
