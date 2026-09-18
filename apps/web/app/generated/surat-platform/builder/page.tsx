"use client"
import PageShell from "@/components/layout/PageShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Save, Eye, Plus, Trash2, Copy, ChevronUp, ChevronDown, Sparkles, Type, Heading1, Pilcrow, Image as ImageIcon, Table, PenTool, Minus, QrCode, Calendar, Repeat, GitBranch, Building2 } from "lucide-react"

type TreeNode = { type: string; props?: Record<string, any>; children?: TreeNode[] }

const componentPalette = [
  { type: "text", label: "Text", icon: Type, category: "basic", defaultProps: { content: "Text", fontSize: 11, align: "left" } },
  { type: "heading", label: "Heading", icon: Heading1, category: "basic", defaultProps: { content: "JUDUL SURAT", fontSize: 14, fontWeight: "bold", align: "center" } },
  { type: "paragraph", label: "Paragraph", icon: Pilcrow, category: "basic", defaultProps: { content: "Menimbang bahwa...", fontSize: 11, align: "justify" } },
  { type: "image", label: "Image / Logo", icon: ImageIcon, category: "basic", defaultProps: { src: "{{office.logo}}", width: 60 } },
  { type: "table", label: "Table", icon: Table, category: "data", defaultProps: { source: "items", columns: ["no","name","qty"] } },
  { type: "signature", label: "Signature", icon: PenTool, category: "branding", defaultProps: { name: "{{signer.name}}", position: "{{signer.position}}", nip: "{{signer.nip}}" } },
  { type: "divider", label: "Divider", icon: Minus, category: "layout", defaultProps: { height: 1, color: "#e5e7eb" } },
  { type: "qrcode", label: "QR Code", icon: QrCode, category: "dynamic", defaultProps: { value: "{{document.qr}}", size: 60 } },
  { type: "date", label: "Date", icon: Calendar, category: "dynamic", defaultProps: { source: "letter.date", format: "DD MMMM YYYY" } },
  { type: "repeater", label: "Repeater / Loop", icon: Repeat, category: "dynamic", defaultProps: { source: "employees", item: "employee" } },
  { type: "condition", label: "Condition / IF", icon: GitBranch, category: "dynamic", defaultProps: { field: "employee.status", operator: "equals", value: "active" } },
  { type: "kop_surat", label: "Kop Surat", icon: Building2, category: "branding", defaultProps: { office: "{{office.name}}", address: "{{office.address}}" } },
]

const initialTree: TreeNode = {
  type: "document",
  children: [
    { type: "header", children: [
      { type: "image", props: { src: "{{office.logo}}", width: 60 } },
      { type: "text", props: { content: "{{office.name}}", fontSize: 16, fontWeight: "bold", align: "center" } },
      { type: "text", props: { content: "{{office.address}}", fontSize: 9, align: "center", color: "#666" } },
      { type: "divider", props: { height: 2, color: "#000" } }
    ]},
    { type: "text", props: { content: "{{letter.number}}", align: "center", fontSize: 10 } },
    { type: "heading", props: { content: "{{letter.title}}", align: "center", fontSize: 14, fontWeight: "bold" } },
    { type: "paragraph", props: { content: "Menimbang bahwa {{letter.consideration}}", fontSize: 11, align: "justify" } },
    { type: "repeater", props: { source: "employees", item: "employee", label: "Daftar Pegawai" }, children: [
      { type: "text", props: { content: "{{index}}. {{employee.name}}", fontWeight: "bold", fontSize: 11 } },
      { type: "text", props: { content: "NIP : {{employee.nip}}", fontSize: 10, indent: 12 } },
      { type: "text", props: { content: "Jabatan : {{employee.position}} — {{employee.department}}", fontSize: 10, indent: 12 } },
      { type: "condition", props: { field: "employee.status", operator: "equals", value: "active" }, children: [
        { type: "text", props: { content: "Status: Aktif", fontSize: 9, color: "#16a34a" } }
      ]},
      { type: "divider", props: { height: 1, color: "#e5e7eb", margin: 8 } }
    ]},
    { type: "signature", props: { name: "{{signer.name}}", position: "{{signer.position}}", nip: "{{signer.nip}}", align: "right" } },
    { type: "footer", children: [
      { type: "text", props: { content: "Dicetak pada {{current_date}} | {{office.name}}", fontSize: 8, align: "center", color: "#999" } },
      { type: "qrcode", props: { value: "{{document.qrValue}}", size: 60, align: "right" } }
    ]}
  ]
}

function findPath(tree: TreeNode, target: TreeNode, path: number[] = []): number[] | null {
  if (tree === target) return path
  if (!tree.children) return null
  for (let i = 0; i < tree.children.length; i++) {
    const res = findPath(tree.children[i], target, [...path, i])
    if (res) return res
  }
  return null
}

function getNodeByPath(tree: TreeNode, path: number[]): TreeNode | null {
  let cur: any = tree
  for (const idx of path) {
    if (!cur.children) return null
    cur = cur.children[idx]
  }
  return cur
}

export default function BuilderPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [tree, setTree] = useState<TreeNode>(initialTree)
  const [selectedPath, setSelectedPath] = useState<number[] | null>(null)
  const [templateMeta, setTemplateMeta] = useState({ name: "Surat Keputusan Baru", code: "SK-NEW", category: "surat_keputusan", description: "Template baru via builder" })
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [previewData, setPreviewData] = useState<string>(JSON.stringify({ letter: { number: "800/001/SK/VI/2026", title: "SURAT KEPUTUSAN", consideration: "perlu diangkat tim baru" }, office: { name: "PEMERINTAH PROVINSI ACEH", address: "Jl. T. Nyak Arief No.219 Banda Aceh", logo: "" }, signer: { name: "Drs. H. Ahmad Yani, M.Si", position: "Kepala Dinas", nip: "196501011990031001" }, employees: [{ name: "Afdal", nip: "199001012015031001", position: "Programmer", department: "Bidang TI", status: "active" }, { name: "Budi Santoso", nip: "198512122010011002", position: "Analis", department: "Hukum", status: "inactive" }, { name: "Citra Dewi", nip: "199205152018022001", position: "Staff", department: "Sekretariat", status: "active" }], current_date: new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric"}) }, null, 2))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/generated/surat-platform/templates?limit=100").then(r=>r.json()).then(j=>setTemplates(j.data??[]))
    handlePreview(initialTree, previewData)
  }, [])

  const handlePreview = async (t: TreeNode, dataStr: string) => {
    try {
      const data = JSON.parse(dataStr)
      const res = await fetch("/api/generated/surat-platform/render", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schema: t, data }) })
      const json = await res.json()
      setPreviewHtml(json.html || "")
    } catch (e: any) { setPreviewHtml(`<div style="color:red; padding:12px;">Error: ${e.message}</div>`) }
  }

  const loadTemplate = (id: string) => {
    setSelectedTemplateId(id)
    const tpl = templates.find(t => String(t.id) === id)
    if (tpl) {
      try { 
        const parsed = JSON.parse(tpl.schema_json)
        setTree(parsed)
        setTemplateMeta({ name: tpl.name, code: tpl.code, category: tpl.category, description: tpl.description || "" })
        handlePreview(parsed, previewData)
      } catch {}
    }
  }

  const selectedNode = selectedPath ? getNodeByPath(tree, selectedPath) : null

  const updateTree = (newTree: TreeNode) => {
    setTree(newTree)
    handlePreview(newTree, previewData)
  }

  const addComponent = (comp: typeof componentPalette[0]) => {
    const newNode: TreeNode = { type: comp.type, props: { ...comp.defaultProps } }
    if (comp.type === "repeater" || comp.type === "condition" || comp.type === "header" || comp.type === "footer") {
      newNode.children = comp.type === "repeater" ? [{ type: "text", props: { content: `{{${comp.defaultProps.item || "item"}.name}}` } }] : []
    }
    let newTree = JSON.parse(JSON.stringify(tree)) as TreeNode
    if (selectedNode && (selectedNode.type === "repeater" || selectedNode.type === "condition" || selectedNode.type === "header" || selectedNode.type === "footer" || selectedNode.type === "document" || selectedNode.type === "section")) {
      if (!selectedNode.children) selectedNode.children = []
      // need to update via path
      if (selectedPath) {
        const target = getNodeByPath(newTree, selectedPath)
        if (target) {
          if (!target.children) target.children = []
          target.children.push(newNode)
        }
      } else {
        if (!newTree.children) newTree.children = []
        newTree.children.push(newNode)
      }
    } else {
      if (!newTree.children) newTree.children = []
      // if selected is leaf, add to parent or root
      if (selectedPath && selectedPath.length > 0) {
        const parentPath = selectedPath.slice(0, -1)
        const parent = parentPath.length === 0 ? newTree : getNodeByPath(newTree, parentPath)
        if (parent && parent.children) {
          const idx = selectedPath[selectedPath.length - 1]
          parent.children.splice(idx + 1, 0, newNode)
        } else {
          newTree.children.push(newNode)
        }
      } else {
        newTree.children.push(newNode)
      }
    }
    updateTree(newTree)
  }

  const updateSelectedProps = (key: string, value: any) => {
    if (!selectedPath || !selectedNode) return
    const newTree = JSON.parse(JSON.stringify(tree)) as TreeNode
    const target = getNodeByPath(newTree, selectedPath)
    if (!target) return
    if (!target.props) target.props = {}
    target.props[key] = value
    updateTree(newTree)
  }

  const deleteSelected = () => {
    if (!selectedPath || selectedPath.length === 0) return
    const newTree = JSON.parse(JSON.stringify(tree)) as TreeNode
    const parentPath = selectedPath.slice(0, -1)
    const idx = selectedPath[selectedPath.length - 1]
    const parent = parentPath.length === 0 ? newTree : getNodeByPath(newTree, parentPath)
    if (parent && parent.children) {
      parent.children.splice(idx, 1)
      setSelectedPath(null)
      updateTree(newTree)
    }
  }

  const moveSelected = (dir: -1 | 1) => {
    if (!selectedPath || selectedPath.length === 0) return
    const newTree = JSON.parse(JSON.stringify(tree)) as TreeNode
    const parentPath = selectedPath.slice(0, -1)
    const idx = selectedPath[selectedPath.length - 1]
    const parent = parentPath.length === 0 ? newTree : getNodeByPath(newTree, parentPath)
    if (!parent || !parent.children) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= parent.children.length) return
    const tmp = parent.children[idx]
    parent.children[idx] = parent.children[newIdx]
    parent.children[newIdx] = tmp
    const newPath = [...parentPath, newIdx]
    setSelectedPath(newPath)
    updateTree(newTree)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      name: templateMeta.name,
      code: templateMeta.code,
      category: templateMeta.category,
      description: templateMeta.description,
      version: 1,
      status: "draft",
      schema_json: JSON.stringify(tree),
      preview_html: previewHtml,
    }
    let url = "/api/generated/surat-platform/templates"
    let method = "POST"
    if (selectedTemplateId) {
      url = `/api/generated/surat-platform/templates/${selectedTemplateId}`
      method = "PUT"
    }
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) {
      alert(selectedTemplateId ? "Template diperbarui!" : "Template disimpan! Cek di menu Templates")
      const j = await res.json()
      if (!selectedTemplateId && j.id) setSelectedTemplateId(String(j.id))
      fetch("/api/generated/surat-platform/templates?limit=100").then(r=>r.json()).then(j=>setTemplates(j.data??[]))
    } else alert("Gagal: " + (await res.json()).message)
  }

  const renderTreeNode = (node: TreeNode, path: number[], depth = 0) => {
    const isSelected = selectedPath && selectedPath.length === path.length && selectedPath.every((v,i)=>v===path[i])
    const hasChildren = !!(node.children && node.children.length)
    const bg = node.type === "repeater" ? "bg-amber-50 border-amber-200" : node.type === "condition" ? "bg-violet-50 border-violet-200" : node.type === "header" || node.type === "footer" ? "bg-[#0075de]/5 border-[#0075de]/20" : "bg-white border-[#e6e6e6]"
    return (
      <div key={path.join("-")} className="space-y-1">
        <div
          onClick={() => setSelectedPath(path)}
          className={`group flex items-center gap-2 px-2 py-1.5 rounded-[8px] border text-xs cursor-pointer transition-colors ${isSelected ? "bg-[#0075de] text-white border-[#0075de] shadow" : `${bg} hover:border-[#0075de]/30`}`}
          style={{ marginLeft: depth * 8 }}
        >
          <span className={`w-6 h-6 rounded-[6px] flex items-center justify-center text-[11px] font-bold shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-[#f6f5f4] text-[#6b7280]"}`}>
            {node.type.slice(0,2).toUpperCase()}
          </span>
          <span className="font-medium truncate flex-1">{node.type}</span>
          {node.props?.content && <span className={`truncate max-w-[160px] text-[11px] ${isSelected ? "text-white/80" : "text-[#6b7280]"}`}>“{String(node.props.content).slice(0,28)}”</span>}
          {node.props?.source && <span className="text-[11px] font-mono bg-black/10 px-1.5 py-0.5 rounded">{node.props.source}</span>}
          {hasChildren && <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20" : "bg-[#f6f5f4] border"}`}>{node.children!.length}</span>}
        </div>
        {hasChildren && node.children!.map((child, idx) => renderTreeNode(child, [...path, idx], depth + 1))}
      </div>
    )
  }

  return (
    <PageShell
      title="Template Builder"
      description="Visual builder 3-panel: Components (kiri) → Document Canvas (tengah, JSON Tree) → Properties (kanan). Mendukung Repeater, Condition, Binding."
      breadcrumbs={[{ label: "Surat Platform", href: "/" }, { label: "Builder" }]}
      actions={
        <div className="flex items-center gap-2">
          <Select value={selectedTemplateId} onChange={e=>loadTemplate(e.target.value)} className="min-w-[200px]">
            <option value="">-- New Template --</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}</option>)}
          </Select>
          <Button variant="outline" onClick={()=>handlePreview(tree, previewData)}><Eye size={16}/> Preview</Button>
          <Button onClick={handleSave} disabled={saving}><Save size={16}/> {saving?"Menyimpan...":"Simpan"}</Button>
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Left: Components */}
        <Card className="col-span-12 lg:col-span-3 sticky top-4">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Sparkles size={14} className="text-[#0075de]" /> Components</CardTitle><div className="text-[11px] text-[#6b7280]">Klik untuk tambah ke canvas. Pilih node di tengah lalu tambah sebagai child.</div></CardHeader>
          <CardContent className="space-y-4">
            {["basic","layout","data","dynamic","branding"].map(cat => (
              <div key={cat}>
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[#9ca3af] mb-2">{cat}</div>
                <div className="grid grid-cols-2 gap-2">
                  {componentPalette.filter(c=>c.category===cat).map(comp => (
                    <button key={comp.type} onClick={()=>addComponent(comp)} className="flex flex-col items-center gap-1.5 p-3 rounded-[12px] border border-[#e6e6e6] bg-white hover:border-[#0075de] hover:bg-[#0075de]/5 transition-colors text-center group">
                      <comp.icon size={18} className="text-[#0075de] group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-medium leading-tight">{comp.label}</span>
                      <span className="text-[10px] text-[#6b7280] font-mono">{comp.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="rounded-[8px] bg-[#f6f5f4] p-3 text-[11px] leading-relaxed">
              <div className="font-semibold">Binding syntax:</div>
              <div className="font-mono mt-1">{"{{letter.number}} {{employee.name}} {{office.name}} {{current_date}}"}</div>
              <div className="mt-1">Nested: <code className="bg-white px-1 rounded border">{"{{employee.department.name}}"}</code></div>
              <div>Loop: <code className="bg-white px-1 rounded border">Repeater source="employees"</code></div>
              <div>Condition: <code className="bg-white px-1 rounded border">IF employee.status == active</code></div>
            </div>
          </CardContent>
        </Card>

        {/* Center: Document */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Document Canvas</span>
                <Badge variant="secondary" className="text-[11px]">JSON Tree • {JSON.stringify(tree).length} chars</Badge>
              </CardTitle>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label className="text-[11px]">Nama Template</Label><Input value={templateMeta.name} onChange={e=>setTemplateMeta({...templateMeta, name:e.target.value})} className="h-8 text-xs" /></div>
                <div><Label className="text-[11px]">Kode</Label><Input value={templateMeta.code} onChange={e=>setTemplateMeta({...templateMeta, code:e.target.value})} className="h-8 text-xs" /></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-[12px] border-2 border-dashed border-[#e6e6e6] bg-[#fafafa] p-3 min-h-[380px]">
                <div className="text-[11px] font-semibold tracking-widest uppercase text-[#9ca3af] mb-3 flex items-center justify-between">
                  <span>Tree Structure — klik node untuk edit di kanan</span>
                  <span className="text-[11px] lowercase font-normal normal-case tracking-normal">Header → Content → Footer</span>
                </div>
                <div className="space-y-1">
                  {tree.children?.map((child, idx) => renderTreeNode(child, [idx], 0))}
                  {(!tree.children || tree.children.length===0) && <div className="py-12 text-center text-xs text-[#9ca3af]">Canvas kosong — tambah component dari kiri</div>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={()=>{ setTree(initialTree); handlePreview(initialTree, previewData)}}>Reset ke Contoh</Button>
                <Button variant="ghost" size="sm" onClick={()=>{
                  const str = JSON.stringify(tree, null, 2)
                  navigator.clipboard.writeText(str)
                  alert("Tree JSON disalin!")
                }}><Copy size={14}/> Copy JSON</Button>
              </div>

              <div className="mt-4">
                <Label className="text-[11px]">Raw JSON Tree (edit langsung)</Label>
                <Textarea className="font-mono text-[11px] min-h-[160px]" value={JSON.stringify(tree, null, 2)} onChange={e=>{
                  try { const parsed = JSON.parse(e.target.value); setTree(parsed); handlePreview(parsed, previewData) } catch {}
                }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Live Preview — Render Engine</CardTitle><div className="text-[11px] text-[#6b7280]">Kombinasi template tree + data JSON di bawah → HTML. Coba ganti status pegawai jadi inactive untuk lihat Condition.</div></CardHeader>
            <CardContent>
              <div className="border rounded-[12px] bg-white overflow-hidden shadow-sm">
                <div className="h-8 bg-[#f6f5f4] border-b flex items-center px-3 gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="ml-2 text-[11px] text-[#6b7280] font-mono">preview — Document → Header → Repeater → Condition → Footer</span>
                </div>
                <div className="p-4 max-h-[520px] overflow-auto" dangerouslySetInnerHTML={{ __html: previewHtml || "<div style='padding:24px; text-align:center; color:#9ca3af;'>Preview kosong</div>" }} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={()=>{
                  const w = window.open("", "_blank")
                  if (w) { w.document.write(`<html><head><title>Print</title></head><body>${previewHtml}</body></html>`); w.document.close(); w.print() }
                }}>Cetak / Simpan PDF</Button>
                <Button size="sm" variant="ghost" onClick={()=>handlePreview(tree, previewData)}>Refresh</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Properties */}
        <Card className="col-span-12 lg:col-span-3 sticky top-4">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Properties</CardTitle>{selectedNode ? <div className="text-[11px] text-[#6b7280]">Edit node: <span className="font-mono font-bold text-[#0075de]">{selectedNode.type}</span></div> : <div className="text-[11px] text-[#6b7280]">Pilih node di canvas tengah</div>}</CardHeader>
          <CardContent className="space-y-4">
            {!selectedNode ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#f6f5f4] flex items-center justify-center mx-auto text-[#9ca3af]">◯</div>
                <div className="text-xs text-[#6b7280] mt-3">Pilih node di Document Canvas untuk edit props, binding, dan condition.</div>
                <div className="mt-4 text-left rounded-[8px] bg-amber-50 border border-amber-200 p-3 text-[11px] leading-relaxed">
                  <div className="font-semibold text-amber-800">Cara pakai Builder:</div>
                  <div className="text-amber-700 mt-1">1. Klik component di kiri → tambah ke canvas</div>
                  <div className="text-amber-700">2. Klik node di tengah → edit di panel kanan</div>
                  <div className="text-amber-700">3. Untuk nested loop: pilih Repeater → tambah Repeater lagi sebagai child dengan source <code className="bg-white px-1 rounded border">employee.trips</code></div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={()=>moveSelected(-1)}><ChevronUp size={14}/></Button>
                  <Button variant="outline" size="sm" onClick={()=>moveSelected(1)}><ChevronDown size={14}/></Button>
                  <Button variant="destructive" size="sm" onClick={deleteSelected}><Trash2 size={14}/> Hapus</Button>
                </div>

                <div className="space-y-3">
                  {selectedNode.type === "repeater" && (
                    <>
                      <div><Label className="text-[11px]">Data Source (Repeater)</Label><Input value={selectedNode.props?.source || ""} onChange={e=>updateSelectedProps("source", e.target.value)} placeholder="employees" className="h-8 text-xs font-mono" /><div className="text-[11px] text-[#6b7280] mt-1">Loop: for item in source. Contoh nested: <code className="bg-[#f6f5f4] px-1 rounded">employee.trips</code></div></div>
                      <div><Label className="text-[11px]">Item Variable</Label><Input value={selectedNode.props?.item || ""} onChange={e=>updateSelectedProps("item", e.target.value)} placeholder="employee" className="h-8 text-xs font-mono" /></div>
                    </>
                  )}
                  {selectedNode.type === "condition" && (
                    <>
                      <div><Label className="text-[11px]">Field</Label><Input value={selectedNode.props?.field || ""} onChange={e=>updateSelectedProps("field", e.target.value)} placeholder="employee.status" className="h-8 text-xs font-mono" /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px]">Operator</Label><Select value={selectedNode.props?.operator || "equals"} onChange={e=>updateSelectedProps("operator", e.target.value)}><option value="equals">equals</option><option value="not_equals">not_equals</option><option value="contains">contains</option><option value="exists">exists</option><option value="gt">gt</option><option value="lt">lt</option></Select></div>
                        <div><Label className="text-[11px]">Value</Label><Input value={selectedNode.props?.value || ""} onChange={e=>updateSelectedProps("value", e.target.value)} placeholder="active" className="h-8 text-xs" /></div>
                      </div>
                      <div className="text-[11px] text-[#6b7280]">Jika kondisi TRUE → children dirender, else hidden.</div>
                    </>
                  )}
                  {selectedNode.props && Object.keys(selectedNode.props).filter(k=>!["source","item","field","operator","value"].includes(k)).map(key=>(
                    <div key={key}>
                      <Label className="text-[11px] capitalize">{key}</Label>
                      {key === "content" ? (
                        <Textarea value={selectedNode.props![key] || ""} onChange={e=>updateSelectedProps(key, e.target.value)} placeholder="Tulis konten, bisa pakai {{binding}}" className="text-xs min-h-[60px]" />
                      ) : (
                        <Input value={selectedNode.props![key] || ""} onChange={e=>updateSelectedProps(key, e.target.value)} className="h-8 text-xs" />
                      )}
                      {key === "content" && <div className="text-[11px] text-[#6b7280] mt-1">Binding: {"{{employee.name}} {{letter.number}} {{current_date}}"}</div>}
                    </div>
                  ))}
                  {(!selectedNode.props || Object.keys(selectedNode.props).length===0) && (
                    <div><Label className="text-[11px]">Content</Label><Input value={selectedNode.props?.content || ""} onChange={e=>updateSelectedProps("content", e.target.value)} placeholder="{{binding}}" className="h-8 text-xs font-mono" /></div>
                  )}
                </div>

                <div className="rounded-[8px] bg-[#f6f5f4] p-3 text-[11px] leading-relaxed">
                  <div className="font-semibold">Data Binding Panel</div>
                  <div className="mt-1 font-mono text-[11px]">Available: {"{{office.name}} {{letter.title}} {{employee.name}} {{employee.nip}} {{employee.position}} {{index}} {{current_date}}"}</div>
                </div>
              </>
            )}

            <div>
              <Label className="text-[11px]">Data JSON (untuk preview)</Label>
              <Textarea className="font-mono text-[11px] min-h-[160px]" value={previewData} onChange={e=>{ setPreviewData(e.target.value); handlePreview(tree, e.target.value) }} />
              <div className="text-[11px] text-[#6b7280] mt-1">Ubah employees array atau status untuk test Repeater & Condition.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
