import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

export async function uploadToS3(file: File) {
  try {
    const s3Client = new S3Client({
      region: process.env.NEXT_PUBLIC_AWS_REGION!,
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
      },
    });

    const fileName = file.name.replace(/\s/g, "-");
    const fileKey = `${Date.now()}-${fileName}`;

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
      Key: fileKey,
      Conditions: [
        ["content-length-range", 0, 10 * 1024 * 1024], // up to 10 MB
      ],
      Expires: 600, // 10 minutes
    });

    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append("file", file);

    const uploadResponse = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload to S3");
    }

    return {
      file_key: fileKey,
      file_name: fileName,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}
