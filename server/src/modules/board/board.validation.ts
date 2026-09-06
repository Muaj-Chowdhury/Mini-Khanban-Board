import { MemberRole } from "../../../generated/prisma/enums.js";
import { AppError } from "../../errors/AppError.js";
import type { ShareBoardPayload } from "./board.interface.js";

export function validateShareBoard(
  body: Record<string, unknown> = {},
): ShareBoardPayload {
  if (typeof body.userId !== "string" || body.userId.trim().length === 0) {
    throw new AppError("userId is required", 400);
  }

  if (
    body.role !== undefined &&
    (typeof body.role !== "string" ||
      !Object.values(MemberRole).includes(body.role as MemberRole))
  ) {
    throw new AppError("role must be VIEWER or EDITOR", 400);
  }

  const allowedFields = new Set(["userId", "role"]);
  const extraFields = Object.keys(body).filter(
    (key) => !allowedFields.has(key),
  );
  if (extraFields.length > 0) {
    throw new AppError(`Unexpected fields: ${extraFields.join(", ")}`, 400);
  }

  return {
    userId: body.userId.trim(),
    role: (body.role as ShareBoardPayload["role"]) ?? "EDITOR",
  };
}

export interface ValidCreateBoardPayload {
  title: string;
  description?: string | null;
}

export interface ValidUpdateBoardPayload {
  title?: string;
  description?: string | null;
}

export function validateCreateBoard(
  body: Record<string, unknown> = {},
): ValidCreateBoardPayload {
  // title is required and must be a non-empty string
  if (
    !body.title ||
    typeof body.title !== "string" ||
    body.title.trim().length === 0
  ) {
    throw new AppError(
      "Board title is required and must be a non-empty string",
      400,
    );
  }

  // description is optional but must be a string if provided
  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    throw new AppError("Board description must be a string", 400);
  }

  // Reject unknown/unsupported fields
  const allowedFields = new Set(["title", "description"]);
  const extraFields = Object.keys(body).filter(
    (key) => !allowedFields.has(key),
  );
  if (extraFields.length > 0) {
    throw new AppError(`Unexpected fields: ${extraFields.join(", ")}`, 400);
  }

  return {
    title: body.title.trim(),
    description:
      body.description !== undefined
        ? (body.description as string).trim() || null
        : undefined,
  };
}

export function validateUpdateBoard(
  body: Record<string, unknown> = {},
): ValidUpdateBoardPayload {
  // If nothing to update, error
  if (Object.keys(body).length === 0) {
    throw new AppError("No fields provided to update", 400);
  }

  // Explicitly reject ownerId
  if (body.ownerId !== undefined) {
    throw new AppError("ownerId cannot be updated", 400);
  }

  // title must be a non-empty string if provided
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      throw new AppError("Board title must be a non-empty string", 400);
    }
  }

  // description must be a string or null if provided
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== "string") {
      throw new AppError("Board description must be a string or null", 400);
    }
  }

  // Reject unknown/unsupported fields
  const allowedFields = new Set(["title", "description"]);
  const extraFields = Object.keys(body).filter(
    (key) => !allowedFields.has(key),
  );
  if (extraFields.length > 0) {
    throw new AppError(`Unexpected fields: ${extraFields.join(", ")}`, 400);
  }

  return {
    ...(body.title !== undefined && { title: (body.title as string).trim() }),
    ...(body.description !== undefined && {
      description:
        body.description !== null
          ? (body.description as string).trim() || null
          : null,
    }),
  };
}
