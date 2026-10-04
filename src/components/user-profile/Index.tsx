"use client"

import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { useRouter } from 'next/navigation';
import ChangePasswordCard from './ChangePassword';


export default function ProfileContent() {
  const { user } = useAuth()

  const router = useRouter()

  /**
   * Navigation-ийг render дотор биш, effect дотор хийнэ.
   */
  useEffect(() => {
    if (!user) {
      router.replace("/signin")
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-6">
          <UserMetaCard
            role={user.role ?? ""}
            organizationName={user.organization?.name ?? ""}
            imageUrl={user.imageUrl ?? ""}
            firstName={user.firstName ?? ""}
            lastName={user.lastName ?? ""}
            phoneNumber={user.phoneNumber ?? ""}
          />
          <UserInfoCard
            role={user.role ?? ""}
            firstName={user.firstName ?? ""}
            lastName={user.lastName ?? ""}
            phone={user.phoneNumber ?? ""}
            email={user.email ?? ""}
          />
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}