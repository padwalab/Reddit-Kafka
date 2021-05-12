import db from "./src/models/index.js";
import userHandler from "./src/handlers/userHandler.js";
import messageHandler from "./src/handlers/messageHandler.js";
import communityHandler from "./src/handlers/communityHandler.js";
import communitySearchHandler from "./src/handlers/communitySearchHandler.js";
import communityAnalyticsHandler from "./src/handlers/communityAnalyticsHandler.js";
import { redisClient } from "./src/config/redisClient.js";

const redis = redisClient;

new db();
