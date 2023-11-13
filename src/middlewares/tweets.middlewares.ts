import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType } from '~/constants/enums'
import { TWEET_MESSAGE } from '~/constants/message'
import { numberEnumToArray } from '~/utils/common'
import { validate } from '~/utils/validation'

const tweetsTypes = numberEnumToArray(TweetType)
const tweetAudience = numberEnumToArray(TweetAudience)
const mediaTypes = numberEnumToArray(MediaType)
export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetsTypes],
        errorMessage: TWEET_MESSAGE.TYPE_IS_INVALID
      }
    },
    audience: {
      isIn: {
        options: [tweetAudience],
        errorMessage: TWEET_MESSAGE.AUDIENCE_IS_INVALID
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          // Nếu type là Retweet, Comment, QuoteTweet thì parent_id là `tweet_id` của tweet cha
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            if (!value) throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
          }
          // Nếu type là Tweet thì parent_id là null
          if (type === TweetType.Tweet && value !== null) throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_NULL)
          return true
        }
      }
    },
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mentions = req.body.mentions as string[]
          // Nếu type là Comment, quoteTweet, Tweet và không có 'mentions' và 'hashtags' thì content là string và length > 1
          if (
            [TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mentions) &&
            value === ''
          ) {
            if (!value) throw new Error(TWEET_MESSAGE.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
          }
          // Nếu type là Retweet thì content là ''
          if (type === TweetType.Retweet && value !== '') throw new Error(TWEET_MESSAGE.CONTENT_MUST_BE_EMPTY_STRING)
          return true
        }
      }
    },

    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu hashtags là mảng các string
          if (!value.every((item: any) => typeof item === 'string')) {
            throw new Error(TWEET_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY_STRING)
          }
          return true
        }
      }
    },

    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu hashtags là mảng các user_id
          if (!value.every((item: any) => ObjectId.isValid(item))) {
            throw new Error(TWEET_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID)
          }
          return true
        }
      }
    },

    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong array là media object
          if (
            value.some((item: any) => {
              return typeof item.url !== 'string' || !mediaTypes.includes(item.type)
            })
          ) {
            throw new Error(TWEET_MESSAGE.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
          }
          return true
        }
      }
    }
  })
)
