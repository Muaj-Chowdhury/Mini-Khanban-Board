import { Router } from "express";
import { MemberRole } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import { boardAuth } from "../../middlewares/boardAuth.js";
import { TaskController } from "./task.controller.js";

const router = Router();
const taskController = new TaskController();

router.post(
  "/:boardId/columns/:columnId/tasks",
  auth(),
  boardAuth(MemberRole.EDITOR),
  taskController.create,
);

router.get(
  "/:boardId/columns/:columnId/tasks",
  auth(),
  boardAuth(MemberRole.VIEWER),
  taskController.get,
);

router.patch(
  "/:boardId/columns/:columnId/tasks/:taskId",
  auth(),
  boardAuth(MemberRole.EDITOR),
  taskController.update,
);

router.patch(
  "/:boardId/tasks/:taskId/move",
  auth(),
  boardAuth(MemberRole.EDITOR),
  taskController.move,
);

router.delete(
  "/:boardId/tasks/:taskId",
  auth(),
  boardAuth(MemberRole.EDITOR),
  taskController.remove,
);

export const taskRoutes = router;
