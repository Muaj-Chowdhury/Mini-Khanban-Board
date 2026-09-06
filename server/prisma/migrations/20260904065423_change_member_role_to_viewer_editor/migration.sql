/*
  Warnings:

  - The values [MEMBER,ADMIN] on the enum `MemberRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MemberRole_new" AS ENUM ('VIEWER', 'EDITOR');
ALTER TABLE "public"."BoardMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "BoardMember" ALTER COLUMN "role" TYPE "MemberRole_new" USING ("role"::text::"MemberRole_new");
ALTER TYPE "MemberRole" RENAME TO "MemberRole_old";
ALTER TYPE "MemberRole_new" RENAME TO "MemberRole";
DROP TYPE "public"."MemberRole_old";
ALTER TABLE "BoardMember" ALTER COLUMN "role" SET DEFAULT 'EDITOR';
COMMIT;

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_boardId_fkey";

-- AlterTable
ALTER TABLE "BoardMember" ALTER COLUMN "role" SET DEFAULT 'EDITOR';

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "position" SET DATA TYPE DOUBLE PRECISION;
