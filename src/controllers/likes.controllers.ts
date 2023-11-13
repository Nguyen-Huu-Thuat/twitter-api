import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARK_MESSAGE, LIKE_MESSAGE } from '~/constants/message'
import { BookmarkTweetRequestBody } from '~/models/requests/Bookmark.request'
import { LikeTweetRequestBody } from '~/models/requests/Like.request'
import { TokenPayload } from '~/models/requests/User.requests'
import bookmarkService from '~/services/bookmarks.services'
import likeService from '~/services/likes.services'

export const likeTweetController = async (
  req: Request<ParamsDictionary, any, LikeTweetRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const { tweet_id } = req.body
  const result = await likeService.likeTweet(userId, tweet_id)
  return res.json({
    message: LIKE_MESSAGE.LIKE_TWEET_SUCCESSFULLY,
    data: result
  })
}

export const unlikeTweetController = async (
  req: Request<ParamsDictionary, any, LikeTweetRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.decodedAuthorization as TokenPayload
  const { tweet_id } = req.params
  const result = await likeService.unlikeTweet(userId, tweet_id)
  return res.json({
    message: LIKE_MESSAGE.UNLIKE_TWEET_SUCCESSFULLY,
    data: result
  })
}
