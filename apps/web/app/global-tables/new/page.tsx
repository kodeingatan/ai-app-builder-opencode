"use client"
import PageShell from "@/components/layout/PageShell"
import GlobalTableForm from "@/components/forms/GlobalTableForm"

export default function NewGlobalTablePage(){
  return (
    <PageShell title="Buat Tabel Baru" description="Konfigurasi tabel dan kolom — antarmuka visual tanpa kode." breadcrumbs={[{label:"Global Tabel", href:"/global-tables"}, {label:"Baru"}]}>
      <GlobalTableForm mode="create" />
    </PageShell>
  )
}
