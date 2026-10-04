import ProfileContent from '@/components/user-profile/Index';
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "User Profile",
  description: "User profile",
};

export default function Profile() {
  return (
  <ProfileContent />
);
}