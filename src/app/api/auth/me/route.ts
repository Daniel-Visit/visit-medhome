import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const auth = await getAuthUser();

  if (!auth) {
    return NextResponse.json(
      {
        ok: false,
        message: "No autenticado.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: auth,
  });
}

