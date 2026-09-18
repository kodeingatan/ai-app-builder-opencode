import { NextRequest, NextResponse } from "next/server"
import { PersuratanAdministrationsService } from "@/lib/services/persuratan/administrations.service"
export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}){ const {id}=await params; const r=await PersuratanAdministrationsService.findOne(Number(id)); if(!r) return NextResponse.json({message:"Not found"},{status:404}); return NextResponse.json(r)}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){ const {id}=await params; const b=await req.json(); const r=await PersuratanAdministrationsService.update(Number(id),b); return NextResponse.json(r)}
export async function DELETE(_:NextRequest,{params}:{params:Promise<{id:string}>}){ const {id}=await params; await PersuratanAdministrationsService.remove(Number(id)); return NextResponse.json({id:Number(id)})}
