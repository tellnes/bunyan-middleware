import Logger = require('bunyan')
import { Request, Response, RequestHandler } from 'express'

export = middleware

interface Params {
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
interface ParamsWithLogger extends Params {
  logger: Logger
}
declare function middleware(params: ParamsWithLogger): RequestHandler
declare function middleware(params: Params, logger: Logger): RequestHandler
declare function middleware(logger: Logger): RequestHandler


declare module 'express' {
  export interface Request {
    log: Logger
  }
  export interface Response {
    log: Logger
  }
}
