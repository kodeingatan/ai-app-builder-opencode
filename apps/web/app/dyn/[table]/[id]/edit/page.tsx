"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import DynDataForm from "@/components/forms/DynDataForm"

export default function DynEditPage(){
  const params = useParams() as { table: string; id: string }
  return (
    <PageShell title={`Edit Data — ${params.table} #${params.id}`} description={`Perbarui data dyn_${params.table}`} breadcrumbs={[{label:"Dyn", href:"/dyn"}, {label: params.table, href:`/dyn/${params.table}`}, {label:`Edit #${params.id}`} ]}>
      <DynDataForm tableName={params.table} mode="edit" id={params.id} />
    </PageShell>
  )
}
