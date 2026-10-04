import { SignInForm } from '@/components/auth/SignInForm';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stratum | Нэвтрэх"
};

const SignIn = () => {
  return <SignInForm />;
}

export default SignIn
