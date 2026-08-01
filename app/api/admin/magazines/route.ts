import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    const docRef = await dbAdmin.collection("magazines").add({
      ...cleanData,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });
  } catch (error: any) {
    console.error("[API /api/admin/magazines POST error]", error);
    return NextResponse.json({ error: error.message || "Failed to create magazine" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, data } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Magazine ID is required" }, { status: 400 });
    }

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    await dbAdmin.collection("magazines").doc(id).set(
      {
        ...cleanData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API /api/admin/magazines PUT error]", error);
    return NextResponse.json({ error: error.message || "Failed to update magazine" }, { status: 500 });
  }
}
