/**
 * Authentication Middleware
 *
 * Verifies JWT token, checks user roles, fetches user from database,
 * verifies active status, and attaches user data to request object
 * for downstream route handlers.
 */

import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { verifyToken } from "../utils/jwt";
import { AppError } from "../errors/AppError";
import { MemberRole } from "../../generated/prisma/enums";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string | null;
      };
    }
  }
}
export const auth = () => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    const token = req.cookies.accessToken ??
      (authorization?.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length)
        : authorization);

    if (!token) {
      throw new AppError("Unauthorized", 401);
    }
    const verifiedToken = verifyToken(token, config.jwt_access_secret);
    if (!verifiedToken.success)
      throw new AppError("Invalid or expired token", 401);

    const { id } = verifiedToken.data as JwtPayload & {
      id: string;
    };

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }
    
    req.user = {
      email: user.email,
      name: user.name,
      id: user.id,
    };
    next();
  });
};
