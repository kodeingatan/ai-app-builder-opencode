"use client"
import PageShell from "@/components/layout/PageShell"
import GeneratedEmployeeForm from "@/components/forms/generated/GeneratedEmployeeForm"

export default function NewEmployeePage(){
  return (
    <PageShell title="Tambah Pegawai" breadcrumbs={[{label:"Surat Platform", href:"/"},{label:"Employees", href:"/generated/surat-platform/employees"}, {label:"Baru"}]}>
      <GeneratedEmployeeForm mode="create" />
    </PageShell>
  )
}
