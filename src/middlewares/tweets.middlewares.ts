import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { TWEET_MESSAGE, USER_MESSAGE } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/common'
import { wrapRequestHandler } from '~/utils/handler'
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

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value))
              throw new ErrorWithStatus({
                message: TWEET_MESSAGE.TWEET_ID_IS_INVALID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            const tweet = (
              await databaseService.tweets
                .aggregate<Tweet>([
                  {
                    $match: {
                      _id: new ObjectId(value)
                    }
                  },
                  {
                    $lookup: {
                      from: 'hashtags',
                      localField: 'hashtags',
                      foreignField: '_id',
                      as: 'hashtags'
                    }
                  },
                  {
                    $lookup: {
                      from: 'users',
                      localField: 'mentions',
                      foreignField: '_id',
                      as: 'mentions'
                    }
                  },
                  {
                    $addFields: {
                      mentions: {
                        $map: {
                          input: '$mentions',
                          as: 'mention',
                          in: {
                            _id: '$$mention._id',
                            name: '$$mention.name',
                            email: '$$mention.email',
                            username: '$$mention.username'
                          }
                        }
                      }
                    }
                  },
                  {
                    $lookup: {
                      from: 'bookmarks',
                      localField: '_id',
                      foreignField: 'tweet_id',
                      as: 'bookmarks'
                    }
                  },
                  {
                    $lookup: {
                      from: 'likes',
                      localField: '_id',
                      foreignField: 'tweet_id',
                      as: 'likes'
                    }
                  },
                  {
                    $lookup: {
                      from: 'tweets',
                      localField: '_id',
                      foreignField: 'parent_id',
                      as: 'tweet_children'
                    }
                  },
                  {
                    $addFields: {
                      bookmarks: {
                        $size: '$bookmarks'
                      },
                      likes: {
                        $size: '$likes'
                      },
                      retweet_count: {
                        $size: {
                          $filter: {
                            input: '$tweet_children',
                            as: 'item',
                            cond: {
                              $eq: ['$$item.type', 1]
                            }
                          }
                        }
                      },
                      comment_count: {
                        $size: {
                          $filter: {
                            input: '$tweet_children',
                            as: 'item',
                            cond: {
                              $eq: ['$$item.type', 2]
                            }
                          }
                        }
                      },
                      qoute_count: {
                        $size: {
                          $filter: {
                            input: '$tweet_children',
                            as: 'item',
                            cond: {
                              $eq: ['$$item.type', 3]
                            }
                          }
                        }
                      },
                      views: {
                        $add: ['$user_views', '$guest_views']
                      }
                    }
                  },
                  {
                    $project: {
                      tweet_children: 0
                    }
                  }
                ])
                .toArray()
            )[0]
            if (!tweet)
              throw new ErrorWithStatus({
                message: TWEET_MESSAGE.TWEET_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            ;(req as Request).tweet = tweet
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

// Muốn sử dụng asysn await trong handler express thì phải có try catch
// Nếu không có try catch thì dùng wrapRequestHandler
export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience === TweetAudience.TwitterCircle) {
    //Kiểm tra người xem tweet đã đăng nhập hay chưa
    if (!req.decodedAuthorization) {
      throw new ErrorWithStatus({
        message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }
    // kiểm tra tài khoản tác giả có bị khoá hay xoá không
    const author = await databaseService.users.findOne({
      _id: new ObjectId(tweet.user_id)
    })
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        message: USER_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    // Kiểm tra người xem tweet có trong twitter circle của tác giả tweet hay không
    const { userId } = req.decodedAuthorization as TokenPayload
    const isTwitterCircle = author.twitter_circle.some((user_circle_id) => user_circle_id.equals(userId))
    // Nếu người xem tweet không phải là tác giả tweet và không nằm trong twitter circle của tác giả tweet thì không được xem tweet
    if (!isTwitterCircle && !author._id.equals(userId)) {
      throw new ErrorWithStatus({
        message: TWEET_MESSAGE.TWEET_IS_NOT_PUBLIC,
        status: HTTP_STATUS.FORBIDDEN
      })
    }
  }
  next()
})

export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [tweetsTypes],
          errorMessage: TWEET_MESSAGE.TYPE_IS_INVALID
        }
      }
    },
    ['query']
  )
)

export const paginationValidator = validate(
  checkSchema(
    {
      page: {
        isNumeric: true,
        custom: {
          options: (value, { req }) => {
            const number = Number(value)
            if (number < 1) throw new Error('Page must be greater than 1')
            return true
          }
        }
      },
      limit: {
        isNumeric: true,
        custom: {
          options: (value, { req }) => {
            const number = Number(value)
            if (number > 100 || number < 1) throw new Error('Limit must be greater than 0 and less than 100')
            return true
          }
        }
      }
    },
    ['query']
  )
)
