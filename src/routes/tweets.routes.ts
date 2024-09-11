import { get } from 'https'
import { getTweetChildrenValidator, paginationValidator } from './../middlewares/tweets.middlewares'
import { Router } from 'express'
import {
  createTweetController,
  getNewFeedsController,
  getTweetChildrenController,
  getTweetController
} from '~/controllers/tweets.controllers'
import { audienceValidator, createTweetValidator, tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const tweetsRouter = Router()

/**
 * Description: create tweet
 * Method: POST
 * Path: /
 * Body: TweetReqBody
 */

tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

/**
 * Description: get tweet
 * Method: Get
 * Path: /:tweet_id
 * Header: { Authorization: Bearer {accessToken}}
 */

tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

/**
 * Description: get tweet children
 * Method: Get
 * Path: /:tweet_id/children
 * Header: { Authorization: Bearer {accessToken}}
 * Query: { page: number, limit: number, tweet_type: TweetType }
 */

tweetsRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  paginationValidator,
  getTweetChildrenValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)

/**
 * Description: get new feeds
 * Method: Get
 * Path: /new-feeds
 * Header: { Authorization: Bearer {accessToken}}
 * Query: { page: number, limit: number, tweet_type: TweetType }
 */

tweetsRouter.get(
  '/',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedsController)
)
export default tweetsRouter
