import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { TweetReqBody } from '~/models/requests/Tweet.requests'
import { TokenPayload } from '~/models/requests/User.requests'
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
  return res.json({
    message: 'Get tweet successfully',
    result: req.tweet
  })
}
