//import {db} from "./src/models/index.js";
import { userHandler } from "./src/handlers/userHandler.js";
import db from "./src/models/index.js";
import { messageHandler } from "./src/handlers/messageHandler.js";
import { communityHandler } from "./src/handlers/communityHandler.js";
import { communitySearchHandler } from "./src/handlers/communitySearchHandler.js";
import { commentHandler } from "./src/handlers/commentHandler.js";
import { communityHomeHandler } from "./src/handlers/communityHomeHandler.js";
import { dashboardHandler } from "./src/handlers/dashboardHandler.js";
import { inviteHandler } from "./src/handlers/inviteHandler.js";
import { moderationHandler } from "./src/handlers/moderationHandler.js";
import { postHandler } from "./src/handlers/postHandler.js";
import { communityAnalyticsHandler } from "./src/handlers/communityAnalyticsHandler.js";
import { redisClient } from "./src/config/redisClient.js";

const redis = redisClient;

new db();
