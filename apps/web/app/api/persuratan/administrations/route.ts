import { NextRequest, NextResponse } from "next/server"
import { PersuratanAdministrationsService } from "@/lib/services/persuratan/administrations.service"
import { z } from "zod"
const CreateSchema=z.object({ name:z.string().min(1), description:z.string().optional().nullable(), fieldsJson:z.string().optional().nullable(), steps:z.array(z.object({templateId:z.number(), dataMappingJson:z.any().optional()})).optional() })
export async function GET(req:NextRequest){
  try {
    const q=Object.fromEntries(req.nextUrl.searchParams)
    const r=await PersuratanAdministrationsService.findAll({page:Number(q.page)||1, limit:Number(q.limit)||20, search:q.search})
    return NextResponse.json(r)
  } catch(e:any){ return NextResponse.json({message:e.message ?? "Gagal memuat administrations", data:[], total:0, page:1, limit:20, totalPages:0},{status:500}) }
}
export async function POST(req:NextRequest){
  try{ const b=await req.json(); const p=CreateSchema.parse(b); const c=await PersuratanAdministrationsService.create(p); return NextResponse.json(c,{status:201}) }catch(e:any){ return NextResponse.json({message:e.message, errors:e.errors},{status:400})}
}
