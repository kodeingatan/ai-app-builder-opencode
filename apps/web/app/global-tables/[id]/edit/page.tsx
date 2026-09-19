"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import GlobalTableForm from "@/components/forms/GlobalTableForm"

export default function EditGlobalTablePage(){
  const params = useParams() as { id: string }
  return (
    <PageShell title="Edit Tabel" description="Perbarui konfigurasi tabel dan kolom." breadcrumbs={[{label:"Global Tabel", href:"/global-tables"}, {label:"Edit"}]}>
      <GlobalTableForm mode="edit" id={params.id} />
    </PageShell>
  )
}
