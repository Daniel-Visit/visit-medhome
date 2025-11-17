import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "un_secreto_seguro");
const JWT_MAX_AGE_SECONDS = 60 * 10; // 10 minutos

export type AuthPayload = {
  userId: number;
  rut: string;
  name: string;
};

export async function signAuthToken(payload: AuthPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${JWT_MAX_AGE_SECONDS}s`)
    .sign(JWT_SECRET);
  return token;
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as AuthPayload;
}

export function setAuthCookie(token: string) {
  cookies().set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: JWT_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
}

export async function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}

