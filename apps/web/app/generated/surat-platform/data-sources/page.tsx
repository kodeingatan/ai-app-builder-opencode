"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Plus, Database, Pencil, Trash2, X, Eye } from "lucide-react"

export default function DataSourcesPage() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: "", type: "entity", entity: "", config_json: "", description: "" })
  const [detail, setDetail] = useState<any>(null)

  const load = async (p = page, s = search) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: "10", sortBy: "id", sortOrder: "desc" })
    if (s) params.set("search", s)
    const res = await fetch(`/api/generated/surat-platform/data-sources?${params}`)
    const json = await res.json()
    setData(json.data ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }
  useEffect(() => { load(1,"") }, [])
  const handlePage = (p:number)=>{ setPage(p); load(p, search)}
  const handleSearch = (s:string)=>{ setSearch(s); setPage(1); load(1,s)}

  const openCreate = () => { setEditing(null); setForm({ name:"", type:"entity", entity:"", config_json:"", description:"" }); setShowModal(true)}
  const openEdit = (row:any)=>{ setEditing(row); setForm({ name:row.name, type:row.type, entity:row.entity||"", config_json:row.config_json||"", description:row.description||""}); setShowModal(true)}
  const handleSubmit = async()=>{
    const payload=form
    const url=editing?`/api/generated/surat-platform/data-sources/${editing.id}`:`/api/generated/surat-platform/data-sources`
    const method=editing?"PUT":"POST"
    const res=await fetch(url,{method, headers:{ "Content-Type":"application/json"}, body: JSON.stringify(payload)})
    if(res.ok){ setShowModal(false); load(page, search)} else alert((await res.json()).message)
  }
  const handleDelete=async(id:number)=>{ if(!confirm("Hapus?")) return; await fetch(`/api/generated/surat-platform/data-sources/${id}`,{method:"DELETE"}); load(page, search)}

  return (
    <PageShell title="Data Sources" description="Layer abstraksi data — Component tidak langsung query DB, melainkan via Data Source (entity / api / custom_query / static) lalu di-binding dengan {{}}." breadcrumbs={[{ label:"Surat Platform", href:"/"},{ label:"Data Sources"}]} actions={<Button onClick={openCreate}><Plus size={16}/> Tambah Data Source</Button>}>
      <DataTable
        data={data}
        total={total}
        page={page}
        limit={10}
        totalPages={Math.ceil(total/10)}
        onPageChange={handlePage}
        onSearch={handleSearch}
        searchPlaceholder="Cari nama / entity..."
        loading={loading}
        columns={[
          { key:"name", header:"Nama", render:(r)=><div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-violet-50 flex items-center justify-center text-violet-600"><Database size={12}/></div><div className="font-medium text-xs">{r.name}</div></div> },
          { key:"type", header:"Tipe", render:(r)=><Badge variant={r.type==="entity"?"success":r.type==="custom_query"?"warning":"secondary"}>{r.type}</Badge> },
          { key:"entity", header:"Entity", render:(r)=><span className="font-mono text-xs bg-[#f6f5f4] px-2 py-1 rounded border">{r.entity||"-"}</span> },
          { key:"description", header:"Deskripsi", render:(r)=><span className="text-xs text-[#6b7280] truncate max-w-[240px] block">{r.description||"-"}</span> },
          { key:"actions", header:"Aksi", render:(r)=><div className="flex items-center gap-1"><button onClick={()=>setDetail(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]"><Eye size={14}/></button><button onClick={()=>openEdit(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]"><Pencil size={14}/></button><button onClick={()=>handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={14}/></button></div> },
        ]}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setShowModal(false)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between"><div className="font-semibold text-sm">{editing?"Edit":"Tambah"} Data Source</div><button onClick={()=>setShowModal(false)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16}/></button></div>
            <div className="p-6 space-y-4">
              <div><Label>Nama</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Employee" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tipe</Label><Select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="entity">entity</option><option value="api">api</option><option value="custom_query">custom_query</option><option value="static">static</option></Select></div>
                <div><Label>Entity</Label><Input value={form.entity} onChange={e=>setForm({...form,entity:e.target.value})} placeholder="employees" /></div>
              </div>
              <div><Label>Config JSON</Label><Textarea className="font-mono text-xs min-h-[120px]" value={form.config_json} onChange={e=>setForm({...form,config_json:e.target.value})} placeholder='{"fields":["name","nip"],"bindingPrefix":"employee"}' /></div>
              <div><Label>Deskripsi</Label><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setShowModal(false)}>Batal</Button><Button onClick={handleSubmit}>Simpan</Button></div>
            </div>
          </div>
        </div>
      )}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setDetail(null)} />
          <div className="relative bg-white rounded-[12px] w-full max-w-xl shadow-xl">
            <div className="border-b p-4 flex items-center justify-between"><div className="font-semibold text-sm">{detail.name}</div><button onClick={()=>setDetail(null)} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16}/></button></div>
            <div className="p-6">
              <div className="detail-view">
                <div className="detail-field"><span className="detail-label">Tipe / Entity</span><span className="detail-value">{detail.type} • {detail.entity}</span></div>
                <div className="detail-field"><span className="detail-label">Config</span><pre className="detail-value bg-[#f6f5f4] p-3 rounded text-xs font-mono overflow-auto">{detail.config_json || "-"}</pre></div>
                <div className="detail-field"><span className="detail-label">Deskripsi</span><span className="detail-value">{detail.description || "-"}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
