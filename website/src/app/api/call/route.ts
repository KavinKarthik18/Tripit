import { NextResponse } from "next/server";

export async function GET() {
  const callId = Math.random().toString(36).substr(2, 9); // Generate random call ID
  return NextResponse.json({ callLink: `/map?call=${callId}` });
}