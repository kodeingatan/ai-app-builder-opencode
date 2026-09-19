"use client"
import PageShell from "@/components/layout/PageShell"
import HasilPersuratanForm from "@/components/forms/HasilPersuratanForm"
import { Suspense } from "react"

function NewInner(){
  return <HasilPersuratanForm mode="create" />
}

export default function NewHasilPersuratanPage(){
  return (
    <PageShell title="Buat Persuratan" description="Lengkapi data, buat tahapan baru dengan memilih template, dan isi data template." breadcrumbs={[{label:"Persuratan"}, {label:"Hasil", href:"/hasil-persuratan"}, {label:"Buat"}]}>
      <Suspense fallback={<div className="p-8 text-center text-sm text-[#6b7280]">Loading...</div>}>
        <NewInner/>
      </Suspense>
    </PageShell>
  )
}
