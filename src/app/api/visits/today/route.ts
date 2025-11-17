import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const visits = await prisma.visit.findMany({
      where: {
        professionalId: auth.userId,
        scheduledStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        scheduledStart: "asc",
      },
    });

    return NextResponse.json({
      ok: true,
      visits,
    });
  } catch (error) {
    console.error("Error en /api/visits/today:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Error al obtener las visitas.",
      },
      { status: 500 }
    );
  }
}

