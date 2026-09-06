import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { TaskService } from "./task.service.js";
import {
  validateCreateTask,
  validateMoveTask,
  validateUpdateTask,
} from "./task.validation.js";

const taskService = new TaskService();

export class TaskController {
  create = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const columnId = req.params.columnId as string;
    const payload = validateCreateTask(req.body);
    const task = await taskService.createTask(boardId, columnId, payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Task created successfully",
      data: task,
    });
  });

  get = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const columnId = req.params.columnId as string;
    const tasks = await taskService.getTasks(boardId, columnId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Tasks fetched successfully",
      data: tasks,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const columnId = req.params.columnId as string;
    const taskId = req.params.taskId as string;
    const payload = validateUpdateTask(req.body);
    const task = await taskService.updateTask(
      boardId,
      columnId,
      taskId,
      payload,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Task updated successfully",
      data: task,
    });
  });

  move = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const taskId = req.params.taskId as string;
    const payload = validateMoveTask(req.body);
    const task = await taskService.moveTask(
      boardId,
      taskId,
      payload.targetColumnId,
      payload.position,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Task moved successfully",
      data: task,
    });
  });

  remove = catchAsync(async (req: Request, res: Response) => {
    const boardId = req.params.boardId as string;
    const taskId = req.params.taskId as string;

    await taskService.deleteTask(boardId, taskId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Task deleted successfully",
      data: null,
    });
  });
}
