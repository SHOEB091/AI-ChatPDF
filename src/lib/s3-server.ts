import { S3 } from "@aws-sdk/client-s3";
import fs from "fs";
export async function downloadFromS3(file_key: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Verify environment variables
      if (!process.env.NEXT_PUBLIC_AWS_REGION ||
          !process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ||
          !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ||
          !process.env.NEXT_PUBLIC_AWS_BUCKET_NAME) {
        throw new Error("Missing required AWS environment variables");
      }

      console.log("Downloading from S3:", {
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
        fileKey: file_key
      });

      const s3 = new S3({
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
        },
      });
      const params = {
        Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
        Key: file_key,
      };

      const obj = await s3.getObject(params);
      // Save to the user's Downloads folder
      const homeDir = require('os').homedir();
      const file_name = `${homeDir}/Downloads/elliott${Date.now().toString()}.pdf`;

      if (obj.Body instanceof require("stream").Readable) {
        // AWS-SDK v3 has some issues with their typescript definitions, but this works
        // https://github.com/aws/aws-sdk-js-v3/issues/843
        //open the writable stream and write the file
        const file = fs.createWriteStream(file_name);
        file.on("open", function (fd) {
          // @ts-ignore
          obj.Body?.pipe(file).on("finish", () => {
            return resolve(file_name);
          });
        });
        // obj.Body?.pipe(fs.createWriteStream(file_name));
      }
    } catch (error) {
      console.error(error);
      reject(error);
      return null;
    }
  });
}

// downloadFromS3("uploads/1693568801787chongzhisheng_resume.pdf");
