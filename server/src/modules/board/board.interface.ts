/**
 * model Board {
  id          String        @id @default(uuid())
  title       String
  description String?
  ownerId     String
  owner       User          @relation("BoardOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     BoardMember[]
  columns     Column[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  @@index([ownerId])
}
 */
export interface CreateBoardPayload {
  title: string;
  description?: string;
}

export interface UpdateBoardPayload {
  title?: string;
  description?: string | null;
}

export interface ShareBoardPayload {
  userId: string;
  role?: "VIEWER" | "EDITOR";
}
