import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
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
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");

    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          {
            ok: false,
            message: "Fecha inválida.",
          },
          { status: 400 }
        );
      }
    } else {
      targetDate = new Date();
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
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

    // Convertir Decimal a number
    const visitsWithNumbers = visits.map((visit) => ({
      ...visit,
      lat: typeof visit.lat === 'object' ? Number(visit.lat) : visit.lat,
      lng: typeof visit.lng === 'object' ? Number(visit.lng) : visit.lng,
    }));

    return NextResponse.json({
      ok: true,
      visits: visitsWithNumbers,
      date: targetDate.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error("Error en /api/visits/by-date:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Error al obtener las visitas.",
      },
      { status: 500 }
    );
  }
}



