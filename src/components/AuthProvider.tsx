"use client"

import { useMutation } from "@tanstack/react-query"
import { message } from "antd"
import { useRouter, usePathname } from "next/navigation"
import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import auth from '@/services/public/auth'

import Loading from "./loading"
import userService from '@/services/internal/user'
import { UserPrivate } from '@/services/internal/employee/type'

interface AuthContextType {
  user: UserPrivate | undefined
  isLoading: boolean
  handleLogin: (loginResponse: UserPrivate) => void
  signOut: () => void
  refreshUser: () => void
  updateUser: (updatedUser: UserPrivate) => void
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isLoading: false,
  handleLogin: () => null,
  signOut: () => null,
  refreshUser: () => null,
  updateUser: () => null,
})

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [authState, setAuthState] = useState<{
    user: UserPrivate | undefined
    isInit: boolean
  }>({
    user: undefined,
    isInit: false,
  })

  const isPublicRoute = pathname === '/privacy-policy' || pathname === '/signin' || pathname.startsWith('/error-')

  const { isPending: isLoadingUser, mutate: fetchUser } = useMutation({
    mutationFn: userService.me,
    onSuccess: (data) => {
      setAuthState({ user: data?.body, isInit: true })
    },
    onError: () => {
      setAuthState({ user: undefined, isInit: true })

      if (!isPublicRoute) {
        router.push("/signin")
      }
    },
  })

  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: auth.logout,
    onSuccess: () => {
      setAuthState({ user: undefined, isInit: true })
      router.push("/signin")
    },
    onError: () => {
      message.error("Failed to sign out", 5)
    },
  })

  const isLoading = isLoadingUser || isLoggingOut || !authState.isInit

  useEffect(() => {
    if (!isPublicRoute) {
      fetchUser()
    } else {
      setAuthState({ user: undefined, isInit: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublicRoute])

  const handleLogin = (loginResponse: UserPrivate) => {
    setAuthState({ user: loginResponse, isInit: true })

    /**
     * Session дуусаад /signin?next=... руу шилжсэн бол буцааж тэр хуудсанд оруулна.
     * Зөвхөн дотоод зам ("/..." , "//..." биш) зөвшөөрнө.
     */
    const next = new URLSearchParams(window.location.search).get("next")
    const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/"

    router.push(target)
  }

  const signOut = () => {
    logout()
  }

  const refreshUser = () => {
    fetchUser()
  }

  const updateUser = (updatedUser: UserPrivate) => {
    setAuthState(prev => ({
      ...prev,
      user: updatedUser
    }))
  }

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        isLoading,
      handleLogin,
        signOut,
        refreshUser,
        updateUser,
      }}
    >
      {isLoading && !isPublicRoute ? <Loading /> : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
