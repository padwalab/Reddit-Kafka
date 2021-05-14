import redis from "redis";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

export let redisClient = redis.createClient(
  6379,
  "redis_cache"
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
