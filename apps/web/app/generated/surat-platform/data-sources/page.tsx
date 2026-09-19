"use client"
import PageShell from "@/components/layout/PageShell"
import DataTable from "@/components/common/DataTable/DataTable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Plus, Database, Pencil, Trash2, X, Eye, Play, Filter, Code } from "lucide-react"
import Link from "next/link"

export default function DataSourcesPage() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [testDept, setTestDept] = useState<string>("Bidang TI")
  const [testResult, setTestResult] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)

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

  const handleTest = async (row:any) => {
    setTestLoading(true)
    setDetail(row)
    try {
      const res = await fetch(`/api/generated/surat-platform/data-sources/${row.id}/resolve?department=${encodeURIComponent(testDept)}`)
      const json = await res.json()
      setTestResult(json)
    } catch (e:any) { setTestResult({ message: e.message }) }
    setTestLoading(false)
  }
  const handleDelete=async(id:number)=>{ if(!confirm("Hapus?")) return; await fetch(`/api/generated/surat-platform/data-sources/${id}`,{method:"DELETE"}); load(page, search)}

  return (
    <PageShell title="Data Sources" description="Layer abstraksi data — Component tidak langsung query DB, melainkan via Data Source (entity / api / custom_query / static) lalu di-binding dengan {{}}." breadcrumbs={[{ label:"Surat Platform", href:"/"},{ label:"Data Sources"}]} actions={<Link href="/generated/surat-platform/data-sources/new"><Button><Plus size={16}/> Tambah Data Source</Button></Link>}>
      <div className="rounded-[12px] bg-violet-50 border border-violet-200 p-4 flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1">
          <div className="text-sm font-bold flex items-center gap-2"><Filter size={16} className="text-violet-600"/> Filter Departemen — Custom Query Demo (additive)</div>
          <div className="text-xs text-[#6b7280] mt-1 leading-relaxed">Engine tidak rebuild. Buat DataSource <code className="bg-white px-1.5 py-0.5 rounded border font-mono text-[11px]">custom_query</code> dengan <code className="bg-white px-1.5 py-0.5 rounded border font-mono text-[11px]">{`{{department}}`}</code> lalu Repeater pakai hasilnya. Coba filter di bawah dan klik <b>Test Resolve</b>.</div>
          <div className="mt-3 flex items-center gap-2">
            <Select value={testDept} onChange={e=>setTestDept(e.target.value)} className="max-w-[200px]">
              <option value="Bidang TI">Bidang TI</option>
              <option value="Hukum">Hukum</option>
              <option value="Sekretariat">Sekretariat</option>
              <option value="Keuangan">Keuangan</option>
              <option value="Umum">Umum</option>
            </Select>
            <span className="text-xs text-[#6b7280]">akan coba resolve data source pertama bertipe custom_query / entity</span>
          </div>
        </div>
        <div className="text-[11px] font-mono bg-white border rounded-[8px] p-3 w-full md:w-[360px]">
          <div className="font-semibold text-violet-800 flex items-center gap-1.5"><Code size={12}/> Example config_json</div>
          <pre className="mt-1 text-xs overflow-auto">{`{
  "query": "SELECT * FROM \"surat_platform_employees\" WHERE department = {{department}}",
  "defaults": { "department": "Bidang TI" }
}`}</pre>
          <div className="mt-2 text-[#6b7280]">GET /api/.../data-sources/{"{id}"}/resolve?department=Bidang%20TI</div>
        </div>
      </div>
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
          { key:"actions", header:"Aksi", render:(r)=><div className="flex items-center gap-1"><button onClick={()=>handleTest(r)} title="Test Resolve dengan filter departemen" className="p-1.5 rounded bg-violet-50 hover:bg-violet-100 text-violet-700"><Play size={14}/></button><button onClick={()=>setDetail(r)} className="p-1.5 rounded hover:bg-[#f6f5f4]"><Eye size={14}/></button><Link href={`/generated/surat-platform/data-sources/${r.id}/edit`} className="p-1.5 rounded hover:bg-[#f6f5f4] inline-flex"><Pencil size={14}/></Link><button onClick={()=>handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={14}/></button></div> },
        ]}
      />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={()=>{ setDetail(null); setTestResult(null)}} />
          <div className="relative bg-white rounded-[12px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between"><div className="font-semibold text-sm">{detail.name} — <span className="text-xs font-normal text-[#6b7280]">{detail.type} • {detail.entity}</span></div><button onClick={()=>{ setDetail(null); setTestResult(null)}} className="p-1.5 hover:bg-[#f6f5f4] rounded"><X size={16}/></button></div>
            <div className="p-6 space-y-4">
              <div className="detail-view">
                <div className="detail-field"><span className="detail-label">Tipe / Entity</span><span className="detail-value">{detail.type} • {detail.entity}</span></div>
                <div className="detail-field"><span className="detail-label">Config</span><pre className="detail-value bg-[#f6f5f4] p-3 rounded text-xs font-mono overflow-auto max-h-[160px]">{detail.config_json || "-"}</pre></div>
                <div className="detail-field"><span className="detail-label">Deskripsi</span><span className="detail-value">{detail.description || "-"}</span></div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-semibold flex items-center gap-2"><Filter size={14} className="text-violet-600"/> Test Resolve — Filter Departemen</div>
                <div className="flex items-center gap-2 mt-3">
                  <Select value={testDept} onChange={e=>setTestDept(e.target.value)}>
                    <option value="Bidang TI">Bidang TI</option>
                    <option value="Hukum">Hukum</option>
                    <option value="Sekretariat">Sekretariat</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="Umum">Umum</option>
                  </Select>
                  <Button size="sm" onClick={()=>handleTest(detail)} disabled={testLoading}><Play size={14}/>{testLoading?"Testing...":"Test Resolve"}</Button>
                  <span className="text-[11px] text-[#6b7280]">GET /resolve?department={testDept}</span>
                </div>
                {testResult && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold">Hasil: {testResult.total ?? testResult.data?.length ?? 0} rows {testResult.resolvedVia ? `via ${testResult.resolvedVia}` : ""}</div>
                    {testResult.sql && <pre className="bg-[#111] text-[#86efac] p-3 rounded-[8px] text-xs font-mono mt-2 overflow-auto">{testResult.sql} -- params: {JSON.stringify(testResult.params)}</pre>}
                    <pre className="bg-[#f6f5f4] border rounded-[8px] p-3 text-xs font-mono mt-2 overflow-auto max-h-[200px]">{JSON.stringify(Array.isArray(testResult.data) ? testResult.data.slice(0,3) : testResult, null, 2)}</pre>
                    {(testResult.data?.length ?? 0) <=3 ? null : <div className="text-[11px] text-[#6b7280] mt-1">… {testResult.data?.length ?? 0} total, menampilkan 3 pertama. Bind di Repeater via <code className="bg-white px-1 rounded border">{"{{item.name}}"}</code></div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
