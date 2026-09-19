"use client"
import PageShell from "@/components/layout/PageShell"
import PersuratanComponentForm from "@/components/forms/PersuratanComponentForm"

export default function NewComponentPersuratanPage(){
  return (
    <PageShell title="Buat Component Persuratan" description="Isi nama, atur pengulangan, dan tulis konten." breadcrumbs={[{label:"Persuratan", href:"/components-persuratan"}, {label:"Components", href:"/components-persuratan"}, {label:"Buat"}]}>
      <PersuratanComponentForm mode="create" />
    </PageShell>
  )
}
