/**
 * Uploads an image file to Cloudinary using an unsigned upload preset.
 * 
 * @param file The File or Blob object to upload.
 * @returns The secure URL of the uploaded image.
 */
export const uploadToCloudinary = async (file: File | Blob): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Missing Cloudinary environment variables");
    // For local testing without ENV vars, we'll throw or return a dummy url.
    // Replace with real throw in production if needed.
    return 'https://via.placeholder.com/400x500.png?text=Dummy+Cloudinary+URL';
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
};
