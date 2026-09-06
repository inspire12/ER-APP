import { jwtVerify, SignJWT } from "jose";

const encoder = new TextEncoder();

function getSecret() {
  return encoder.encode(process.env.AUTH_SECRET ?? "development-only-secret-change-me");
}

export async function createStaffSession() {
  return new SignJWT({ role: "staff" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyStaffSession(token?: string) {
  if (!process.env.STAFF_PASSWORD) return process.env.NODE_ENV !== "production";
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "staff";
  } catch {
    return false;
  }
}
