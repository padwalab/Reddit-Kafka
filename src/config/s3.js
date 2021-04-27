import dotenv from "dotenv";
import AWS from "aws-sdk";

dotenv.config({ path: ".env" });

// S3 configuraton
export const S3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
});
