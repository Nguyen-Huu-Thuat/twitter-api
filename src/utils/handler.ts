// const wrapAsync = (fn: any) => {
//   return (req: any, res: any, next: any) => {
//     fn(req, res, next).catch(next);
//   };
// }
/**
 * hoac co the viet nhu nay
 */
import { Request, Response, NextFunction, RequestHandler } from 'express'

export const wrapRequestHandler = (fn: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Promise.resolve(fn(req, res, next)).catch(next)
    try {
      await fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
