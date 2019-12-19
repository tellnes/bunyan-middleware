import Logger = require('bunyan')
import { Request, Response, RequestHandler } from 'express'

export = bunyanMiddleware

declare function bunyanMiddleware(params: bunyanMiddleware.ParamsWithLogger): RequestHandler
declare function bunyanMiddleware(params: bunyanMiddleware.Params, logger: Logger): RequestHandler
declare function bunyanMiddleware(logger: Logger): RequestHandler

declare namespace bunyanMiddleware {
  export interface Params {
    headerName?: string
    propertyName?: string
    additionalRequestFinishData?: { (req: Request, res: Response): object }
    logName?: string
    obscureHeaders?: string[]
    excludeHeaders?: string[]
    requestStart?: boolean
    verbose?: boolean
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
    filter?: { (req: Request, res: Response): boolean }
  }
  export interface ParamsWithLogger extends Params {
    logger: Logger
  }
}


declare global {
  namespace Express {
    export interface Request {
      log: Logger
      reqId: string
    }
    export interface Response {
      log: Logger
    }
  }
}
