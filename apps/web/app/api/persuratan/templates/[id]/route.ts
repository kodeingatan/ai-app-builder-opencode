import { NextRequest, NextResponse } from "next/server"
import { PersuratanTemplatesService } from "@/lib/services/persuratan/templates.service"
export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}){ const {id}=await params; const r=await PersuratanTemplatesService.findOne(Number(id)); if(!r) return NextResponse.json({message:"Not found"},{status:404}); return NextResponse.json(r)}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){ const {id}=await params; const b=await req.json(); const r=await PersuratanTemplatesService.update(Number(id),b); return NextResponse.json(r)}
export async function DELETE(_:NextRequest,{params}:{params:Promise<{id:string}>}){ const {id}=await params; await PersuratanTemplatesService.remove(Number(id)); return NextResponse.json({id:Number(id)})}
