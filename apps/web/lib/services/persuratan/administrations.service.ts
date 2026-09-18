import prisma from "@/lib/prisma"
const TABLE="persuratan_administrations"
const STEP_TABLE="persuratan_steps"
const DATA_TABLE="persuratan_datas"
export const PersuratanAdministrationsService={
  async findAll(q:any){
    const page=q.page??1; const limit=Math.min(q.limit??20,100); const offset=(page-1)*limit
    const search=q.search?.trim()
    let where="WHERE 1=1"; const params:any[]=[]
    if(search){ where+=` AND (name LIKE ? OR description LIKE ?)`; params.push(`%${search}%`,`%${search}%`)}
    const count:any=await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM "${TABLE}" ${where}`, ...params)
    const total=Number(count[0]?.total??0)
    const data:any=await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, ...params, limit, offset)
    for(const row of data){
      const steps:any=await prisma.$queryRawUnsafe(`SELECT * FROM "${STEP_TABLE}" WHERE administrationId=? ORDER BY stepOrder ASC`, row.id)
      row._steps=steps
      const datas:any=await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM "${DATA_TABLE}" WHERE administrationId=?`, row.id)
      row._dataCount=Number(datas[0]?.cnt??0)
    }
    return {data,total,page,limit,totalPages:Math.ceil(total/limit)}
  },
  async findOne(id:number){
    const rows:any=await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" WHERE id=?`,id)
    const row=rows[0]??null
    if(!row) return null
    const steps:any=await prisma.$queryRawUnsafe(`SELECT * FROM "${STEP_TABLE}" WHERE administrationId=? ORDER BY stepOrder ASC`, id)
    // enrich steps with template name
    for(const s of steps){
      const t:any=await prisma.$queryRawUnsafe(`SELECT name FROM "persuratan_templates" WHERE id=?`, s.templateId)
      s.templateName=t[0]?.name??""
    }
    row.steps=steps
    return row
  },
  async create(d:any){
    await prisma.$executeRawUnsafe(`INSERT INTO "${TABLE}" (name, description, fieldsJson, updatedAt) VALUES (?,?,?, CURRENT_TIMESTAMP)`, d.name, d.description??null, d.fieldsJson??null)
    const rows:any=await prisma.$queryRawUnsafe(`SELECT * FROM "${TABLE}" WHERE name=? ORDER BY id DESC LIMIT 1`, d.name)
    const created=rows[0]
    // create steps if provided
    if(d.steps && Array.isArray(d.steps)){
      for(let i=0;i<d.steps.length;i++){
        const s=d.steps[i]
        await prisma.$executeRawUnsafe(`INSERT INTO "${STEP_TABLE}" (administrationId, stepOrder, templateId, dataMappingJson) VALUES (?,?,?,?)`, created.id, i+1, s.templateId, s.dataMappingJson ? JSON.stringify(s.dataMappingJson) : null)
      }
    }
    return this.findOne(created.id)
  },
  async update(id:number,d:any){
    const sets=[]; const vals:any[]=[]
    if(d.name!==undefined){sets.push(`name=?`); vals.push(d.name)}
    if(d.description!==undefined){sets.push(`description=?`); vals.push(d.description)}
    if(d.fieldsJson!==undefined){sets.push(`fieldsJson=?`); vals.push(d.fieldsJson)}
    if(sets.length){
      sets.push(`updatedAt=CURRENT_TIMESTAMP`)
      await prisma.$executeRawUnsafe(`UPDATE "${TABLE}" SET ${sets.join(",")} WHERE id=?`, ...vals, id)
    }
    if(d.steps && Array.isArray(d.steps)){
      await prisma.$executeRawUnsafe(`DELETE FROM "${STEP_TABLE}" WHERE administrationId=?`, id)
      for(let i=0;i<d.steps.length;i++){
        const s=d.steps[i]
        await prisma.$executeRawUnsafe(`INSERT INTO "${STEP_TABLE}" (administrationId, stepOrder, templateId, dataMappingJson) VALUES (?,?,?,?)`, id, i+1, s.templateId, s.dataMappingJson ? JSON.stringify(s.dataMappingJson) : null)
      }
    }
    return this.findOne(id)
  },
  async remove(id:number){
    await prisma.$executeRawUnsafe(`DELETE FROM "${TABLE}" WHERE id=?`, id)
    return {id}
  },
  // Datas
  async listDatas(administrationId:number, q:any){
    const page=q.page??1; const limit=Math.min(q.limit??20,100); const offset=(page-1)*limit
    const count:any=await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM "${DATA_TABLE}" WHERE administrationId=?`, administrationId)
    const total=Number(count[0]?.total??0)
    const data:any=await prisma.$queryRawUnsafe(`SELECT * FROM "${DATA_TABLE}" WHERE administrationId=? ORDER BY id DESC LIMIT ? OFFSET ?`, administrationId, limit, offset)
    return {data,total,page,limit,totalPages:Math.ceil(total/limit)}
  },
  async createData(administrationId:number, d:any){
    await prisma.$executeRawUnsafe(`INSERT INTO "${DATA_TABLE}" (administrationId, name, valuesJson, stepsDataJson, updatedAt) VALUES (?,?,?,?, CURRENT_TIMESTAMP)`, administrationId, d.name, d.valuesJson?JSON.stringify(d.valuesJson):null, d.stepsDataJson?JSON.stringify(d.stepsDataJson):null)
    const rows:any=await prisma.$queryRawUnsafe(`SELECT * FROM "${DATA_TABLE}" WHERE administrationId=? ORDER BY id DESC LIMIT 1`, administrationId)
    return rows[0]
  }
}
