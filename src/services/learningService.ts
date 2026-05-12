import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

import type {
  LearningAccessType,
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

  category: string;
  interestTags: string[];

  status: LearningStatus;

  createdBy: string;
};

export type UpdateLearningInput = Omit<CreateLearningInput, "createdBy">;

export async function createLearningContent(input: CreateLearningInput) {
  await addDoc(collection(db, "learningVideos"), {
    title: input.title,
    description: input.description,
    duration: input.duration,

    accessType: input.accessType,

    cloudinaryPublicId: input.cloudinaryPublicId,
    fileId: input.fileId || "",
    thumbnailUrl: input.thumbnailUrl || "",

    category: input.category,
    categories: [input.category],
    interestTags: input.interestTags,

    status: input.status,

    createdBy: input.createdBy,

    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),

    iD: `GMA-Content-${Date.now()}`,
    isBookmarked: false,
  });
}

export async function updateLearningContent(
  learningId: string,
  input: UpdateLearningInput,
) {
  await updateDoc(doc(db, "learningVideos", learningId), {
    title: input.title,
    description: input.description,
    duration: input.duration,

    accessType: input.accessType,

    cloudinaryPublicId: input.cloudinaryPublicId,
    fileId: input.fileId || "",
    thumbnailUrl: input.thumbnailUrl || "",

    category: input.category,
    categories: [input.category],
    interestTags: input.interestTags,

    status: input.status,

    updatedAt: Timestamp.now(),
  });
}

export async function getLearningContentById(learningId: string) {
  const snap = await getDoc(doc(db, "learningVideos", learningId));

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data(),
  };
}