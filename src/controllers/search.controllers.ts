import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import { SearchReqQuery } from '~/models/requests/Search.request'
import SearchService from '~/services/searchs.services'

export const searchController = async (
  req: Request<ParamsDictionary, any, any, SearchReqQuery>,
  res: Response,
  next: NextFunction
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const result = await SearchService.search({
    content: req.query.content,
    limit,
    page
  })
  res.json({
    message: 'Search controller',
    result: {
      data: result,
      limit,
      page
    }
  })
}
