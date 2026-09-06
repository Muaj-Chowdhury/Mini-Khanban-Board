import { Router } from "express";
import { MemberRole } from "../../../generated/prisma/enums.js";
import { auth } from "../../middlewares/auth.js";
import { boardAuth } from "../../middlewares/boardAuth.js";
import { ColumnController } from "./column.controller.js";

const router = Router();
const columnController = new ColumnController();

router.get(
  "/:boardId/columns",
  auth(),
  boardAuth(MemberRole.VIEWER),
  columnController.get,
);

router.post(
  "/:boardId/columns",
  auth(),
  boardAuth(MemberRole.EDITOR),
  columnController.create,
);

router.patch(
  "/:boardId/columns/:columnId",
  auth(),
  boardAuth(MemberRole.EDITOR),
  columnController.update,
);

router.delete(
  "/:boardId/columns/:columnId",
  auth(),
  boardAuth(MemberRole.EDITOR),
  columnController.remove,
);

export const columnRoutes = router;
