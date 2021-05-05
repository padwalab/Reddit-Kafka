import redis from "redis";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

export const redisClient = redis.createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_HOST
);

redisClient.on("connect", () => {
  console.log("connected..");
});
redisClient.on("ready", () => {
  console.log("redis connected and ready to use..");
});
redisClient.on("error", (error) => {
  console.log(error.message);
});
redisClient.on("end", () => {
  console.log("redis client disconnected..");
});
