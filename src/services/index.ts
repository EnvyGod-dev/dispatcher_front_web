import { HttpResponse, IError, IOption } from "./types"

const baseURL = process.env.NEXT_PUBLIC_BASE_URL

/**
 * LOCAL: lvh.me | stratum.test
 * PROD:  stratum.mn
 */
const ROOT_DOMAIN = (
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || "stratum.mn"
).toLowerCase()

/**
 * Tenant биш, системийн subdomain-ууд.
 */
const RESERVED_SUBDOMAINS = ["www", "api", "admin"]

interface ExtendedRequestInit extends Omit<RequestInit, "body"> {
  url: string
  params?: Record<string, string | undefined>
  body?: Record<string, unknown>
}

/**
 * khavtsgait.lvh.me      -> "khavtsgait"
 * khavtsgait.stratum.mn  -> "khavtsgait"
 * lvh.me / stratum.mn    -> null
 * api.stratum.mn         -> null
 */
const getOrganizationSubdomain = (): string | null => {
  if (typeof window === "undefined") {
    return null
  }

  const hostname = window.location.hostname
    .trim()
    .toLowerCase()

  const suffix = `.${ROOT_DOMAIN}`

  if (!hostname.endsWith(suffix)) {
    return null
  }

  const subdomain = hostname.slice(0, -suffix.length)

  if (
    !subdomain ||
    subdomain.includes(".") ||
    RESERVED_SUBDOMAINS.includes(subdomain)
  ) {
    return null
  }

  return subdomain
}

const handleError = (err: IError): string => {
  if (typeof err.error === "string") {
    return err.error
  }

  if (typeof err.error !== "object") {
    return "An unexpected error occurred."
  }

  if ("issues" in err.error) {
    const messages = err.error.issues.map((issue) => {
      const path = issue.path.join(".")

      return `${path ? path + ": " : ""}${issue.message}`
    })

    return messages.join(", ")
  }

  if (err.error.name === "HTTPException") {
    return err.error.msg
  }

  return "An unexpected error occurred."
}

const serializeParams = (
  params?: Record<
    string,
    string | string[] | undefined
  >,
): string => {
  if (!params) return ""

  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => value !== undefined,
    ),
  )

  const urlSearchParams =
    new URLSearchParams()

  Object.entries(filteredParams).forEach(
    ([key, value]) => {
      if (Array.isArray(value)) {
        urlSearchParams.append(
          key,
          value.join(","),
        )
      } else if (value !== undefined) {
        urlSearchParams.append(key, value)
      }
    },
  )

  const queryString =
    urlSearchParams.toString()

  return queryString
    ? `?${queryString}`
    : ""
}

const removeLeadingSlash = (
  url: string,
): string => {
  return url.startsWith("/")
    ? url.slice(1)
    : url
}

const http = {
  request: async <T>({
    method,
    url,
    headers,
    body,
    params,
  }: ExtendedRequestInit): Promise<HttpResponse<T>> => {
    const isFormData =
      body instanceof FormData

    const formattedUrl =
      removeLeadingSlash(url)

    const urlWithParams =
      `${baseURL}${formattedUrl}${serializeParams(params)}`

    const requestHeaders =
      new Headers(headers)

    if (!isFormData) {
      requestHeaders.set(
        "Content-Type",
        "application/json",
      )
    }

    const subdomain =
      getOrganizationSubdomain()

    if (subdomain) {
      requestHeaders.set(
        "X-Organization-Subdomain",
        subdomain,
      )
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: isFormData
        ? (body as unknown as FormData)
        : body
          ? JSON.stringify(body)
          : undefined,
      credentials: "include",
    }

    const response = await fetch(
      urlWithParams,
      requestOptions,
    )

    if (!response.ok) {
      const errorData =
        (await response.json()) as IError

      return Promise.reject({
        message: handleError(errorData),
        status: response.status,
      })
    }

    const data: T =
      await response.json()

    return {
      body: data,
      headers: response.headers,
      status: response.status,
    }
  },

  get: async <T>(
    url: string,
    options?: IOption,
  ): Promise<HttpResponse<T>> =>
    http.request<T>({
      method: "GET",
      url,
      headers: options?.headers,
      params: options?.params,
    }),

  post: async <T>(
    url: string,
    options?: IOption,
  ): Promise<HttpResponse<T>> =>
    http.request<T>({
      method: "POST",
      url,
      headers: options?.headers,
      body: options?.body,
      params: options?.params,
    }),

  put: async <T>(
    url: string,
    options?: IOption,
  ): Promise<HttpResponse<T>> =>
    http.request<T>({
      method: "PUT",
      url,
      headers: options?.headers,
      body: options?.body,
      params: options?.params,
    }),

  delete: async <T>(
    url: string,
    options?: IOption,
  ): Promise<HttpResponse<T>> =>
    http.request<T>({
      method: "DELETE",
      url,
      headers: options?.headers,
      body: options?.body,
      params: options?.params,
    }),
}

export default http