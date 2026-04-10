import jwt from "jsonwebtoken";

interface emailPayload extends jwt.JwtPayload {
  email: string;
  userId: string;
}

export type { emailPayload };