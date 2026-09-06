import { AppError } from "../../errors/AppError.js";
import type { CreateColumnPayload } from "./column.interface.js";

export interface ValidUpdateColumnPayload {
  title?: string;
}

export function validateCreateColumn(
  body: Record<string, unknown> = {},
): CreateColumnPayload {
  if (typeof body.title !== "string" || body.title.trim().length === 0) {
    throw new AppError(
      "Column title is required and must be a non-empty string",
      400,
    );
  }

  const extraFields = Object.keys(body).filter((key) => key !== "title");
  if (extraFields.length > 0) {
    throw new AppError(`Unexpected fields: ${extraFields.join(", ")}`, 400);
  }

  return { title: body.title.trim() };
}

export function validateUpdateColumn(
  body: Record<string, unknown> = {},
): ValidUpdateColumnPayload {
  if (Object.keys(body).length === 0) {
    throw new AppError("No fields provided to update", 400);
  }

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      throw new AppError("Column title must be a non-empty string", 400);
    }
  }

  const extraFields = Object.keys(body).filter((key) => key !== "title");
  if (extraFields.length > 0) {
    throw new AppError(`Unexpected fields: ${extraFields.join(", ")}`, 400);
  }

  return {
    ...(body.title !== undefined && { title: body.title.trim() }),
  };
}
