import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendLoginCodeEmail } from "@/lib/gmail";

function normalizeRut(rut: string): string {
  if (!rut) return "";
  return rut
    .replace(/\./g, "")
    .replace(/-/g, "")
    .replace(/\s/g, "")
    .toUpperCase();
}

function generateLoginCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { rut } = await request.json();

    if (!rut) {
      return NextResponse.json(
        {
          ok: false,
          message: "El RUT es requerido.",
        },
        { status: 400 }
      );
    }

    const normalizedRut = normalizeRut(rut);
    const LOGIN_CODE_EXP_MINUTES = parseInt(
      process.env.LOGIN_CODE_EXP_MINUTES || "10",
      10
    );

    const user = await prisma.user.findFirst({
      where: {
        rut: normalizedRut,
        isActive: true,
      },
    });

    // Siempre devolver mensaje neutro
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "Si el RUT está registrado, se ha enviado un código a su correo.",
      });
    }

    const code = generateLoginCode();
    const codeHash = await bcrypt.hash(code, 10);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + LOGIN_CODE_EXP_MINUTES);

    await prisma.loginCode.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt,
      },
    });

    await sendLoginCodeEmail(user.email, code, LOGIN_CODE_EXP_MINUTES);

    return NextResponse.json({
      ok: true,
      message: "Si el RUT está registrado, se ha enviado un código a su correo.",
    });
  } catch (error) {
    console.error("Error en /api/auth/request-code:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Error al procesar la solicitud.",
      },
      { status: 500 }
    );
  }
}

