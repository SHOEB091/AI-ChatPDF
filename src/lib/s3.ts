import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { toast } from "react-hot-toast";

export async function uploadToS3(file: File) {
  try {
    // Log environment variables for debugging (remove in production)
    console.log("Region:", process.env.NEXT_PUBLIC_AWS_REGION);
    console.log("Bucket:", process.env.NEXT_PUBLIC_AWS_BUCKET_NAME);

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_AWS_REGION ||
        !process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ||
        !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ||
        !process.env.NEXT_PUBLIC_AWS_BUCKET_NAME) {
      throw new Error("AWS environment variables are not properly configured");
    }

    const s3Client = new S3Client({
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
      },
    });

    const fileName = file.name.replace(/\s/g, "-");
    const fileKey = `${Date.now()}-${fileName}`;

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: fileKey,
      Conditions: [
        ["content-length-range", 0, 10 * 1024 * 1024], // up to 10 MB
      ],
      Expires: 600, // 10 minutes
    });

    console.log("Presigned URL generated:", url);

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
      console.error("Upload response not OK:", uploadResponse.status, uploadResponse.statusText);
      throw new Error(`Failed to upload to S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    toast.success("File uploaded successfully!");

    return {
      file_key: fileKey,
      file_name: fileName,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    toast.error("Failed to upload file. Please try again.");
    throw error;
  }
}

export function getS3Url(file_key: string) {
  const url = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${file_key}`;
  return url;
}
