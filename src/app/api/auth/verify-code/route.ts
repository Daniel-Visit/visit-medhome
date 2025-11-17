import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signAuthToken, setAuthCookie } from "@/lib/auth";

function normalizeRut(rut: string): string {
  if (!rut) return "";
  return rut
    .replace(/\./g, "")
    .replace(/-/g, "")
    .replace(/\s/g, "")
    .toUpperCase();
}

function formatRut(rut: string): string {
  const normalized = normalizeRut(rut);
  if (normalized.length < 2) return normalized;
  const body = normalized.slice(0, -1);
  const dv = normalized.slice(-1);
  return `${body}-${dv}`;
}

export async function POST(request: NextRequest) {
  try {
    const { rut, code } = await request.json();

    if (!rut || !code) {
      return NextResponse.json(
        {
          ok: false,
          message: "RUT y código son requeridos.",
        },
        { status: 400 }
      );
    }

    const normalizedRut = normalizeRut(rut);

    const user = await prisma.user.findFirst({
      where: {
        rut: normalizedRut,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Código inválido o expirado.",
        },
        { status: 400 }
      );
    }

    const loginCode = await prisma.loginCode.findFirst({
      where: {
        userId: user.id,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!loginCode) {
      return NextResponse.json(
        {
          ok: false,
          message: "Código inválido o expirado.",
        },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(code, loginCode.codeHash);

    if (!isValid) {
      return NextResponse.json(
        {
          ok: false,
          message: "Código inválido o expirado.",
        },
        { status: 400 }
      );
    }

    // Marcar código como usado
    await prisma.loginCode.update({
      where: { id: loginCode.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Generar JWT
    const token = await signAuthToken({
      userId: user.id,
      rut: user.rut,
      name: user.name,
    });

    // Guardar en cookie
    setAuthCookie(token);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        rut: formatRut(user.rut),
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error en /api/auth/verify-code:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Error al verificar el código.",
      },
      { status: 500 }
    );
  }
}

