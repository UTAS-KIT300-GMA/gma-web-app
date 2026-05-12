import type { Timestamp } from "firebase/firestore";

export type LearningAccessType = "free" | "paid";
export type LearningStatus = "draft" | "published";
export type LearningCategory = "connect" | "grow" | "thrive";

export interface LearningContent {
  id: string;

  title: string;
  description: string;
  duration: string;

  accessType: LearningAccessType;

  cloudinaryPublicId: string;
  fileId?: string;

  thumbnailUrl?: string;

  category: LearningCategory;
  categories: LearningCategory[];

  interestTags: string[];

  status: LearningStatus;

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}