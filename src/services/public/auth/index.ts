import { UserPrivate } from '@/services/internal/employee/type'
import http from "../../index"
import { LoginInput } from './types'

const auth = {
  login: async (body: LoginInput) => {
    return await http.post<UserPrivate>("/api/auth/sign-in", { body })
  },
  logout: async () => {
    return await http.post<boolean>("/api/auth/sign-out")
  },
  me: async () => {
    return await http.get<UserPrivate>("/api/iam")
  },
  resetPassword: async (body: { currentPassword: string; newPassword: string }) => {
    return await http.post<boolean>("/api/iam/change-password", { body })
  },
}

export default auth
