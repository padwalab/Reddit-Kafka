import dotenv from "dotenv";
import AWS from "aws-sdk";

dotenv.config({ path: ".env" });

// S3 configuraton
export const S3 = new AWS.S3({
  accessKeyId: "AKIA3QMVMK4L6CF5EFMA",
  secretAccessKey: "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",
  region: "us-east-2",
});
