import { Timestamp, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

import type {
  LearningAccessType,
  LearningCategory,
  LearningStatus,
} from "../types/learning-types";

export type CreateLearningInput = {
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
};

export async function createLearningContent(input: CreateLearningInput) {
  await addDoc(collection(db, "learningVideos"), {
    accessType: input.accessType,
    cloudinaryPublicId: input.cloudinaryPublicId,
    description: input.description,
    duration: input.duration,
    fileId: input.fileId || "",
    iD: `GMA-Content-${Date.now()}`,
    interestTags: input.interestTags,
    isBookmarked: false,
    thumbnailUrl: input.thumbnailUrl || "",
    title: input.title,

    category: input.category,
    categories: input.categories,

    status: input.status,
    createdBy: input.createdBy,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}