"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import PersuratanComponentForm from "@/components/forms/PersuratanComponentForm"

export default function EditComponentPersuratanPage(){
  const params = useParams() as { id: string }
  return (
    <PageShell title="Edit Component Persuratan" description="Perbarui component persuratan." breadcrumbs={[{label:"Persuratan"}, {label:"Components", href:"/components-persuratan"}, {label:`Edit #${params.id}`} ]}>
      <PersuratanComponentForm mode="edit" id={params.id} />
    </PageShell>
  )
}
