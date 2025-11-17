import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { distanceInMeters } from "@/lib/haversine";
import { getCheckinWindow } from "@/lib/time";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
    const params = await context.params;
    const visitId = parseInt(params.id);
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        {
          ok: false,
          message: "Latitud y longitud son requeridas.",
        },
        { status: 400 }
      );
    }

    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        professionalId: auth.userId,
      },
    });

    if (!visit) {
      return NextResponse.json(
        {
          ok: false,
          message: "Visita no encontrada.",
        },
        { status: 404 }
      );
    }

    const CHECKIN_RADIUS_METERS = parseInt(
      process.env.CHECKIN_RADIUS_METERS || "150",
      10
    );
    const CHECKIN_MINUTES_BEFORE_START = parseInt(
      process.env.CHECKIN_MINUTES_BEFORE_START || "10",
      10
    );
    const CHECKIN_MINUTES_AFTER_START = parseInt(
      process.env.CHECKIN_MINUTES_AFTER_START || "20",
      10
    );

    // Calcular ventana de tiempo
    const { startAllowed, endAllowed } = getCheckinWindow(
      visit.scheduledStart,
      CHECKIN_MINUTES_BEFORE_START,
      CHECKIN_MINUTES_AFTER_START
    );

    const now = new Date();
    const isValidTime = now >= startAllowed && now <= endAllowed;

    // Calcular distancia (convertir Decimal a number)
    const visitLat = typeof visit.lat === 'object' ? Number(visit.lat) : visit.lat;
    const visitLng = typeof visit.lng === 'object' ? Number(visit.lng) : visit.lng;
    const distance = Math.round(
      distanceInMeters(visitLat, visitLng, lat, lng)
    );
    const isValidRadius = distance <= CHECKIN_RADIUS_METERS;

    // Crear registro de check-in
    await prisma.visitCheckin.create({
      data: {
        visitId: visit.id,
        professionalId: auth.userId,
        lat,
        lng,
        distanceMeters: distance,
        isValidTime,
        isValidRadius,
      },
    });

    // Actualizar estado de la visita si ambos son válidos
    if (isValidTime && isValidRadius) {
      await prisma.visit.update({
        where: { id: visit.id },
        data: {
          status: "DONE",
        },
      });
    }

    let message = "Asistencia registrada correctamente.";
    if (!isValidTime) {
      message = "La asistencia no puede registrarse: fuera del horario permitido.";
    } else if (!isValidRadius) {
      message = "La asistencia no puede registrarse: fuera del radio permitido.";
    }

    return NextResponse.json({
      ok: true,
      isValidTime,
      isValidRadius,
      distanceMeters: distance,
      message,
    });
  } catch (error) {
    console.error("Error en /api/visits/[id]/checkin:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Error al registrar la asistencia.",
      },
      { status: 500 }
    );
  }
}

