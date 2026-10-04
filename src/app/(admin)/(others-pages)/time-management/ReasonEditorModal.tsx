'use client';

import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
} from '@headlessui/react';

import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';

// ============================================================
// TYPES
// ============================================================

type ReasonValue = {
    hours: string;
    notes: string;
};

type ReasonItem = {
    id: string;
    name: string;
};

interface Props {
    open: boolean;

    onClose: () => void;

    reasons: ReasonItem[];

    values: Record<
        string,
        ReasonValue
    >;

    onChange: (
        reasonId: string,
        field:
            | 'hours'
            | 'notes',
        value: string
    ) => void;

    totalHours: number;

    loading?: boolean;

    newReasonName: string;

    onNewReasonNameChange: (
        value: string
    ) => void;

    onCreateReason:
    () =>
        | void
        | Promise<void>;

    isCreatingReason?: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ReasonEditorModal({
    open,
    onClose,
    reasons,
    values,
    onChange,
    totalHours,
    loading = false,
    newReasonName,
    onNewReasonNameChange,
    onCreateReason,
    isCreatingReason = false,
}: Props) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            className="relative z-[70]"
        >
            {/* ================================================
                BACKDROP
            ================================================= */}

            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-950/60 backdrop-blur-[2px] transition-opacity duration-200 data-[closed]:opacity-0"
            />

            {/* ================================================
                MODAL
            ================================================= */}

            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <DialogPanel
                        transition
                        className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition duration-200 data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-gray-900"
                    >
                        {/* ====================================
                            HEADER
                        ===================================== */}

                        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                            <div>
                                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Сул зогсолтын шалтгаан
                                </DialogTitle>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Тухайн техникийн сул зогсолтын шалтгаан болон зарцуулсан цагийг бүртгэнэ.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    onClose
                                }
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                            >
                                <span className="sr-only">
                                    Хаах
                                </span>

                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={
                                            2
                                        }
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* ====================================
                            CREATE IDLE REASON
                        ===================================== */}

                        <div className="border-b border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/40">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                <div className="flex-1">
                                    <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                                        Шинэ сул зогсолтын шалтгаан
                                    </p>

                                    <Input
                                        placeholder="Шалтгааны нэр"
                                        value={
                                            newReasonName
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            onNewReasonNameChange(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        disabled={
                                            isCreatingReason
                                        }
                                    />
                                </div>

                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() =>
                                        void onCreateReason()
                                    }
                                    disabled={
                                        isCreatingReason ||
                                        !newReasonName.trim()
                                    }
                                >
                                    {isCreatingReason
                                        ? 'Нэмж байна...'
                                        : 'Шалтгаан нэмэх'}
                                </Button>
                            </div>
                        </div>

                        {/* ====================================
                            REASON LIST
                        ===================================== */}

                        <div className="max-h-[65vh] overflow-y-auto">
                            {loading ? (
                                <div className="px-5 py-10 text-center text-sm text-gray-400">
                                    Ачааллаж байна...
                                </div>
                            ) : reasons.length ===
                                0 ? (
                                <div className="px-5 py-10 text-center text-sm text-gray-400">
                                    Сул зогсолтын шалтгаан бүртгэгдээгүй байна.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {reasons.map(
                                        (
                                            reason
                                        ) => {
                                            const value =
                                                values[
                                                reason
                                                    .id
                                                ] ?? {
                                                    hours:
                                                        '',
                                                    notes:
                                                        '',
                                                };

                                            return (
                                                <div
                                                    key={
                                                        reason.id
                                                    }
                                                    className="grid grid-cols-1 gap-3 px-5 py-3 md:grid-cols-[minmax(220px,1fr)_120px_minmax(220px,1fr)] md:items-center"
                                                >
                                                    {/* REASON */}

                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                            {
                                                                reason.name
                                                            }
                                                        </p>
                                                    </div>

                                                    {/* HOURS */}

                                                    <div>
                                                        <p className="mb-1 text-[11px] text-gray-400 md:hidden">
                                                            Цаг
                                                        </p>

                                                        <Input
                                                            type="number"
                                                            step={
                                                                0.1
                                                            }
                                                            min="0"
                                                            placeholder="0.0"
                                                            value={
                                                                value.hours
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                onChange(
                                                                    reason.id,
                                                                    'hours',
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </div>

                                                    {/* NOTES */}

                                                    <div>
                                                        <p className="mb-1 text-[11px] text-gray-400 md:hidden">
                                                            Тэмдэглэл
                                                        </p>

                                                        <Input
                                                            placeholder="Тэмдэглэл"
                                                            value={
                                                                value.notes
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                onChange(
                                                                    reason.id,
                                                                    'notes',
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ====================================
                            FOOTER
                        ===================================== */}

                        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-800">
                            <div>
                                <p className="text-xs text-gray-400">
                                    Нийт сул зогсолтын цаг
                                </p>

                                <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                                    {totalHours.toFixed(
                                        1
                                    )}{' '}
                                    цаг
                                </p>
                            </div>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={
                                    onClose
                                }
                            >
                                Дуусгах
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}