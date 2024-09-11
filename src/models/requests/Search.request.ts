import { Pagination } from './Tweet.requests'

export interface SearchReqQuery extends Pagination {
  content: string
}
