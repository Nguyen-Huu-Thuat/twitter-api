import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARK_MESSAGE } from '~/constants/message'
import { BookmarkTweetRequestBody } from '~/models/requests/Bookmark.request'
import { TokenPayload } from '~/models/requests/User.requests'
import bookmarkService from '~/services/bookmarks.services'

export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const { tweet_id } = req.body
  const result = await bookmarkService.bookmarkTweet(userId, tweet_id)
  return res.json({
    message: BOOKMARK_MESSAGE.CREATE_BOOKMARK_SUCCESSFULLY,
    data: result
  })
}

export const unbookmarkTweetController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const { tweet_id } = req.params
  const result = await bookmarkService.unbookmarkTweet(userId, tweet_id)
  return res.json({
    message: BOOKMARK_MESSAGE.DELETE_BOOKMARK_SUCCESSFULLY,
    data: result
  })
}

export const unbookmarkTweetbyBookmardIdController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const { bookmark_id } = req.params
  console.log(userId)
  console.log(bookmark_id)
  console.log('req.params', req.params)
  const result = await bookmarkService.unbookmarkTweetbybookmarkId(userId, bookmark_id)
  return res.json({
    message: BOOKMARK_MESSAGE.DELETE_BOOKMARK_BY_BOOKMARK_ID_SUCCESSFULLY,
    data: result
  })
}
