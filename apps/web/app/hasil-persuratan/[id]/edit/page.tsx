"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import HasilPersuratanForm from "@/components/forms/HasilPersuratanForm"
import { Suspense } from "react"

function EditInner({ id }: { id: string }){
  return <HasilPersuratanForm mode="edit" id={id} />
}

export default function EditHasilPersuratanPage(){
  const params = useParams() as { id: string }
  return (
    <PageShell title="Edit Persuratan" description="Perbarui data persuratan." breadcrumbs={[{label:"Persuratan"}, {label:"Hasil", href:"/hasil-persuratan"}, {label:`Edit #${params.id}`} ]}>
      <Suspense fallback={<div className="p-8 text-center text-sm text-[#6b7280]">Loading...</div>}>
        <EditInner id={params.id}/>
      </Suspense>
    </PageShell>
  )
}
