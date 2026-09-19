"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import DynDataForm from "@/components/forms/DynDataForm"

export default function DynNewPage(){
  const params = useParams() as { table: string }
  return (
    <PageShell title={`Tambah Data — ${params.table}`} description={`Buat data baru untuk dyn_${params.table}`} breadcrumbs={[{label:"Dyn", href:"/dyn"}, {label: params.table, href:`/dyn/${params.table}`}, {label:"Tambah"}]}>
      <DynDataForm tableName={params.table} mode="create" />
    </PageShell>
  )
}
