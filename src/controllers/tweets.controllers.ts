import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { TweetType } from '~/constants/enums'
import { Pagination, TweetParams, TweetQuery, TweetReqBody } from '~/models/requests/Tweet.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import Tweet from '~/models/schemas/Tweet.schema'
import tweetsService from '~/services/tweets.services'

export const createTweetController = async (
  req: Request<ParamsDictionary, any, TweetReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const result = await tweetsService.createTweet(userId, req.body)
  return res.json({
    message: 'Create tweet successfully',
    data: result
  })
}

export const getTweetController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const { tweet_id } = req.params
  const result = await tweetsService.increaseView(tweet_id, userId)
  const tweet = {
    ...req.tweet,
    user_views: result.user_views,
    guest_views: result.guest_views
  }
  return res.json({
    message: 'Get tweet successfully',
    result: tweet
  })
}

export const getTweetChildrenController = async (req: Request<TweetParams, any, any, TweetQuery>, res: Response) => {
  const tweet_type = Number(req.query.tweet_type) as TweetType
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const userId = req.decodedAuthorization?.userId

  const { total, tweets } = await tweetsService.getTweetChildren({
    tweet_id: req.params.tweet_id,
    tweet_type,
    page,
    limit,
    userId
  })
  return res.json({
    message: 'Get tweet children successfully',
    result: {
      tweets,
      tweet_type,
      total,
      page,
      limit
    }
  })
}

export const getNewFeedsController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const result = await tweetsService.getNewFeeds({
    page,
    limit,
    userId: req.decodedAuthorization?.userId
  })
  return res.json({
    message: 'Get new feeds successfully',
    result: {
      tweets: result.tweets,
      total_page: Math.ceil(result.total / limit),
      page,
      limit
    }
  })
}
