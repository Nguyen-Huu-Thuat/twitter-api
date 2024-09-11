import { ParamsDictionary, Query } from 'express-serve-static-core'
import { TweetAudience, TweetType } from '~/constants/enums'
import { Media } from '../Other'

export interface TweetReqBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: string | null
  hashtags: string[]
  mentions: string[]
  medias: Media[]
}

export interface TweetParams extends ParamsDictionary {
  tweet_id: string
}

export interface TweetQuery extends Query, Pagination {
  tweet_type: string
}

export interface Pagination {
  page: string
  limit: string
}
