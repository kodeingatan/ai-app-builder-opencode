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
import { Save, Eye, Plus, Trash2, Copy, ChevronUp, ChevronDown, Sparkles, Type, Heading1, Pilcrow, Image as ImageIcon, Table, PenTool, Minus, QrCode, Calendar, Repeat, GitBranch, Building2, Barcode, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Ruler, ZoomIn, ZoomOut, FileText, Maximize2, Layers, EyeOff, Code } from "lucide-react"

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
  { type: "barcode", label: "Barcode", icon: Barcode, category: "dynamic", defaultProps: { value: "{{letter.number}}", format: "CODE128", width: 220, height: 56, displayValue: true } },
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
    { type: "barcode", props: { value: "{{letter.number}}", format: "CODE128", width: 220, height: 56, displayValue: true, align: "center" } },
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
  const [officeMode, setOfficeMode] = useState<'office'|'structure'|'json'>('office')
  const [zoom, setZoom] = useState(90)
  const [showRuler, setShowRuler] = useState(true)
  const [pageSize, setPageSize] = useState<'A4'|'Letter'>('A4')

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
      description="Visual builder 3-panel: Components (kiri) → Document Editor Office Doc (tengah, klik elemen untuk edit) → Properties (kanan). Mendukung Repeater, Condition, Binding, Barcode."
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

        {/* Center: Document - Office Doc Editor */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b bg-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText size={16} className="text-[#0075de]" /> Document Editor
                  <span className="hidden sm:inline text-[11px] font-normal text-[#6b7280]">— Simple Office Doc</span>
                </CardTitle>
                <Badge variant="secondary" className="text-[11px] hidden sm:flex">{pageSize} • {zoom}% • {JSON.stringify(tree).length} chars</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label className="text-[11px]">Nama Template</Label><Input value={templateMeta.name} onChange={e=>setTemplateMeta({...templateMeta, name:e.target.value})} className="h-8 text-xs" /></div>
                <div><Label className="text-[11px]">Kode</Label><Input value={templateMeta.code} onChange={e=>setTemplateMeta({...templateMeta, code:e.target.value})} className="h-8 text-xs" /></div>
              </div>
              {/* Mode Tabs */}
              <div className="mt-3 flex items-center gap-1 bg-[#f6f5f4] p-1 rounded-[10px] w-fit">
                {(["office","structure","json"] as const).map(m => (
                  <button key={m} onClick={()=>setOfficeMode(m)} className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors flex items-center gap-1.5 ${officeMode===m ? "bg-white shadow text-[#111] border border-[#e6e6e6]" : "text-[#6b7280] hover:text-[#111]"}`}>
                    {m==="office" && <FileText size={12}/>}
                    {m==="structure" && <Layers size={12}/>}
                    {m==="json" && <Code size={12} className="hidden"/>}{m==="json" ? "{}" : null}
                    {m==="office" ? "Office Doc" : m==="structure" ? "Structure" : "Raw JSON"}
                  </button>
                ))}
              </div>
            </CardHeader>

            {officeMode === "office" && (
              <>
                {/* Office Toolbar - Word-like */}
                <div className="bg-[#f9fafb] border-b border-[#e6e6e6] px-3 py-2 flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-white border border-[#e6e6e6] rounded-[8px] p-1">
                    <Select value={pageSize} onChange={e=>setPageSize(e.target.value as any)} className="h-7 text-xs border-0 bg-transparent">
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                    </Select>
                    <span className="w-px h-4 bg-[#e6e6e6] mx-1" />
                    <button title="Bold" onClick={()=>{ if(selectedNode?.props) updateSelectedProps("fontWeight", selectedNode.props.fontWeight==="bold"?"normal":"bold")}} className={`w-7 h-7 rounded flex items-center justify-center hover:bg-[#f6f5f4] ${selectedNode?.props?.fontWeight==="bold"?"bg-[#0075de] text-white":"text-[#374151]"}`}><Bold size={13}/></button>
                    <button title="Italic" className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#f6f5f4] text-[#374151]"><Italic size={13}/></button>
                    <button title="Underline" className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#f6f5f4] text-[#374151]"><Underline size={13}/></button>
                    <span className="w-px h-4 bg-[#e6e6e6] mx-1" />
                    <button title="Align Left" onClick={()=>updateSelectedProps("align","left")} className={`w-7 h-7 rounded flex items-center justify-center ${selectedNode?.props?.align==="left"?"bg-[#0075de] text-white":"hover:bg-[#f6f5f4] text-[#374151]"}`}><AlignLeft size={13}/></button>
                    <button title="Align Center" onClick={()=>updateSelectedProps("align","center")} className={`w-7 h-7 rounded flex items-center justify-center ${selectedNode?.props?.align==="center"?"bg-[#0075de] text-white":"hover:bg-[#f6f5f4] text-[#374151]"}`}><AlignCenter size={13}/></button>
                    <button title="Align Right" onClick={()=>updateSelectedProps("align","right")} className={`w-7 h-7 rounded flex items-center justify-center ${selectedNode?.props?.align==="right"?"bg-[#0075de] text-white":"hover:bg-[#f6f5f4] text-[#374151]"}`}><AlignRight size={13}/></button>
                    <button title="Justify" onClick={()=>updateSelectedProps("align","justify")} className={`w-7 h-7 rounded flex items-center justify-center ${selectedNode?.props?.align==="justify"?"bg-[#0075de] text-white":"hover:bg-[#f6f5f4] text-[#374151]"}`}><AlignJustify size={13}/></button>
                  </div>
                  <div className="flex items-center gap-1 bg-white border border-[#e6e6e6] rounded-[8px] p-1 ml-auto">
                    <button onClick={()=>setShowRuler(!showRuler)} className={`px-2 h-7 rounded text-xs flex items-center gap-1 ${showRuler?"bg-[#0075de] text-white":"hover:bg-[#f6f5f4] text-[#6b7280]"}`}><Ruler size={12}/> Ruler</button>
                    <span className="w-px h-4 bg-[#e6e6e6]" />
                    <button onClick={()=>setZoom(Math.max(60, zoom-10))} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><ZoomOut size={12}/></button>
                    <span className="text-xs font-mono w-10 text-center">{zoom}%</span>
                    <button onClick={()=>setZoom(Math.min(140, zoom+10))} className="w-7 h-7 rounded hover:bg-[#f6f5f4] flex items-center justify-center text-[#6b7280]"><ZoomIn size={12}/></button>
                    <button onClick={()=>setZoom(90)} className="px-1.5 h-7 rounded hover:bg-[#f6f5f4] text-[11px] text-[#6b7280]"><Maximize2 size={12}/></button>
                  </div>
                </div>

                {showRuler && (
                  <div className="bg-[#f3f4f6] border-b border-[#e6e6e6] h-6 flex items-center px-4 overflow-hidden select-none">
                    <div className="flex-1 flex items-end h-full max-w-[794px] mx-auto relative">
                      {Array.from({length: 20}).map((_,i)=>(
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <span className="text-[7px] text-[#9ca3af] font-mono">{i}</span>
                          <div className="w-px h-2 bg-[#d1d5db] mt-0.5" />
                          <div className="flex gap-px mt-0.5">
                            {Array.from({length: 4}).map((__,j)=><div key={j} className={`w-px ${j===2?"h-1.5 bg-[#9ca3af]":"h-1 bg-[#e5e7eb]"}`} />)}
                          </div>
                        </div>
                      ))}
                      <div className="absolute left-0 right-0 top-0 h-px bg-[#0075de]/30" />
                    </div>
                  </div>
                )}

                <div className="bg-[#e8ecef] p-4 md:p-6 flex justify-center overflow-auto" style={{minHeight: 520}}>
                  <div 
                    className="bg-white shadow-[0_2px_16px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.08)] transition-all duration-200 flex flex-col"
                    style={{
                      width: pageSize==="A4" ? 794 : 816,
                      minHeight: pageSize==="A4" ? 520 : 480,
                      transform: `scale(${zoom/100})`,
                      transformOrigin: "top center",
                      marginBottom: zoom<100 ? -((100-zoom)*2) : 0,
                    }}
                  >
                    {/* Paper Header Info */}
                    <div className="h-7 bg-white border-b border-[#e6e6e6] flex items-center justify-between px-4 text-[10px] text-[#9ca3af] font-mono">
                      <span className="flex items-center gap-2"><FileText size={10}/> {templateMeta.code} — {templateMeta.name}</span>
                      <span className="hidden sm:flex items-center gap-2"><Eye size={10}/> Office Doc • {pageSize} • Klik elemen untuk edit</span>
                    </div>

                    {/* Office Paper Content - interactive */}
                    <div className="flex-1 p-0 flex flex-col">
                      {(() => {
                        const dataObj = (()=>{ try{return JSON.parse(previewData)}catch{return {}}})()
                        const interpolate = (str:string, ctx:any={})=>{
                          if(typeof str!=="string") return str
                          return str.replace(/\{\{\s*([^}]+)\s*\}\}/g,(_,p)=>{
                            const path=p.trim()
                            if(path==="current_date") return new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})
                            if(path==="index" && ctx.index) return String(ctx.index)
                            const tryGet=(o:any,pp:string)=>pp.split(".").reduce((a,c)=>a?.[c],o)
                            let v=tryGet(ctx,path)
                            if(v!==undefined) return String(v)
                            v=tryGet(dataObj,path)
                            if(v!==undefined) return String(v)
                            if(path.startsWith("item.")){ const sub=path.slice(5); v=tryGet(ctx.item ?? ctx[ctx.__itemName] ?? {}, sub); if(v!==undefined) return String(v)}
                            if(path.startsWith("employee.")){ v=tryGet(ctx.employee ?? {}, path.slice(9)); if(v!==undefined) return String(v)}
                            return ""
                          })
                        }
                        const isSelected = (path:number[])=> selectedPath && selectedPath.length===path.length && selectedPath.every((v,i)=>v===path[i])
                        const renderOfficeNode = (node:TreeNode, path:number[], ctx:any={}): React.ReactNode => {
                          const selected = isSelected(path)
                          const baseCls = `relative group transition-all ${selected ? "ring-2 ring-[#0075de] ring-offset-1 bg-[#0075de]/[0.02]" : "hover:ring-1 hover:ring-[#0075de]/30 hover:bg-[#f8fafc]"}`
                          const onSelect = (e:React.MouseEvent)=>{ e.stopPropagation(); setSelectedPath(path) }
                          const p = node.props || {}
                          switch(node.type){
                            case "header":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} border-b-2 border-[#111] pb-3 mb-4 pt-6 px-8 ${selected?"rounded-[4px]": ""}`}>
                                {selected && <span className="absolute -top-2 left-2 bg-[#0075de] text-white text-[10px] px-1.5 py-0.5 rounded font-mono">HEADER</span>}
                                <div className="space-y-1">{(node.children||[]).map((c,i)=>renderOfficeNode(c,[...path,i],ctx))}</div>
                              </div>
                            case "footer":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} border-t border-[#e6e6e6] mt-6 pt-3 pb-4 px-8 bg-[#fafafa]/50`}>
                                {selected && <span className="absolute -top-2 left-2 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">FOOTER</span>}
                                <div className="space-y-1 opacity-80">{(node.children||[]).map((c,i)=>renderOfficeNode(c,[...path,i],ctx))}</div>
                              </div>
                            case "heading":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-8 py-1 ${selected?"rounded":""}`}>
                                {selected && <span className="absolute -top-2 left-2 bg-[#111] text-white text-[10px] px-1.5 py-0.5 rounded">HEADING</span>}
                                <h2 style={{fontSize: (p.fontSize||14), fontWeight: p.fontWeight||"bold", textAlign: p.align||"left", color: p.color||"#111", textTransform: p.transform==="uppercase"?"uppercase":"none", letterSpacing: "0.02em"}} className="my-2 leading-tight">{interpolate(p.content||"")}</h2>
                              </div>
                            case "text":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-8 py-0.5 ${selected?"rounded":""}`}>
                                <div style={{fontSize: p.fontSize||11, fontWeight: p.fontWeight||"normal", textAlign: p.align||"left", color: p.color||"#1f2937", marginLeft: p.indent||0}} className="my-1 leading-relaxed whitespace-pre-wrap">{interpolate(p.content||"")}</div>
                              </div>
                            case "paragraph":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-8 py-1 ${selected?"rounded":""}`}>
                                <p style={{fontSize: p.fontSize||11, textAlign: p.align||"justify", lineHeight: 1.6}} className="my-2 text-[#1f2937] whitespace-pre-wrap">{interpolate(p.content||"")}</p>
                              </div>
                            case "image":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-8 py-2 flex ${p.align==="center"?"justify-center":p.align==="right"?"justify-end":"justify-start"} ${selected?"rounded":""}`}>
                                {p.src && !String(p.src).includes("{{") ? <img src={p.src} alt="img" style={{width: p.width||60, height: p.height||60, objectFit:"contain"}}/> : <div style={{width: p.width||60, height: p.height||60}} className="bg-[#f3f4f6] border border-dashed border-[#d1d5db] flex items-center justify-center text-[8px] text-[#9ca3af]">LOGO</div>}
                              </div>
                            case "divider":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-8 py-1 ${selected?"rounded":""}`}>
                                <hr style={{borderTop: `${p.height||1}px solid ${p.color||"#e5e7eb"}`, margin: `${p.margin||8}px 0`}}/>
                              </div>
                            case "signature":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-8 py-4 ${selected?"rounded":""}`}>
                                {selected && <span className="absolute -top-2 left-2 bg-violet-600 text-white text-[10px] px-1.5 py-0.5 rounded">SIGNATURE</span>}
                                <div style={{textAlign: p.align||"right", fontSize: 11, lineHeight:1.5}}>
                                  <div>Hormat kami,</div>
                                  <div style={{height: 48}} />
                                  <div style={{fontWeight:700, textDecoration:"underline"}}>{interpolate(p.name||"")}</div>
                                  {p.position && <div className="text-[#4b5563]">{interpolate(p.position)}</div>}
                                  {p.nip && <div className="text-[10px] text-[#6b7280]">NIP. {interpolate(p.nip)}</div>}
                                </div>
                              </div>
                            case "qrcode":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-8 py-2 ${selected?"rounded":""}`}>
                                <div style={{textAlign: p.align||"right"}}>
                                  <div style={{display:"inline-block", width: p.size||60, height: p.size||60, border: "1px solid #111", background:"repeating-linear-gradient(45deg,#f3f4f6 0 4px, white 4px 8px)", position:"relative"}}>
                                    <div style={{position:"absolute", inset:4, border:"2px solid #111", display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, fontWeight:700}}>QR</div>
                                  </div>
                                  <div className="text-[7px] text-[#6b7280] mt-1 max-w-[120px] ml-auto break-all">{interpolate(p.value||"")}</div>
                                </div>
                              </div>
                            case "barcode":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-8 py-2 ${selected?"rounded":""}`}>
                                <div style={{textAlign: p.align||"center"}}>
                                  <div className="inline-block border border-[#e5e7eb] rounded-[6px] px-3 py-2 bg-white">
                                    <div className="h-10 w-[220px] bg-[repeating-linear-gradient(90deg,#111_0_2px,transparent_2px_4px)] rounded-sm" />
                                    <div className="font-mono text-[10px] font-semibold tracking-widest text-center mt-1">*{interpolate(p.value||p.content||"")}*</div>
                                    <div className="text-[7px] text-[#6b7280] text-center uppercase tracking-widest">{p.format||"CODE128"}</div>
                                  </div>
                                </div>
                              </div>
                            case "date":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-8 py-1 text-[10px] text-[#374151] ${selected?"rounded":""}`}>{(()=>{ const v=p.source ? interpolate(`{{${p.source}}}`) : new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"}); const d=new Date(v); return isNaN(d.getTime())?v:d.toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})})()}</div>
                            case "kop_surat":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} text-center border-b-[3px] border-double border-[#111] pb-3 mb-4 mx-8 pt-2 ${selected?"rounded":""}`}>
                                <div className="text-[14px] font-extrabold tracking-widest">{interpolate(p.office||p.content||"KOP SURAT")}</div>
                                <div className="text-[10px] text-[#4b5563]">{interpolate(p.address||"")}</div>
                              </div>
                            case "table":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-8 py-2 ${selected?"rounded":""}`}>
                                {selected && <span className="absolute -top-2 left-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded">TABLE: {p.source}</span>}
                                <div className="border border-[#d1d5db] rounded-[6px] overflow-hidden">
                                  <div className="bg-[#f9fafb] grid text-[10px] font-bold border-b border-[#d1d5db]" style={{gridTemplateColumns:`repeat(${p.columns?.length||3},1fr)`}}>{(p.columns||[]).map((c:string)=><div key={c} className="px-2 py-1.5 border-r last:border-0 border-[#d1d5db]">{c}</div>)}</div>
                                  {(dataObj[p.source||""]||[]).slice(0,3).map((row:any,ri:number)=><div key={ri} className="grid text-[10px] border-b last:border-0 border-[#e5e7eb]" style={{gridTemplateColumns:`repeat(${p.columns?.length||3},1fr)`}}>{(p.columns||[]).map((c:string)=><div key={c} className="px-2 py-1 border-r last:border-0 border-[#e5e7eb]">{c==="no"?ri+1: (row[c]??row[c.toLowerCase()]??"-")}</div>)}</div>)}
                                  {(!dataObj[p.source||""] || dataObj[p.source||""]?.length===0) && <div className="p-3 text-center text-xs text-[#9ca3af]">No data — {p.source}</div>}
                                </div>
                              </div>
                            case "repeater":
                              {
                                const src=p.source||"employees"
                                const arr = (()=>{ const v = ctx[src] ?? dataObj[src] ?? (src.includes(".") ? (()=>{ const parts=src.split("."); let cur:any=ctx; for(const pp of parts){cur=cur?.[pp]}; if(cur) return cur; cur=dataObj; for(const pp of parts){cur=cur?.[pp]}; return cur })() : undefined); return Array.isArray(v)?v:[] })()
                                const sample = arr.length ? arr : [{name:"Afdal",nip:"199xxx",position:"Programmer",department:"Bidang TI",status:"active"}, {name:"Budi",nip:"198xxx",position:"Analis",department:"Hukum",status:"active"}]
                                return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} mx-4 my-2 border-2 border-dashed ${selected?"border-[#0075de] bg-[#eff6ff]":"border-amber-300 bg-amber-50/50"} rounded-[8px] p-3`}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${selected?"bg-[#0075de] text-white":"bg-amber-500 text-white"}`}><Repeat size={10}/> REPEATER: {src} ({sample.length} items)</span>
                                    <span className="text-[11px] font-mono text-amber-800">for {p.item||"item"} in {src}</span>
                                    {selected && <span className="ml-auto text-[10px] bg-white border px-1.5 py-0.5 rounded">klik + di kiri untuk tambah child</span>}
                                  </div>
                                  <div className="space-y-2">
                                    {sample.slice(0,3).map((item:any,idx:number)=>{
                                      const childCtx={...ctx, [p.item||"item"]:item, item, employee:item, index: idx+1, __itemName: p.item||"item"}
                                      return <div key={idx} className="bg-white border border-[#e6e6e6] rounded-[6px] p-2 shadow-sm">
                                        <div className="text-[10px] font-mono text-[#6b7280] mb-1">#{idx+1} • {item.name} — {item.nip}</div>
                                        <div className="space-y-1">{(node.children||[]).map((c,i)=>renderOfficeNode(c,[...path,i],childCtx))}</div>
                                      </div>
                                    })}
                                    {sample.length>3 && <div className="text-center text-[11px] text-[#6b7280]">+ {sample.length-3} more items…</div>}
                                  </div>
                                </div>
                              }
                            case "condition":
                              {
                                const field=p.field||""
                                const op=p.operator||"equals"
                                const val=p.value||""
                                // simple eval for preview (first employee)
                                const sampleEmp = (dataObj.employees||[])[0] || {status:"active"}
                                const ctxTest={...ctx, employee: sampleEmp, item: sampleEmp}
                                const tryGet=(o:any,pp:string)=>pp.split(".").reduce((a,c)=>a?.[c],o)
                                const actual = tryGet(ctxTest,field) ?? tryGet(dataObj,field) ?? ""
                                const pass = op==="equals" ? String(actual)===String(val) : op==="not_equals" ? String(actual)!==String(val) : String(actual).includes(String(val))
                                return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} mx-4 my-2 border-2 border-dashed ${selected?"border-violet-500 bg-violet-50":"border-violet-300 bg-violet-50/40"} rounded-[8px] p-3`}>
                                  <div className={`flex items-center gap-2 text-[10px] font-bold px-2 py-1 rounded-full w-fit ${pass?"bg-emerald-500 text-white":"bg-violet-500 text-white"}`}><GitBranch size={10}/> IF {field} {op} "{val}" → {pass?"TRUE":"FALSE"}</div>
                                  <div className={`mt-2 space-y-1 ${!pass?"opacity-40":""}`}>{(node.children||[]).map((c,i)=>renderOfficeNode(c,[...path,i],ctx))}</div>
                                  {!pass && <div className="text-[10px] text-violet-700 mt-1 italic">↳ hidden di preview karena kondisi FALSE (ganti value di kanan untuk test)</div>}
                                </div>
                              }
                            case "section":
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-2 py-2 my-2 border border-dashed border-[#d1d5db] rounded-[6px] mx-4`}>{(node.children||[]).map((c,i)=>renderOfficeNode(c,[...path,i],ctx))}</div>
                            case "document":
                              return <div key={path.join("-")} className="space-y-0">{(node.children||[]).map((c,i)=>renderOfficeNode(c,[...path,i],ctx))}</div>
                            default:
                              return <div key={path.join("-")} onClick={onSelect} className={`${baseCls} px-8 py-2 ${selected?"rounded":""}`}>
                                {p.content ? <div className="text-[11px]">{interpolate(p.content)}</div> : <div className="text-[10px] text-[#9ca3af] font-mono">{node.type}</div>}
                                {(node.children||[]).map((c,i)=>renderOfficeNode(c,[...path,i],ctx))}
                              </div>
                          }
                        }
                        if(!tree.children || tree.children.length===0) return <div className="flex-1 flex flex-col items-center justify-center p-12 text-center"><div className="w-16 h-16 rounded-[12px] bg-[#f3f4f6] flex items-center justify-center text-[#9ca3af] mb-3"><FileText size={24}/></div><div className="text-sm font-medium text-[#6b7280]">Dokumen kosong</div><div className="text-xs text-[#9ca3af] mt-1">Klik component di kiri untuk menambah ke halaman</div></div>
                        return <div className="flex-1 py-2">{tree.children.map((c,i)=>renderOfficeNode(c,[i], {}))}</div>
                      })()}
                    </div>

                    {/* Page Footer - Office style */}
                    <div className="h-8 bg-[#f9fafb] border-t border-[#e6e6e6] flex items-center justify-between px-4 text-[10px] text-[#9ca3af] font-mono">
                      <span>Halaman 1 dari 1</span>
                      <span className="hidden sm:inline">Ketik langsung di canvas — klik elemen untuk edit di panel kanan • Drag & drop dari kiri</span>
                      <span>{pageSize} • {zoom}%</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6b7280]">
                  <span className="flex items-center gap-1.5"><EyeOff size={12}/> Klik garis putus-putus untuk edit Repeater/Condition • Ubah <code className="bg-white px-1 rounded border">source</code> di kanan</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={()=>{ setTree(initialTree); handlePreview(initialTree, previewData)}}>Reset ke Contoh</Button>
                    <Button variant="ghost" size="sm" onClick={()=>{ navigator.clipboard.writeText(JSON.stringify(tree,null,2)); alert("Tree JSON disalin!")}}><Copy size={14}/> Copy JSON</Button>
                  </div>
                </div>
              </>
            )}

            {officeMode === "structure" && (
              <CardContent>
                <div className="rounded-[12px] border-2 border-dashed border-[#e6e6e6] bg-[#fafafa] p-3 min-h-[380px]">
                  <div className="text-[11px] font-semibold tracking-widest uppercase text-[#9ca3af] mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Layers size={12}/> Tree Structure — klik node untuk edit</span>
                    <span className="text-[11px] lowercase font-normal normal-case tracking-normal">Header → Content → Footer</span>
                  </div>
                  <div className="space-y-1">
                    {tree.children?.map((child, idx) => renderTreeNode(child, [idx], 0))}
                    {(!tree.children || tree.children.length===0) && <div className="py-12 text-center text-xs text-[#9ca3af]">Canvas kosong — tambah component dari kiri</div>}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={()=>{ setTree(initialTree); handlePreview(initialTree, previewData)}}>Reset ke Contoh</Button>
                  <Button variant="ghost" size="sm" onClick={()=>{ navigator.clipboard.writeText(JSON.stringify(tree,null,2)); alert("Tree JSON disalin!")}}><Copy size={14}/> Copy JSON</Button>
                </div>
              </CardContent>
            )}

            {officeMode === "json" && (
              <CardContent>
                <Label className="text-[11px]">Raw JSON Tree (edit langsung — additive)</Label>
                <Textarea className="font-mono text-[11px] min-h-[420px]" value={JSON.stringify(tree, null, 2)} onChange={e=>{
                  try { const parsed = JSON.parse(e.target.value); setTree(parsed); handlePreview(parsed, previewData) } catch {}
                }} />
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={()=>{ setTree(initialTree); handlePreview(initialTree, previewData)}}>Reset</Button>
                  <Button variant="ghost" size="sm" onClick={()=>{ navigator.clipboard.writeText(JSON.stringify(tree,null,2)); alert("Disalin!")}}><Copy size={14}/> Copy</Button>
                </div>
              </CardContent>
            )}
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
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={()=>{
                  const w = window.open("", "_blank")
                  if (w) { w.document.write(`<html><head><title>Print</title></head><body>${previewHtml}</body></html>`); w.document.close(); w.print() }
                }}>Cetak (browser)</Button>
                <Button size="sm" onClick={async()=>{
                  try {
                    const data = JSON.parse(previewData)
                    const res = await fetch("/api/generated/surat-platform/export-pdf", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ schema: tree, data }) })
                    if (res.headers.get("content-type")?.includes("application/pdf")) {
                      const blob = await res.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url; a.download = `${templateMeta.code || "document"}.pdf`; a.click(); URL.revokeObjectURL(url)
                    } else {
                      const j = await res.json()
                      if (j.html) {
                        const w = window.open("", "_blank")
                        if (w) { w.document.write(j.html); w.document.close(); w.print() }
                      } else alert(j.message)
                    }
                  } catch(e:any){ alert("PDF error: "+e.message) }
                }}>Export PDF (server)</Button>
                <Button size="sm" variant="ghost" onClick={()=>handlePreview(tree, previewData)}>Refresh</Button>
              </div>
              <div className="text-[11px] text-[#6b7280] mt-2">Server PDF via <code className="bg-[#f6f5f4] px-1 rounded border">POST /api/.../export-pdf</code> (puppeteer-core + chrome) — additive, tanpa rebuild. Barcode ikut ter-render di PDF.</div>
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
                  {selectedNode.type === "barcode" && (
                    <>
                      <div><Label className="text-[11px]">Value (binding)</Label><Input value={selectedNode.props?.value || ""} onChange={e=>updateSelectedProps("value", e.target.value)} placeholder="{{letter.number}} atau {{employee.nip}}" className="h-8 text-xs font-mono" /><div className="text-[11px] text-[#6b7280] mt-1">Bisa pakai {"{{letter.number}}"}, {"{{document.qrValue}}"}, NIP, dsb</div></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px]">Format</Label><Select value={selectedNode.props?.format || "CODE128"} onChange={e=>updateSelectedProps("format", e.target.value)}><option value="CODE128">CODE128</option><option value="CODE39">CODE39</option><option value="EAN13">EAN13</option><option value="EAN8">EAN8</option><option value="ITF">ITF</option></Select></div>
                        <div><Label className="text-[11px]">Align</Label><Select value={selectedNode.props?.align || "center"} onChange={e=>updateSelectedProps("align", e.target.value)}><option value="left">left</option><option value="center">center</option><option value="right">right</option></Select></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-[11px]">Width</Label><Input type="number" value={selectedNode.props?.width || 220} onChange={e=>updateSelectedProps("width", Number(e.target.value))} className="h-8 text-xs" /></div>
                        <div><Label className="text-[11px]">Height</Label><Input type="number" value={selectedNode.props?.height || 56} onChange={e=>updateSelectedProps("height", Number(e.target.value))} className="h-8 text-xs" /></div>
                      </div>
                      <div><Label className="text-[11px]">Display Value</Label><Select value={String(selectedNode.props?.displayValue ?? true)} onChange={e=>updateSelectedProps("displayValue", e.target.value==="true")}><option value="true">true — tampilkan teks</option><option value="false">false — hanya garis</option></Select></div>
                    </>
                  )}
                  {/* generic props (exclude barcode/repeater/condition specifics to avoid dupe) */}
                  {selectedNode.props && Object.keys(selectedNode.props).filter(k=>!["source","item","field","operator","value","format","width","height","displayValue","align"].includes(k) || (selectedNode.type!=="barcode" && selectedNode.type!=="repeater" && selectedNode.type!=="condition")).filter(k => {
                    if (selectedNode.type==="barcode" && ["value","format","width","height","displayValue","align"].includes(k)) return false
                    if (selectedNode.type==="repeater" && ["source","item"].includes(k)) return false
                    if (selectedNode.type==="condition" && ["field","operator","value"].includes(k)) return false
                    return true
                  }).map(key=>(
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
