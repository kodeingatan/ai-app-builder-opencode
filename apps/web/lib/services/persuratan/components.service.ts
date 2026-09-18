import prisma from "@/lib/prisma"
const TABLE = "persuratan_components"
export const PersuratanComponentsService = {
  async findAll(q:any){
    const page=q.page??1; const limit=Math.min(q.limit??20,100); const offset=(page-1)*limit
    const search=q.search?.trim()
    let where="WHERE 1=1"; const params:any[]=[]
    if(search){ where+=` AND (name LIKE ? OR contentHtml LIKE ?)`; params.push(`%${search}%`,`%${search}%`)}
    const count:any=await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM "${TABLE}" ${where}`, ...params)
    const total=Number(count[0]?.total??0)
    const data:any=await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, ...params, limit, offset)
    return {data,total,page,limit,totalPages:Math.ceil(total/limit)}
  },
  async findOne(id:number){
    const rows:any=await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" WHERE id=?`,id)
    return rows[0]??null
  },
  async create(d:any){
    await prisma.$executeRawUnsafe(`INSERT INTO "${TABLE}" (name, isLooping, contentHtml, bindingsJson, updatedAt) VALUES (?,?,?,?, CURRENT_TIMESTAMP)`, d.name, d.isLooping?1:0, d.contentHtml, d.bindingsJson??null)
    const rows:any=await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" WHERE name=? ORDER BY id DESC LIMIT 1`, d.name)
    return rows[0]
  },
  async update(id:number,d:any){
    const sets=[]; const vals:any[]=[]
    if(d.name!==undefined){ sets.push(`name=?`); vals.push(d.name)}
    if(d.isLooping!==undefined){ sets.push(`isLooping=?`); vals.push(d.isLooping?1:0)}
    if(d.contentHtml!==undefined){ sets.push(`contentHtml=?`); vals.push(d.contentHtml)}
    if(d.bindingsJson!==undefined){ sets.push(`bindingsJson=?`); vals.push(d.bindingsJson)}
    if(!sets.length) return this.findOne(id)
    sets.push(`updatedAt=CURRENT_TIMESTAMP`)
    await prisma.$executeRawUnsafe(`UPDATE "${TABLE}" SET ${sets.join(",")} WHERE id=?`, ...vals, id)
    return this.findOne(id)
  },
  async remove(id:number){
    await prisma.$executeRawUnsafe(`DELETE FROM "${TABLE}" WHERE id=?`,id)
    return {id}
  }
}
