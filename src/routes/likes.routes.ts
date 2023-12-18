import { Router } from 'express'
import { likeTweetController, unlikeTweetController } from '~/controllers/likes.controllers'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const likesRouter = Router()

/**
 * Description: like tweet
 * Method: POST
 * Path: /
 * Body: { tweet_id: string }
 * Header: { Authorization: Bearer {accessToken}}
 */
likesRouter.post(
  '',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(likeTweetController)
)

/**
 * Description: delete unlike tweet
 * Method: DELETE
 * Path: /:tweet_id
 * Params: { tweet_id: string }
 * Header: { Authorization: Bearer {accessToken}}
 */
likesRouter.delete(
  '/likestweet/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unlikeTweetController)
)

export default likesRouter
