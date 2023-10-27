import { Request, Response, NextFunction } from 'express'
import { pick } from 'lodash'
import { type } from 'os'

type FilterKey<T> = Array<keyof T>

export const filterMiddleware =
  <T>(filterKey: FilterKey<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKey)
    next()
  }
