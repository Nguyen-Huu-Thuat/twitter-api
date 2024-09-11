import { SearchReqQuery } from '~/models/requests/Search.request'
import databaseService from './database.services'

class SearchService {
  async search({ content, limit, page }: { limit: number; page: number; content: string }) {
    const result = await databaseService.tweets
      .find({
        $text: {
          $search: content
        }
      })
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray()
    return result
  }
}

const searchService = new SearchService()
export default searchService
