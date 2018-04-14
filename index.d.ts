import * as Logger from "bunyan"
import * as express from "express"

declare namespace bunyanMiddleware {
  interface Params {
    headerName?: string
    propertyName?: string
    additionalRequestFinishData?: { (req: express.Request, res: express.Response): object }
    logName?: string
    obscureHeaders?: string[]
    excludeHeaders?: string[]
    requestStart?: boolean
    verbose?: boolean
    level?: "trace" | "debug" | "info" | "warn" | "error" | "fatal"
    filter?: { (req: express.Request, res: express.Response): boolean }
  }

  interface ParamsWithLogger extends Params {
    logger: Logger
  }

}

declare module "express" {
  export interface Request {
    log: Logger
  }
  export interface Response {
    log: Logger
  }
}

declare function bunyanMiddleware(params: bunyanMiddleware.ParamsWithLogger): express.RequestHandler
declare function bunyanMiddleware(params: bunyanMiddleware.Params, logger: Logger): express.RequestHandler
declare function bunyanMiddleware(logger: Logger): express.RequestHandler

export = bunyanMiddleware
