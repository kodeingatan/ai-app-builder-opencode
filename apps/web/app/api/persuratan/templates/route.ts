import { NextRequest, NextResponse } from "next/server"
import { PersuratanTemplatesService } from "@/lib/services/persuratan/templates.service"
import { z } from "zod"
const CreateSchema=z.object({ name:z.string().min(1), description:z.string().optional().nullable(), contentHtml:z.string().min(1), componentsJson:z.string().optional().nullable() })
export async function GET(req:NextRequest){
  const q=Object.fromEntries(req.nextUrl.searchParams)
  const r=await PersuratanTemplatesService.findAll({page:Number(q.page)||1, limit:Number(q.limit)||20, search:q.search})
  return NextResponse.json(r)
}
export async function POST(req:NextRequest){
  try{ const b=await req.json(); const p=CreateSchema.parse(b); const c=await PersuratanTemplatesService.create(p); return NextResponse.json(c,{status:201}) }catch(e:any){ return NextResponse.json({message:e.message},{status:400})}
}
