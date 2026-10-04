'use client';

import { useAuth } from '@/components/AuthProvider';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import employeeService from '@/services/internal/employee';
import {
  DriverShiftGroup,
  driverShiftGroupOptions,
  Employee,
  EmployeePositionMapMn,
  userRoleOptions,
  UserStatus,
} from '@/services/internal/employee/type';
import { UserRole } from '@/services/roles';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import GenericDropzoneComponent from '../form/form-elements/GenericDropZone';
import Select from '../form/Select';
import { statusOptions } from '../ui/StatusDropdown';

interface EmployeeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingEmployee?: Employee;
}

type DateSelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const DEFAULT_ROLE = 'driver' as UserRole;

const normalizeDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;

const normalizeRole = (value: unknown): UserRole => {
  return typeof value === 'string' && value.trim()
    ? (value as UserRole)
    : DEFAULT_ROLE;
};

const pad2 = (value: number) => value.toString().padStart(2, '0');

const getDateParts = (value: string) => {
  const normalized = normalizeDate(value);

  if (!normalized) {
    return {
      year: '',
      month: '',
      day: '',
    };
  }

  const [year, month, day] = normalized.split('-');

  return {
    year: year || '',
    month: month || '',
    day: day || '',
  };
};

function DateSelectField({
  label,
  value,
  onChange,
  disabled,
}: DateSelectFieldProps) {
  const { year, month, day } = getDateParts(value);

  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 81 }, (_, index) => {
        const y = currentYear - 40 + index;
        return {
          value: String(y),
          label: String(y),
        };
      }),
    [currentYear]
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const monthValue = pad2(index + 1);
        return {
          value: monthValue,
          label: monthValue,
        };
      }),
    []
  );

  const dayOptions = useMemo(() => {
    const selectedYear = Number(year);
    const selectedMonth = Number(month);

    const daysInMonth =
      selectedYear && selectedMonth
        ? new Date(selectedYear, selectedMonth, 0).getDate()
        : 31;

    return Array.from({ length: daysInMonth }, (_, index) => {
      const dayValue = pad2(index + 1);
      return {
        value: dayValue,
        label: dayValue,
      };
    });
  }, [year, month]);

  const emitDate = (nextYear: string, nextMonth: string, nextDay: string) => {
    if (!nextYear && !nextMonth && !nextDay) {
      onChange('');
      return;
    }

    if (!nextYear || !nextMonth || !nextDay) {
      onChange('');
      return;
    }

    const maxDay = new Date(Number(nextYear), Number(nextMonth), 0).getDate();
    const fixedDay = Math.min(Number(nextDay), maxDay);

    onChange(`${nextYear}-${nextMonth}-${pad2(fixedDay)}`);
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 grid grid-cols-3 gap-2">
        <Select
          placeholder="Жил"
          value={year || undefined}
          options={yearOptions}
          onChange={(nextYear) => emitDate(nextYear, month, day)}
          disabled={disabled}
        />
        <Select
          placeholder="Сар"
          value={month || undefined}
          options={monthOptions}
          onChange={(nextMonth) => emitDate(year, nextMonth, day)}
          disabled={disabled}
        />
        <Select
          placeholder="Өдөр"
          value={day || undefined}
          options={dayOptions}
          onChange={(nextDay) => emitDate(year, month, nextDay)}
          disabled={disabled}
        />
      </div>

      {value && (
        <button
          type="button"
          className="mt-1 text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-400"
          onClick={() => onChange('')}
          disabled={disabled}
        >
          Огноо цэвэрлэх
        </button>
      )}
    </div>
  );
}

export default function EmployeeSidebar({
  isOpen,
  onClose,
  onSuccess,
  editingEmployee,
}: EmployeeSidebarProps) {
  const { user } = useAuth();

  const [phone, setPhone] = useState(0);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>(DEFAULT_ROLE);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);
  const [department, setDepartment] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [driverLicenseExpiryDate, setDriverLicenseExpiryDate] = useState('');
  const [ettDriverLicenseExpiryDate, setEttDriverLicenseExpiryDate] =
    useState('');
  const [entryPermitExpiryDate, setEntryPermitExpiryDate] = useState('');
  const [driverShiftGroup, setDriverShiftGroup] =
    useState<DriverShiftGroup | null>(null);
  const [status, setStatus] = useState<UserStatus>('available');
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string; data: any }>;
  } | null>(null);

  const isEditMode = !!editingEmployee;

  const resetForm = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole(DEFAULT_ROLE);
    setPhone(0);
    setPassword('');
    setNewPassword('');
    setImageUrl(null);
    setPosition(null);
    setDepartment('');
    setRegisterNumber('');
    setDriverLicenseExpiryDate('');
    setEttDriverLicenseExpiryDate('');
    setEntryPermitExpiryDate('');
    setDriverShiftGroup(null);
    setStatus('available');
    setBulkFile(null);
    setBulkUploadResult(null);
    setUploadMode('single');
  };

  useEffect(() => {
    if (editingEmployee) {
      setPhone(Number(editingEmployee.phoneNumber));
      setEmail(
        editingEmployee.email?.includes('@internal.local')
          ? ''
          : editingEmployee.email || ''
      );
      setFirstName(editingEmployee.firstName || '');
      setLastName(editingEmployee.lastName || '');
      setRole(normalizeRole(editingEmployee.role));
      setImageUrl(editingEmployee.imageUrl || null);
      setPosition(editingEmployee.position || null);
      setDepartment(editingEmployee.department || '');
      setRegisterNumber(editingEmployee.registerNumber || '');
      setDriverLicenseExpiryDate(
        normalizeDate(editingEmployee.driverLicenseExpiryDate || '') || ''
      );
      setEttDriverLicenseExpiryDate(
        normalizeDate(editingEmployee.ettDriverLicenseExpiryDate || '') || ''
      );
      setEntryPermitExpiryDate(
        normalizeDate(editingEmployee.entryPermitExpiryDate || '') || ''
      );
      setDriverShiftGroup(editingEmployee.driverShiftGroup || null);
      setStatus(editingEmployee.status);
    } else if (isOpen) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingEmployee, isOpen]);

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  const { isPending: isCreatingEmployee, mutateAsync: createEmployee } =
    useMutation({
      mutationFn: employeeService.createEmployee,
      onSuccess: () => {
        toast.success('Шинэ бүртгэл үүслээ');
        resetForm();
        onSuccess?.();
        onClose();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Бүртгэл үүсгэхэд алдаа гарлаа');
      },
    });

  const { isPending: isUpdating, mutateAsync: updateEmployee } = useMutation({
    mutationFn: employeeService.updateEmployee,
    onSuccess: () => {
      toast.success('Бүртгэл шинэчлэгдлээ.');
      resetForm();
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Бүртгэл шинэчлэхэд алдаа гарлаа');
    },
  });

  const { isPending: isChangingPassword, mutateAsync: changePassword } =
    useMutation({
      mutationFn: employeeService.changeEmployeePassword,
      onSuccess: () => {
        toast.success('Нууц үг амжилттай солигдлоо.');
        setNewPassword('');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Нууц үг солиход алдаа гарлаа');
      },
    });

  const { isPending: isBulkUploading, mutateAsync: bulkUploadEmployees } =
    useMutation({
      mutationFn: employeeService.bulkCreateEmployees,
      onSuccess: (result) => {
        setBulkUploadResult(result);

        if (result.success > 0) {
          toast.success(`${result.success} хэрэглэгч амжилттай бүртгэгдлээ`);
          onSuccess?.();
          onClose();
        }

        if (result.failed > 0) {
          toast.warning(`${result.failed} хэрэглэгч алдаатай байна`);
        }

        if (result.errors.length > 0) {
          toast.warning(`${result.errors[0].error}`);
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Алдаа гарлаа.');
      },
    });

  const isPending =
    isCreatingEmployee || isUpdating || isBulkUploading || isChangingPassword;

  const handleBulkSubmit = async () => {
    if (!bulkFile) {
      toast.error('Файл сонгоно уу');
      return;
    }

    const formData = new FormData();
    formData.append('file', bulkFile);

    await bulkUploadEmployees(formData);
  };

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const submitRole = normalizeRole(role);

    if (!isEditMode) {
      if (!firstName.trim() || !lastName.trim()) {
        toast.error('Нэр, овог заавал бөглөнө үү');
        return;
      }

      if (!phone || !password || phone === 0) {
        toast.error('Утасны дугаар, нууц үг шаардлагатай');
        return;
      }
    }

    try {
      if (
        (submitRole === UserRole.DRIVER ||
          submitRole === UserRole.ASSISTANT_OPERATOR) &&
        !driverShiftGroup
      ) {
        toast.error('Операторт ABCD ээлжийн төрөл сонгоно уу');
        return;
      }

      const formData = {
        email: email.trim() === '' ? undefined : email.trim(),
        phone: phone || 0,
        password: password.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: submitRole,
        imageUrl: imageUrl ? imageUrl.trim() : undefined,
        organizationId: user?.organizationId ?? undefined,
        position: position || undefined,
        department: department.trim() || undefined,
        registerNumber: registerNumber.trim() || undefined,
        driverLicenseExpiryDate: normalizeDate(driverLicenseExpiryDate),
        ettDriverLicenseExpiryDate: normalizeDate(ettDriverLicenseExpiryDate),
        entryPermitExpiryDate: normalizeDate(entryPermitExpiryDate),
        driverShiftGroup,
        status,
      };

      if (isEditMode) {
        await updateEmployee({ ...formData, userId: editingEmployee.id });

        if (newPassword.trim()) {
          await changePassword({
            userId: editingEmployee.id,
            newPassword: newPassword.trim(),
          });
        }
      } else {
        await createEmployee(formData);
      }

      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      if (!editingEmployee) {
        resetForm();
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-900/50 transition-opacity duration-300 ease-in-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-2xl transform transition duration-300 ease-in-out data-[closed]:translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <span className="sr-only">Close panel</span>
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

              <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-xl">
                <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isEditMode ? 'Бүртгэл шинэчлэх' : 'Бүртгэл үүсгэх'}
                  </DialogTitle>

                  {!isEditMode && (
                    <div className="flex items-center justify-between py-3 mt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Форм
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadMode(
                              uploadMode === 'single' ? 'bulk' : 'single'
                            );
                            setBulkFile(null);
                            setBulkUploadResult(null);
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${uploadMode === 'bulk'
                            ? 'bg-blue-600'
                            : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          disabled={isPending}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${uploadMode === 'bulk'
                              ? 'translate-x-6'
                              : 'translate-x-1'
                              }`}
                          />
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Файл
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {uploadMode === 'bulk' ? (
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                            Загварчилсан файл
                          </h4>
                          <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                            Хэрэглэгчийн мэдээллийг зөв форматаар оруулахын тулд
                            доорх загвар файлыг ашиглана уу.
                          </p>
                          <a
                            href="/template_files/user_format.xlsx"
                            download="hereglegch_zagvar.xlsx"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 text-sm font-medium rounded-lg border border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors shadow-sm"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span>Загвар файл татах</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Файлын формат
                    </span>

                    <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="grid grid-cols-1 gap-3 text-xs">
                        {[
                          ['role', 'Үүрэг', 'superadmin | admin | markscheider | driver | assistant_operator | dispatcher | hr | ita | mechanic'],
                          ['phoneNumber', 'Утасны дугаар', 'Дор хаяж 8 оронтой.'],
                          ['password', 'Нууц үг', 'Заавал.'],
                          ['firstName', 'Нэр', 'Заавал.'],
                          ['lastName', 'Овог', 'Заавал.'],
                          ['email', 'И-мэйл хаяг', 'Заавал биш.'],
                          ['position', 'Албан тушаал', 'Заавал биш.'],
                          ['department', 'Хэлтэс', 'Заавал биш.'],
                          ['registerNumber', 'Регистрийн дугаар', 'Заавал биш.'],
                          ['driverLicenseExpiryDate', 'МУ жолооны үнэмлэх дуусах огноо', 'YYYY-MM-DD формат.'],
                          ['ettDriverLicenseExpiryDate', 'ЭТТ үнэмлэх дуусах огноо', 'YYYY-MM-DD формат.'],
                          ['entryPermitExpiryDate', 'Нэвтрэх үнэмлэх дуусах огноо', 'YYYY-MM-DD формат.'],
                          ['driverShiftGroup', 'ABCD ээлж', 'A | B | C | D. driver/assistant_operator үед заавал.'],
                        ].map(([key, title, description]) => (
                          <div key={key} className="flex items-start gap-2">
                            <span className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded text-blue-900 dark:text-blue-100">
                              {key}
                            </span>
                            <div className="flex-1">
                              <p className="text-blue-900 dark:text-blue-100 font-medium">
                                {title}
                              </p>
                              <p className="text-blue-700 dark:text-blue-300 text-xs">
                                {description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-900 dark:text-white mb-3 block">
                        Файл оруулах
                      </Label>
                      {!bulkFile && (
                        <div className="relative">
                          <input
                            type="file"
                            id="bulk-employee-input"
                            accept=".xlsx,.xls"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const validTypes = [
                                  'application/vnd.ms-excel',
                                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                ];
                                if (!validTypes.includes(file.type)) {
                                  toast.error('Зөвхөн Excel файл оруулна уу');
                                  return;
                                }
                                setBulkFile(file);
                                setBulkUploadResult(null);
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="bulk-employee-input"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg
                                className="w-8 h-8 mb-3 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                              <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">
                                  Файл сонгох
                                </span>{' '}
                                эсвэл чирж оруулах
                              </p>
                              <p className="text-xs text-gray-500">
                                Excel (.xlsx, .xls)
                              </p>
                            </div>
                          </label>
                        </div>
                      )}

                      {bulkFile && (
                        <div className="mt-3 flex items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                          <svg
                            className="w-5 h-5 text-brand-600 dark:text-brand-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-900 dark:text-brand-100 truncate">
                              {bulkFile.name}
                            </p>
                            <p className="text-xs text-brand-600 dark:text-brand-400">
                              {(bulkFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBulkFile(null)}
                            className="p-1 hover:bg-brand-100 dark:hover:bg-brand-900/40 rounded transition-colors"
                          >
                            <svg
                              className="w-4 h-4 text-brand-600 dark:text-brand-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {bulkUploadResult && (
                      <div className="space-y-3">
                        {bulkUploadResult.success > 0 && (
                          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <svg
                              className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                Амжилттай
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-300">
                                {bulkUploadResult.success} хэрэглэгч бүртгэгдсэн
                              </p>
                            </div>
                          </div>
                        )}

                        {bulkUploadResult.failed > 0 && (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-start gap-3 mb-3">
                              <svg
                                className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                  Алдаатай бүртгэл: {bulkUploadResult.failed}
                                </p>
                              </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-2">
                              {bulkUploadResult.errors.map((err, idx) => (
                                <details
                                  key={idx}
                                  className="group bg-white dark:bg-gray-800 rounded border border-yellow-200 dark:border-yellow-800/50"
                                >
                                  <summary className="cursor-pointer p-3 text-xs font-medium text-yellow-900 dark:text-yellow-100 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors list-none">
                                    <div className="flex items-center justify-between">
                                      <span>
                                        Мөр {err.row}: {err.error.split(',')[0]}
                                        ...
                                      </span>
                                      <svg
                                        className="w-4 h-4 text-yellow-600 dark:text-yellow-400 group-open:rotate-180 transition-transform"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    </div>
                                  </summary>
                                  <div className="p-3 pt-0 text-xs space-y-2 border-t border-yellow-100 dark:border-yellow-800/30">
                                    <div>
                                      <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                        Алдаа:
                                      </p>
                                      <p className="text-yellow-700 dark:text-yellow-300">
                                        {err.error}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                                        Өгөгдөл:
                                      </p>
                                      <pre className="text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded overflow-x-auto text-xs">
                                        {JSON.stringify(err.data, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </details>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBulkFile(null);
                            setBulkUploadResult(null);
                          }}
                          className="w-full"
                        >
                          Шинэ файл оруулах
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label>
                          Утасны дугаар <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="tel"
                          className="mt-1"
                          placeholder="99001122"
                          disabled={isEditMode || isPending}
                          value={phone || ''}
                          onChange={(e) => setPhone(Number(e.target.value))}
                        />
                      </div>

                      {!isEditMode && (
                        <div>
                          <Label>
                            Нууц үг <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="password"
                            className="mt-1"
                            placeholder="Нууц үг"
                            disabled={isEditMode || isPending}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      )}

                      <div>
                        <Label>И-мэйл хаяг</Label>
                        <Input
                          type="email"
                          className="mt-1"
                          placeholder="user@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isPending}
                        />
                      </div>

                      <div>
                        <Label>Регистрийн дугаар</Label>
                        <Input
                          className="mt-1"
                          placeholder="АА00000000"
                          value={registerNumber}
                          onChange={(e) => setRegisterNumber(e.target.value)}
                          disabled={isPending}
                        />
                      </div>

                      <div>
                        <Label>
                          Нэр <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={firstName}
                          className="mt-1"
                          placeholder=""
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={isPending}
                        />
                      </div>

                      <div>
                        <Label>
                          Овог <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={lastName}
                          className="mt-1"
                          placeholder=""
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={isPending}
                        />
                      </div>

                      <div>
                        <Label>Хэлтэс</Label>
                        <Input
                          className="mt-1"
                          placeholder="Жишээ: Уулын хэлтэс"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          disabled={isPending}
                        />
                      </div>

                      <div>
                        <Label>Албан тушаал</Label>
                        <Select
                          allowCreate={true}
                          createLabel={(input) => `Нэмэх "${input}"`}
                          className="w-full mt-1"
                          placeholder="Албан тушаал сонгох эсвэл шинээр бичих"
                          value={position || undefined}
                          onChange={(value) => setPosition(value)}
                          disabled={isPending}
                          options={EmployeePositionMapMn.map((p) => ({
                            value: p,
                            label: p,
                          }))}
                        />
                      </div>

                      <div>
                        <Label>
                          Системийн үүрэг{' '}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          className="w-full mt-1"
                          placeholder="Үүрэг сонгох"
                          value={role || DEFAULT_ROLE}
                          onChange={(value) => {
                            const nextRole = normalizeRole(value);
                            setRole(nextRole);

                            if (
                              nextRole !== UserRole.DRIVER &&
                              nextRole !== UserRole.ASSISTANT_OPERATOR
                            ) {
                              setDriverShiftGroup(null);
                            }
                          }}
                          disabled={isPending}
                          options={userRoleOptions.filter(
                            (r) => r.value !== 'superadmin'
                          )}
                        />
                      </div>

                      <div>
                        <Label>
                          ABCD ээлж
                          {(role === UserRole.DRIVER ||
                            role === UserRole.ASSISTANT_OPERATOR) && (
                              <span className="text-red-500"> *</span>
                            )}
                        </Label>
                        <Select
                          className="w-full mt-1"
                          placeholder="ABCD ээлж сонгох"
                          value={driverShiftGroup || undefined}
                          onChange={(value) =>
                            setDriverShiftGroup(value as DriverShiftGroup)
                          }
                          disabled={isPending}
                          options={driverShiftGroupOptions}
                        />
                      </div>

                      <DateSelectField
                        label="МУ жолооны үнэмлэхийн хугацаа"
                        value={driverLicenseExpiryDate}
                        onChange={setDriverLicenseExpiryDate}
                        disabled={isPending}
                      />

                      <DateSelectField
                        label="ЭТТ жолооны үнэмлэхийн хугацаа"
                        value={ettDriverLicenseExpiryDate}
                        onChange={setEttDriverLicenseExpiryDate}
                        disabled={isPending}
                      />

                      <DateSelectField
                        label="Нэвтрэх үнэмлэхийн хугацаа"
                        value={entryPermitExpiryDate}
                        onChange={setEntryPermitExpiryDate}
                        disabled={isPending}
                      />

                      {isEditMode && (
                        <div>
                          <Label>Төлөв</Label>
                          <Select
                            value={status}
                            onChange={(value) => setStatus(value as UserStatus)}
                            disabled={isPending}
                            options={statusOptions}
                            className="w-full mt-1"
                            placeholder="Төлөв шинэчлэх"
                          />
                        </div>
                      )}

                      {isEditMode && (
                        <div>
                          <Label>Шинэ нууц үг</Label>
                          <Input
                            type="password"
                            className="mt-1"
                            placeholder="Шинэ нууц үг (хоосон бол өөрчлөхгүй)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isPending}
                          />
                        </div>
                      )}
                    </div>

                    {EmployeePositionMapMn.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {EmployeePositionMapMn.slice(3, 8).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setPosition(t)}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}

                    <GenericDropzoneComponent
                      title="Хэрэглэгчийн зураг"
                      onUpload={handleImageUpload}
                      initialUrl={imageUrl ?? undefined}
                      uploadFunction={employeeService.uploadUserImage}
                      disabled={isPending}
                      showPreview={true}
                    />
                  </form>
                )}

                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
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
                      onClick={
                        uploadMode === 'bulk'
                          ? handleBulkSubmit
                          : () => handleSubmit()
                      }
                      disabled={isPending}
                    >
                      {isPending
                        ? 'Түр хүлээнэ үү...'
                        : uploadMode === 'bulk'
                          ? 'Файл оруулах'
                          : isEditMode
                            ? 'Хадгалах'
                            : 'Үүсгэх'}
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
