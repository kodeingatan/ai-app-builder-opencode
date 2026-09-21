import { NextRequest, NextResponse } from "next/server"
import { PersuratanComponentsService } from "@/lib/services/persuratan/components.service"
import { z } from "zod"
const CreateSchema = z.object({ name: z.string().min(1), isLooping: z.boolean().optional(), contentHtml: z.string().min(1), contentJson: z.string().optional().nullable(), bindingsJson: z.string().optional().nullable() })
export async function GET(req: NextRequest){
  try {
    const q=Object.fromEntries(req.nextUrl.searchParams)
    const r=await PersuratanComponentsService.findAll({ page: Number(q.page)||1, limit: Number(q.limit)||20, search: q.search })
    return NextResponse.json(r)
  } catch(e:any){ return NextResponse.json({message:e.message ?? "Gagal memuat components", data:[], total:0, page:1, limit:20, totalPages:0},{status:500}) }
}
export async function POST(req: NextRequest){
  try{
    const b=await req.json()
    const p=CreateSchema.parse(b)
    const c=await PersuratanComponentsService.create(p)
    return NextResponse.json(c,{status:201})
  }catch(e:any){ return NextResponse.json({message:e.message, errors:e.errors}, {status:400})}
}
