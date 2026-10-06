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

/**
 * 204 / хоосон / JSON биш body-д унахгүй.
 */
const readJson = async <T>(response: Response): Promise<T | null> => {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

/**
 * Session дууссан (401) үед хэрэглэгчийг нэвтрэх хуудас руу НЭГ удаа шилжүүлнэ.
 * Олон зэрэг хүсэлт 401 өгсөн ч давхар redirect хийхгүй.
 * Нэвтрэх, /api/iam bootstrap хүсэлтийг AuthProvider өөрөө зохицуулна.
 */
let isRedirectingToSignIn = false

const handleUnauthorized = (url: string) => {
  if (typeof window === "undefined" || isRedirectingToSignIn) return

  if (url.startsWith("api/auth/") || url === "api/iam") return

  const path = window.location.pathname

  if (path === "/signin" || path === "/privacy-policy" || path.startsWith("/error-")) return

  isRedirectingToSignIn = true

  /**
   * Нэг хүсэлт 401 өгсөн ч session бодитоор дууссан эсэхийг /api/iam-аар нэг дахин шалгана.
   * Session хүчинтэй бол хэрэглэгчийг гаргахгүй (түр зуурын алдаанаас болж гарахгүй).
   */
  const subdomain = getOrganizationSubdomain()

  fetch(`${baseURL}api/iam`, {
    credentials: "include",
    headers: subdomain ? { "X-Organization-Subdomain": subdomain } : undefined,
  })
    .then((res) => {
      if (res.ok) {
        isRedirectingToSignIn = false
        return
      }

      const next = encodeURIComponent(path + window.location.search)

      window.location.assign(`/signin?next=${next}`)
    })
    .catch(() => {
      // Сүлжээний алдаа бол гаргахгүй — дараагийн хүсэлтээр дахин шалгана.
      isRedirectingToSignIn = false
    })
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
      const errorData = await readJson<IError>(response)

      if (response.status === 401) {
        handleUnauthorized(formattedUrl)
      }

      return Promise.reject({
        message: errorData
          ? handleError(errorData)
          : response.statusText || "Серверийн алдаа",
        status: response.status,
      })
    }

    const data = (await readJson<T>(response)) as T

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