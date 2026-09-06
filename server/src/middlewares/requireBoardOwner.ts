/**
 * requireBoardOwner Middleware
 *
 * Must be used AFTER the `auth()` middleware (which sets req.user).
 *
 * Responsibility:
 * - Assumes req.user exists (authentication already done)
 * - Extracts boardId from req.params.boardId
 * - Finds the board; 404 if missing
 * - 403 if authenticated user is not the board owner
 * - Otherwise calls next()
 */

import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { prisma } from "../lib/prisma";
import { AppError } from "../errors/AppError";

export const requireBoardOwner = () => {
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
        select: { id: true, ownerId: true },
      });

      if (!board) {
        throw new AppError("Board not found", 404);
      }

      if (board.ownerId !== userId) {
        throw new AppError(
          "Only the board owner can perform this action",
          403,
        );
      }

      next();
    },
  );
};
