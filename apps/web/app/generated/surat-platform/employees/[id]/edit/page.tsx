"use client"
import { useParams } from "next/navigation"
import PageShell from "@/components/layout/PageShell"
import GeneratedEmployeeForm from "@/components/forms/generated/GeneratedEmployeeForm"

export default function EditEmployeePage(){
  const params = useParams() as { id: string }
  return (
    <PageShell title="Edit Pegawai" breadcrumbs={[{label:"Surat Platform", href:"/"},{label:"Employees", href:"/generated/surat-platform/employees"}, {label:`Edit #${params.id}`} ]}>
      <GeneratedEmployeeForm mode="edit" id={params.id} />
    </PageShell>
  )
}
