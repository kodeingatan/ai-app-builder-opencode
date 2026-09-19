"use client"
import PageShell from "@/components/layout/PageShell"
import AdministrasiForm from "@/components/forms/AdministrasiForm"

export default function NewAdministrasiPage(){
  return (
    <PageShell title="Buat Administrasi Persuratan" description="Isi nama, deskripsi, daftar field, dan tahapan template." breadcrumbs={[{label:"Persuratan"}, {label:"Administrasi", href:"/administrasi-persuratan"}, {label:"Buat"}]}>
      <AdministrasiForm mode="create" />
    </PageShell>
  )
}
