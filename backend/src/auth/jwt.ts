import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export type JwtPayload = { userId: string };

export function signToken(userId: string, secret: Secret, expiresIn: SignOptions["expiresIn"]) {
  const payload: JwtPayload = { userId };
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string, secret: Secret): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}