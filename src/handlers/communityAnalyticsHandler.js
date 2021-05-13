import { sqlDB } from "../config/queries.js";
import Community from "../models/Community.js";
import { communityAnalyticsResProducer } from "../kafka/producers/communityAnalyticsResProducer.js";
import { communityAnalyticsReqConsumer } from "../kafka/consumers/communityAnalyticsReqConsumer.js";
communityAnalyticsResProducer.connect();
export let communityAnalyticsHandler = {};

// @route GET api/community-analytics/
// @desc analytics
// @access Private
communityAnalyticsHandler.analytics = async (id, params, user) => {
  const communities = await Community.find({ creatorID: user.id }).limit(10);
  if (communities.length > 0) {
    let communityIds = [];
    const communityInfo = communities.map((community) => {
      return {
        communityName: community.communityName,
        userCount: community.subscribers.length,
      };
    });
    const postInfo = communities.map((community) => {
      return {
        communityName: community.communityName,
        postCount: community.posts.length,
      };
    });

    let postsInfo = [];
    for (let i = 0; i < communities.length; i++) {
      if (communities[i]) {
        for (let j = 0; j < communities[i].posts.length; j++) {
          const post = await sqlDB.getUpVotesforPost(communities[i].posts[j]);
          postsInfo = postsInfo.concat({
            communityName: communities[i].communityName,
            postInfo: post,
          });
        }
        communityIds = communityIds.concat(communities[i]._id);
      }
    }

    const userCount = await sqlDB.getUserWithPostCount(communityIds);
    const maxPost = await userCount.map(async (usr) => {
      return {
        user: usr.creatorName,
        postCount: usr.postCount,
      };
    });
    const userMaxPost = await Promise.all(maxPost);

    postsInfo.sort((a, b) => b.postInfo.upvotes - a.postInfo.upvotes);
    postInfo.sort((a, b) => b.postCount - a.postCount);
    userMaxPost.sort((c, d) => d.postCount - c.postCount);
    communityInfo.sort((e, f) => f.userCount - e.userCount);
    if (postsInfo.length > 10) {
      postsInfo.length = 10;
    }
    if (userMaxPost.length > 10) {
      userMaxPost.length = 10;
    }
    communityAnalyticsResProducer.send({
      topic: "analytics_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: {
              MaxUserCount: communityInfo,
              MaxPostCount: postInfo,
              UpvotedPost: postsInfo,
              UserMaxPost: userMaxPost,
            },
          }),
        },
      ],
    });
    // res.json({
    //   MaxUserCount: communityInfo,
    //   MaxPostCount: postInfo,
    //   UpvotedPost: postsInfo,
    //   UserMaxPost: userMaxPost,
    // });
  } else {
    communityAnalyticsResProducer.send({
      topic: "analytics_response",
      messages: [
        {
          value: JSON.stringify({
            id,
            status: 200,
            data: "You do not own a community",
          }),
        },
      ],
    });
    // res.send("You do not own a community");
  }
};
