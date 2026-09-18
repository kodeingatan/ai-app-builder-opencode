"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Plus, Users, Pencil, Trash2, X, Eye } from "lucide-react"

export default function EmployeesPage() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name:"", nip:"", position:"", department:"", status:"active", email:"", phone:"" })
  const [detail, setDetail] = useState<any>(null)

  const load = async (p=page,s=search)=>{
    setLoading(true)
    const params=new URLSearchParams({ page:String(p), limit:"10", sortBy:"id", sortOrder:"desc" })
    if(s) params.set("search",s)
    const res=await fetch(`/api/generated/surat-platform/employees?${params}`)
    const json=await res.json()
    setData(json.data??[])
    setTotal(json.total??0)
    setLoading(false)
  }
  useEffect(()=>{ load(1,"") },[])
  const handlePage=(p:number)=>{ setPage(p); load(p, search)}
  const handleSearch=(s:string)=>{ setSearch(s); setPage(1); load(1,s)}

  const openCreate=()=>{ setEditing(null); setForm({ name:"", nip:"", position:"", department:"", status:"active", email:"", phone:""}); setShowModal(true)}
  const openEdit=(row:any)=>{ setEditing(row); setForm({ name:row.name, nip:row.nip, position:row.position, department:row.department||"", status:row.status, email:row.email||"", phone:row.phone||""}); setShowModal(true)}
  const handleSubmit=async()=>{
    const url=editing?`/api/generated/surat-platform/employees/${editing.id}`:`/api/generated/surat-platform/employees`
    const method=editing?"PUT":"POST"
    const res=await fetch(url,{method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(form)})
    if(res.ok){ setShowModal(false); load(page, search)} else alert((await res.json()).message)
  }
  const handleDelete=async(id:number)=>{ if(!confirm("Hapus?")) return; await fetch(`/api/generated/surat-platform/employees/${id}`,{method:"DELETE"}); load(page, search)}

  return (
    <PageShell title="Employees" description="Dataset pegawai untuk demo Repeater & Condition — bisa di-binding via {{employee.name}}, {{employee.nip}}, {{employee.position}}. Field department & status mendukung nested loop & IF." breadcrumbs={[{ label:"Surat Platform", href:"/"},{ label:"Employees"}]} actions={<Button onClick={openCreate}><Plus size={16}/> Tambah Pegawai</Button>}>
      <div className="rounded-[12px] bg-amber-50 border border-amber-200 p-3 text-xs leading-relaxed">
        <span className="font-semibold text-amber-800">Demo Engine:</span> <span className="text-amber-700">Data ini yang di-loop di Repeater <code className="bg-white px-1 rounded border">source: "employees"</code> — tiap item punya <code className="bg-white px-1 rounded border">{"{{employee.name}}"}</code> <code className="bg-white px-1 rounded border">{"{{employee.nip}}"}</code> <code className="bg-white px-1 rounded border">{"{{employee.position}}"}</code> + Condition <code className="bg-white px-1 rounded border">field: "employee.status" operator: "equals" value: "active"</code></span>
      </div>

      <DataTable
        data={data}
        total={total}
        page={page}
        limit={10}
        totalPages={Math.ceil(total/10)}
        onPageChange={handlePage}
        onSearch={handleSearch}
        searchPlaceholder="Cari nama / NIP / jabatan..."
        loading={loading}
        columns={[
          { key:"name", header:"Nama", render:(r)=><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-[#0075de]/10 flex items-center justify-center text-[#0075de] text-xs font-bold">{r.name.charAt(0)}</div><div><div className="font-medium text-xs">{r.name}</div><div className="text-[11px] text-[#6b7280]">{r.nip}</div></div></div> },
          { key:"position", header:"Jabatan", render:(r)=><span className="text-xs">{r.position}</span> },
          { key:"department", header:"Departemen", render:(r)=><span className="text-xs text-[#6b7280]">{r.department||"-"}</span> },
          { key:"status", header:"Status", render:(r)=><Badge variant={r.status==="active"?"success":r.status==="leave"?"warning":"destructive"}>{r.status}</Badge> },
          { key:"email", header:"Kontak", render:(r)=><div className="text-xs"><div>{r.email||"-"}</div><div className="text-[11px] text-[#6b7280]">{r.phone||""}</div></div> },
          { key:"actions", header:"Aksi", render:(r)=><div className="flex items-center gap-1"><button onClick={()=>setDetail(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]"><Eye size={14}/></button><button onClick={()=>openEdit(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]"><Pencil size={14}/></button><button onClick={()=>handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={14}/></button></div> },
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setShowModal(false)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-lg shadow-xl">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between"><div className="font-semibold text-sm">{editing?"Edit":"Tambah"} Pegawai</div><button onClick={()=>setShowModal(false)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16}/></button></div>
            <div className="p-6 space-y-4">
              <div><Label>Nama</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Afdal" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>NIP</Label><Input value={form.nip} onChange={e=>setForm({...form,nip:e.target.value})} placeholder="199001012015031001" /></div>
                <div><Label>Status</Label><Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">active</option><option value="inactive">inactive</option><option value="leave">leave</option></Select></div>
              </div>
              <div><Label>Jabatan</Label><Input value={form.position} onChange={e=>setForm({...form,position:e.target.value})} placeholder="Programmer" /></div>
              <div><Label>Departemen</Label><Input value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="Bidang TI" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="afdal@kantor.go.id" /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0812..." /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setShowModal(false)}>Batal</Button><Button onClick={handleSubmit}>Simpan</Button></div>
            </div>
          </div>
        </div>
      )}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetail(null)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-lg shadow-xl">
            <div className="border-b p-4 flex items-center justify-between"><div className="font-semibold text-sm">{detail.name}</div><button onClick={()=>setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16}/></button></div>
            <div className="p-6">
              <div className="detail-view">
                <div className="detail-field"><span className="detail-label">NIP / Jabatan</span><span className="detail-value">{detail.nip} — {detail.position}</span></div>
                <div className="detail-field"><span className="detail-label">Departemen / Status</span><span className="detail-value">{detail.department} • {detail.status}</span></div>
                <div className="detail-field"><span className="detail-label">Kontak</span><span className="detail-value">{detail.email} • {detail.phone}</span></div>
              </div>
              <div className="mt-4 p-3 bg-[#f6f5f4] rounded-[8px] text-xs font-mono">
                Binding: {"{{employee.name}}"} = {detail.name}<br/>{"{{employee.nip}}"} = {detail.nip}<br/>{"{{employee.position}}"} = {detail.position}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
