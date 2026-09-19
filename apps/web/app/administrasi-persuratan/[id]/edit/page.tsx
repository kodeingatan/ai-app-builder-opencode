"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import AdministrasiForm from "@/components/forms/AdministrasiForm"

export default function EditAdministrasiPage(){
  const params = useParams() as { id: string }
  return (
    <PageShell title="Edit Administrasi Persuratan" description="Perbarui administrasi persuratan." breadcrumbs={[{label:"Persuratan"}, {label:"Administrasi", href:"/administrasi-persuratan"}, {label:`Edit #${params.id}`} ]}>
      <AdministrasiForm mode="edit" id={params.id} />
    </PageShell>
  )
}
