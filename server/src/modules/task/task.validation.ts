import { TaskPriority } from "../../../generated/prisma/enums.js";
import { AppError } from "../../errors/AppError.js";
import type {
  CreateTaskPayload,
  MoveTaskPayload,
  UpdateTaskPayload,
} from "./task.interface.js";

export function validateMoveTask(
  body: Record<string, unknown> = {},
): MoveTaskPayload {
  if (
    typeof body.targetColumnId !== "string" ||
    body.targetColumnId.trim().length === 0
  ) {
    throw new AppError("targetColumnId is required", 400);
  }

  if (typeof body.position !== "number" || !Number.isFinite(body.position)) {
    throw new AppError("position must be a finite number", 400);
  }

  const extraFields = Object.keys(body).filter(
    (key) => !["targetColumnId", "position"].includes(key),
  );
  if (extraFields.length > 0) {
    throw new AppError(`Unexpected fields: ${extraFields.join(", ")}`, 400);
  }

  return {
    targetColumnId: body.targetColumnId.trim(),
    position: body.position,
  };
}

function parseDueDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new AppError("dueDate must be a valid date", 400);
  }
  return new Date(value);
}

function validatePriority(value: unknown): TaskPriority {
  if (
    typeof value !== "string" ||
    !Object.values(TaskPriority).includes(value as TaskPriority)
  ) {
    throw new AppError("priority must be LOW, MEDIUM, or HIGH", 400);
  }
  return value as TaskPriority;
}

export function validateCreateTask(
  body: Record<string, unknown> = {},
): CreateTaskPayload {
  if (typeof body.title !== "string" || body.title.trim().length === 0) {
    throw new AppError(
      "Task title is required and must be a non-empty string",
      400,
    );
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    throw new AppError("Task description must be a string or null", 400);
  }

  const priority =
    body.priority === undefined
      ? TaskPriority.MEDIUM
      : validatePriority(body.priority);
  const dueDate = parseDueDate(body.dueDate);
  const extraFields = Object.keys(body).filter(
    (key) => !["title", "description", "priority", "dueDate"].includes(key),
  );

  if (extraFields.length > 0) {
    throw new AppError(`Unexpected fields: ${extraFields.join(", ")}`, 400);
  }

  return {
    title: body.title.trim(),
    description:
      body.description === undefined
        ? undefined
        : body.description === null
          ? null
          : body.description.trim() || null,
    priority,
    dueDate,
  };
}

export function validateUpdateTask(
  body: Record<string, unknown> = {},
): UpdateTaskPayload {
  if (Object.keys(body).length === 0) {
    throw new AppError("No fields provided to update", 400);
  }

  if (
    body.title !== undefined &&
    (typeof body.title !== "string" || body.title.trim().length === 0)
  ) {
    throw new AppError("Task title must be a non-empty string", 400);
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    throw new AppError("Task description must be a string or null", 400);
  }

  const priority =
    body.priority === undefined ? undefined : validatePriority(body.priority);
  const dueDate = parseDueDate(body.dueDate);
  const extraFields = Object.keys(body).filter(
    (key) => !["title", "description", "priority", "dueDate"].includes(key),
  );

  if (extraFields.length > 0) {
    throw new AppError(`Unexpected fields: ${extraFields.join(", ")}`, 400);
  }

  return {
    ...(body.title !== undefined && { title: body.title.trim() }),
    ...(body.description !== undefined && {
      description:
        body.description === null ? null : body.description.trim() || null,
    }),
    ...(priority !== undefined && { priority }),
    ...(body.dueDate !== undefined && { dueDate }),
  };
}
