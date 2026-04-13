import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be set in environment variables (minimum 32 characters). " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
}

export interface JwtPayload {
  id:    string;
  email: string;
  name:  string;
  role:  "ADMIN" | "SELLER" | "CLIENT";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.replace("Bearer ", "");
}
