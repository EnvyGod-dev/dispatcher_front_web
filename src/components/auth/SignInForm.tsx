'use client';

import Checkbox from '@/components/form/input/Checkbox';
import Button from '@/components/ui/button/Button';
import auth from '@/services/public/auth';
import userService from '@/services/internal/user';
import { useMutation } from '@tanstack/react-query';
import { BoxIcon, Eye, EyeClosedIcon } from 'lucide-react';
import BrandLogo, { useTenantBranding } from '@/components/ui/BrandLogo';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../AuthProvider';
import Loading from '../loading';

/**
 * LOCAL: lvh.me      (*.lvh.me -> 127.0.0.1)
 * PROD:  stratum.mn
 */
const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'stratum.mn';

/**
 * Одоогийн protocol + port-ийг хадгалж host солино.
 *
 * buildUrl('khavtsgait') -> http://khavtsgait.lvh.me:3000/
 * buildUrl(null)         -> http://lvh.me:3000/
 */
const buildUrl = (subdomain: string | null, path = '/') => {
  const { protocol, port } = window.location;
  const host = subdomain
    ? `${subdomain}.${ROOT_DOMAIN}`
    : ROOT_DOMAIN;

  return `${protocol}//${host}${port ? `:${port}` : ''}${path}`;
};

export const SignInForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const branding = useTenantBranding();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { handleLogin } = useAuth();

  const {
    isPending,
    mutateAsync: login,
  } = useMutation({
    mutationFn: auth.login,

    onError: (error: Error) => {
      toast.error(
        error.message || 'Нэвтрэхэд алдаа гарлаа'
      );
    },
  });

  const redirectUser = async (loginUser: any) => {
    /**
     * Sign-in response-д organization ирж байгаа бол
     * шууд ашиглана. Үгүй бол /api/iam-аас авна.
     */
    let user = loginUser;

    if (!user?.role || (!user?.organization && user?.role !== 'superadmin')) {
      const meResponse = await userService.me();
      user = meResponse.body;
    }

    /**
     * Superadmin үндсэн domain дээр ажиллана.
     */
    if (user.role === 'superadmin') {
      if (window.location.hostname === ROOT_DOMAIN) {
        handleLogin(user);
        return;
      }

      setIsRedirecting(true);
      window.location.replace(buildUrl(null));
      return;
    }

    /**
     * Энгийн хэрэглэгч organization-тай байх ёстой.
     */
    const subdomain = user.organization?.subdomain;

    if (!subdomain) {
      toast.error(
        'Таны байгууллагын вэб хаяг тохируулагдаагүй байна.'
      );
      return;
    }

    /**
     * Аль хэдийн зөв tenant domain дээр байвал
     * энгийн login — state шинэчлэхэд хангалттай.
     */
    if (window.location.hostname === `${subdomain}.${ROOT_DOMAIN}`) {
      handleLogin(user);
      return;
    }

    /**
     * Өөр host руу шилжинэ.
     *
     * ⚠️ handleLogin ДУУДАХГҮЙ — тэр router.push('/')
     * хийж энэ redirect-ийг дарж магадгүй.
     * Шинэ хуудас /api/iam-аас user-ээ өөрөө авна.
     */
    setIsRedirecting(true);
    window.location.replace(buildUrl(subdomain));
  };

  const onFinish = async (
    e?: React.FormEvent<HTMLFormElement>
  ) => {
    e?.preventDefault();

    if (!phoneNumber.trim()) {
      toast.error('Утасны дугаараа оруулна уу');
      return;
    }

    if (!password) {
      toast.error('Нууц үгээ оруулна уу');
      return;
    }

    try {
      const loginResponse = await login({
        phoneNumber,
        password,
        rememberMe,
      });

      await redirectUser(loginResponse?.body);
    } catch (error) {
      console.error('Login error:', error);
      setIsRedirecting(false);
    }
  };

  if (isPending || isRedirecting) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen w-full flex-1 flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
        <div className="mb-8 flex flex-col items-center">
          <BrandLogo logoUrl={branding.data?.logoUrl} name={branding.data?.name} height={88} maxWidth={260} />

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Уурхайн бүртгэл тайлангийн нэгдсэн
          </p>
        </div>

        <div className="rounded-xl border border-gray-200/50 bg-white p-8 shadow-xl backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800">
          <div>
            <div className="mb-8">
              <h1 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Нэвтрэх
              </h1>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Хувийн мэдээллээ оруулна уу.
              </p>
            </div>

            <form
              onSubmit={onFinish}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Утасны дугаар{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  onChange={(e) =>
                    setPhoneNumber(e.target.value)
                  }
                  type="number"
                  placeholder="99111111"
                  value={phoneNumber}
                  disabled={isPending}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Нууц үг{' '}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <input
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="Нууц үгээ оруулна уу"
                    value={password}
                    disabled={isPending}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    disabled={isPending}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <Eye size={16} />
                    ) : (
                      <EyeClosedIcon size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onChange={setRememberMe}
                  disabled={isPending}
                  label="Нэвтрэх мэдээллийг санах"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() =>
                    alert('Reset password')
                  }
                  className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-50"
                  disabled={isPending}
                >
                  Нууц үгээ мартсан уу?
                </button>
              </div>

              <Button
                size="md"
                variant="primary"
                className="w-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                endIcon={<BoxIcon />}
                disabled={isPending}
              >
                {isPending
                  ? 'Нэвтэрч байна...'
                  : 'Нэвтрэх'}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-8 space-y-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2025 Stratum LLC. Бүх эрх хуулиар
            хамгаалагдсан.
          </p>

          <div className="flex items-center justify-center gap-4 text-xs">
            <Link
              href="/privacy-policy"
              className="text-gray-600 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
            >
              Нууцлалын бодлого
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};