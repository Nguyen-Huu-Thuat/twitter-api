import { Router } from 'express'
import {
  bookmarkTweetController,
  unbookmarkTweetController,
  unbookmarkTweetbyBookmardIdController
} from '~/controllers/bookmarks.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const bookmarksRouter = Router()

/**
 * Description: bookmark tweet
 * Method: POST
 * Path: /
 * Body: { tweet_id: string }
 * Header: { Authorization: Bearer {accessToken}}
 */
bookmarksRouter.post('', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(bookmarkTweetController))

/**
 * Description: delete bookmark tweet
 * Method: DELETE
 * Path: /:tweet_id
 * Params: { tweet_id: string }
 * Header: { Authorization: Bearer {accessToken}}
 */
bookmarksRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unbookmarkTweetController)
)

/**
 * Description: delete bookmark tweet by bookmark_id
 * Method: DELETE
 * Path: /:bookmark_id
 * Params: { bookmark_id: string }
 * Header: { Authorization: Bearer {accessToken}}
 */
bookmarksRouter.delete(
  '/unbookmark/:bookmark_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unbookmarkTweetbyBookmardIdController)
)

export default bookmarksRouter
