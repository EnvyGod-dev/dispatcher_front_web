/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IParams {
  [key: string]: any
}

export interface IHeader {
  [key: string]: any
}

export interface IBody {
  [key: string]: any
}

export interface IOption {
  body?: IBody
  headers?: IHeader
  params?: IParams
}

export interface HttpResponse<T> {
  body: T
  headers: Headers
  status?: number
}

export interface IError {
  error:
    | {
        msg: string
        name: string
      }
    | {
        issues: Issue[]
        name: string
      }
    | string
}

export interface Issue {
  received: string
  code: string
  options: string[]
  path: string[]
  message: string
}
