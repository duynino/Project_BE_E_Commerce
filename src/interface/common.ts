import jwt from "jsonwebtoken";

interface emailPayload extends jwt.JwtPayload {
  email: string;
  userId: string;
}

interface JwtRequest extends Request {
  userId?: string;
  email?: string;
}

export type { emailPayload, JwtRequest };