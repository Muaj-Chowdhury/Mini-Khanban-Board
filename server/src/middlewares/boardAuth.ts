/**
 * Board Authorization Middleware
 *
 * Must be used AFTER the `auth()` middleware (which sets req.user).
 *
 * Flow:
 * 1. Extract boardId from req.params.boardId
 * 2. Find the Board (with ownerId)
 * 3. If req.user is the board owner → full access (skip role check)
 * 4. If not owner, look up BoardMember record
 * 5. If no membership record → 403
 * 6. If member role not in requiredRoles → 403
 * 7. Otherwise → attach req.board and call next()
 */

import { NextFunction, Request, Response } from "express";
import { MemberRole } from "../../generated/prisma/enums";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";

declare global {
  namespace Express {
    interface Request {
      board?: {
        id: string;
        title: string;
        ownerId: string;
        role?: MemberRole;
      };
    }
  }
}

export const boardAuth = (...requiredRoles: MemberRole[]) => {
  return catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
      const boardId =
        typeof req.params.boardId === "string"
          ? req.params.boardId
          : undefined;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError("User not authenticated", 401);
      }
      if (!boardId) {
        throw new AppError("Board ID is required", 400);
      }

      const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: {
          id: true,
          title: true,
          ownerId: true,
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      });

      if (!board) {
        throw new AppError("Board not found", 404);
      }

      // ── Owner check ──────────────────────────────────────
      if (board.ownerId === userId) {
        req.board = {
          id: board.id,
          title: board.title,
          ownerId: board.ownerId,
        };
        return next();
      }

      // ── Member check ──────────────────────────────────────
      const membership = board.members[0];
      if (!membership) {
        throw new AppError("You are not a member of this board", 403);
      }

      // ── Role check ────────────────────────────────────────
      if (requiredRoles.length > 0 && !requiredRoles.includes(membership.role)) {
        throw new AppError(
          `Insufficient permissions. Required role(s): ${requiredRoles.join(", ")}`,
          403,
        );
      }

      req.board = {
        id: board.id,
        title: board.title,
        ownerId: board.ownerId,
        role: membership.role,
      };

      next();
    },
  );
};
