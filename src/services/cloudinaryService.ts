type CloudinaryResourceType = "image" | "video";

async function uploadToCloudinary(
  file: File,
  resourceType: CloudinaryResourceType,
  folder: string,
): Promise<{ publicId: string; secureUrl: string }> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary environment variables are missing.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to upload ${resourceType} to Cloudinary.`);
  }

  const data = await response.json();

  return {
    publicId: data.public_id,
    secureUrl: data.secure_url,
  };
}

export async function uploadVideoToCloudinary(file: File): Promise<string> {
  const result = await uploadToCloudinary(file, "video", "learning");
  return result.publicId;
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const result = await uploadToCloudinary(file, "image", "learning-thumbnails");
  return result.secureUrl;
}