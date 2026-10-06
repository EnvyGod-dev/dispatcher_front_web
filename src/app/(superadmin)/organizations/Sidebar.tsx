'use client';

import Label from '@/components/form/Label';
import GenericDropzoneComponent from '@/components/form/form-elements/GenericDropZone';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import employeeService from '@/services/internal/employee';
import organizationService from '@/services/internal/organization';
import { Organization } from '@/services/internal/organization/types';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CreateOrganizationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingOrganization?: Organization;
}

const SUBDOMAIN_REGEX =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'log',
  'mail',
];

export default function CreateOrganizationSidebar({
  isOpen,
  onClose,
  onSuccess,
  editingOrganization,
}: CreateOrganizationSidebarProps) {
  const [orgName, setOrgName] = useState('');
  const [orgSubdomain, setOrgSubdomain] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [orgContactEmail, setOrgContactEmail] = useState('');
  const [orgContactPhone, setOrgContactPhone] = useState('');
  const [orgLogoUrl, setOrgLogoUrl] = useState('');

  const isEditing = Boolean(editingOrganization);

  const resetForm = () => {
    setOrgName('');
    setOrgSubdomain('');
    setOrgCode('');
    setOrgContactEmail('');
    setOrgContactPhone('');
    setOrgLogoUrl('');
  };

  useEffect(() => {
    if (editingOrganization) {
      setOrgName(editingOrganization.name);
      setOrgSubdomain(editingOrganization.subdomain || '');
      setOrgCode(editingOrganization.code || '');
      setOrgContactEmail(editingOrganization.contactEmail || '');
      setOrgContactPhone(editingOrganization.contactPhone || '');
      setOrgLogoUrl(editingOrganization.logoUrl || '');
    } else {
      resetForm();
    }
  }, [editingOrganization]);

  const {
    isPending: isCreatingOrganization,
    mutateAsync: createOrganization,
  } = useMutation({
    mutationFn: organizationService.createOrganization,

    onSuccess: () => {
      resetForm();

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    },

    onError: (error: Error) => {
      toast.error(
        error.message || 'Байгууллага үүсгэхэд алдаа гарлаа'
      );
    },
  });

  const {
    isPending: isUpdatingOrganization,
    mutateAsync: updateOrganization,
  } = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name: string;
        subdomain: string;
        code: string;
        contactEmail: string;
        contactPhone?: string;
        logoUrl?: string | null;
      };
    }) =>
      organizationService.updateOrganization({
        ...data,
        id,
      }),

    onSuccess: () => {
      resetForm();

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    },

    onError: (error: Error) => {
      toast.error(
        error.message || 'Байгууллага засахад алдаа гарлаа'
      );
    },
  });

  const isPending =
    isCreatingOrganization || isUpdatingOrganization;

  const handleSubmit = async (
    event?: FormEvent<HTMLFormElement>
  ) => {
    event?.preventDefault();

    const name = orgName.trim();
    const subdomain = orgSubdomain.trim().toLowerCase();

    if (!name) {
      toast.error('Байгууллагын нэр заавал бөглөнө үү');
      return;
    }

    if (!subdomain) {
      toast.error('Вэб хаяг заавал бөглөнө үү');
      return;
    }

    if (!SUBDOMAIN_REGEX.test(subdomain)) {
      toast.error(
        'Вэб хаяг зөвхөн жижиг англи үсэг, тоо болон "-" тэмдэгт агуулна.'
      );
      return;
    }

    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      toast.error(
        'Энэ вэб хаягийг ашиглах боломжгүй.'
      );
      return;
    }

    const orgData = {
      name,
      subdomain,
      code: orgCode.trim(),
      contactEmail: orgContactEmail.trim(),
      contactPhone:
        orgContactPhone.trim() || undefined,
    };
    const logoUrl = orgLogoUrl.trim();

    try {
      if (isEditing && editingOrganization) {
        await updateOrganization({
          id: editingOrganization.id,
          // Хоосон бол логог устгана (веб Stratum-ын логог харуулна).
          data: { ...orgData, logoUrl: logoUrl || null },
        });

        toast.success(
          'Байгууллага амжилттай засагдлаа.'
        );
      } else {
        await createOrganization({ ...orgData, logoUrl: logoUrl || undefined });

        toast.success(
          'Байгууллага амжилттай үүслээ.'
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    if (isPending) {
      return;
    }

    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/50 transition-opacity duration-300 ease-in-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-md transform transition duration-300 ease-in-out data-[closed]:translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                  >
                    <span className="sr-only">
                      Close panel
                    </span>

                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </TransitionChild>

              <div className="flex h-full flex-col bg-white shadow-xl dark:bg-gray-900">
                <div className="border-b border-gray-200 px-6 py-6 dark:border-gray-700">
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isEditing
                      ? 'Байгууллага засах'
                      : 'Байгууллага нэмэх'}
                  </DialogTitle>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Харилцагч байгууллагын бүртгэл
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex-1 space-y-6 overflow-y-auto px-6 py-6"
                >
                  <div>
                    <Label>
                      Байгууллагын нэр{' '}
                      <span className="text-red-500">
                        *
                      </span>
                    </Label>

                    <Input
                      className="mt-1"
                      placeholder="Эрдэнэс Тавантолгой ХК"
                      value={orgName}
                      onChange={(e) =>
                        setOrgName(e.target.value)
                      }
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <Label>
                      Вэб хаяг{' '}
                      <span className="text-red-500">
                        *
                      </span>
                    </Label>

                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="ett"
                          value={orgSubdomain}
                          onChange={(e) => {
                            const value = e.target.value
                              .toLowerCase()
                              .replace(
                                /[^a-z0-9-]/g,
                                ''
                              );

                            setOrgSubdomain(value);
                          }}
                          disabled={isPending}
                        />
                      </div>

                      <span className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        .stratum.mn
                      </span>
                    </div>

                    {orgSubdomain && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Үүсэх хаяг:{' '}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          https://
                          {orgSubdomain}.stratum.mn
                        </span>
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>
                      Байгууллагын код
                    </Label>

                    <Input
                      className="mt-1"
                      placeholder="ETT"
                      value={orgCode}
                      onChange={(e) =>
                        setOrgCode(e.target.value)
                      }
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <Label>
                      И-мэйл
                    </Label>

                    <Input
                      type="email"
                      className="mt-1"
                      placeholder="info@ett.mn"
                      value={orgContactEmail}
                      onChange={(e) =>
                        setOrgContactEmail(
                          e.target.value
                        )
                      }
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <Label>
                      Харилцах утас
                    </Label>

                    <Input
                      type="tel"
                      className="mt-1"
                      placeholder="99001122"
                      value={orgContactPhone}
                      onChange={(e) =>
                        setOrgContactPhone(
                          e.target.value
                        )
                      }
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <GenericDropzoneComponent
                      key={`${editingOrganization?.id ?? 'new'}-${isOpen}`}
                      title="Байгууллагын лого"
                      onUpload={setOrgLogoUrl}
                      initialUrl={editingOrganization?.logoUrl || ''}
                      uploadFunction={employeeService.uploadUserImage}
                      disabled={isPending}
                      showPreview={true}
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Нэвтрэх хуудас болон цэсний дээд хэсэгт харагдана. Хоосон бол Stratum-ын лого харагдана.
                    </p>
                  </div>
                </form>

                <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClose}
                      disabled={isPending}
                    >
                      Болих
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        handleSubmit()
                      }
                      disabled={isPending}
                    >
                      {isPending
                        ? isEditing
                          ? 'Засаж байна...'
                          : 'Нэмж байна...'
                        : isEditing
                          ? 'Засах'
                          : 'Нэмэх'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}