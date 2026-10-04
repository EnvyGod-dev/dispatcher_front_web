export interface LoginInput {
  phoneNumber: string
  password: string
  rememberMe: boolean
}

export interface UpdateProfileInput {
  phoneNumber: string
  lastName: string
}

export interface NotificationSettings {
  settings: string[]
}
