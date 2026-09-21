"use client"
import PageShell from "@/components/layout/PageShell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Table, Database, Eye, Search, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export default function DynIndexPage(){
  const [tables,setTables]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    fetch("/api/global-tables?limit=100").then(r=>r.json()).then(j=>{
      setTables(j.data??[])
      setLoading(false)
    })
  },[])
  return (
    <PageShell title="Browse Hasil Generated Global Tabel" description="Menu item baru otomatis untuk setiap tabel dyn_* — klik untuk browse data dengan searching/options/orders." breadcrumbs={[{label:"Dyn"}]} actions={<Link href="/global-tables"><Button><Table size={14}/> Kelola Tabel</Button></Link>}>
      {loading ? <div className="text-[13px] text-[#6b7280] p-4 text-center">Loading...</div> : tables.length===0 ? (
        <Card className="border-dashed"><CardContent className="p-8 text-center"><div className="w-8 h-8 rounded-full bg-[#f6f5f4] flex items-center justify-center mx-auto text-[#9ca3af]"><Table size={14}/></div><div className="font-bold text-[13px] mt-3">Belum ada tabel</div><div className="text-xs text-[#6b7280] mt-1">Buat tabel di Global Tables dulu, lalu akan muncul di sini sebagai menu baru.</div><Link href="/global-tables" className="inline-flex mt-3"><Button>Buat Tabel</Button></Link></CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tables.map(t=>(
            <Link key={t.id} href={`/dyn/${t.name}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-[8px] bg-[#0075de] flex items-center justify-center text-white"><Database size={14}/></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13px] truncate">{t.displayName}</div>
                      <div className="text-xs font-mono text-[#6b7280]">dyn_{t.name}</div>
                    </div>
                    <ArrowRight size={14} className="text-[#9ca3af] group-hover:text-[#0075de]" />
                  </div>
                  <div className="text-xs text-[#6b7280] line-clamp-2">{t.description||"No description"}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[11px]">{t._columnCount} kolom</Badge>
                    <Badge variant="outline" className="text-[11px]">{t._rowCount} rows</Badge>
                    <span className="ml-auto text-[11px] text-[#6b7280]">Browse →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="bg-[#111] text-white">
        <CardContent className="p-3">
          <div className="flex items-center gap-3"><Sparkles size={14} className="text-[#62aef0]"/><span className="font-bold text-[13px]">Cara kerja Hasil Generated</span></div>
          <div className="text-xs text-white/70 mt-2 leading-relaxed">
            Setiap buat tabel di <code className="bg-white/10 px-1 rounded">/global-tables</code> → otomatis buat physical table <code className="bg-white/10 px-1 rounded">dyn_nama</code> + menu item di sini. 
            Browse menyediakan searching (hanya kolom yang di-check searching), options (pilih kolom tampil), dan ordering (hanya kolom yang di-check orderable).
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
