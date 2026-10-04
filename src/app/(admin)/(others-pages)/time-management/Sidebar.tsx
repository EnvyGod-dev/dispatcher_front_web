'use client';

import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
    TransitionChild,
} from '@headlessui/react';

import type {
    ShiftLog,
} from '@/services/internal/equipment-shift-log';

import TimeManagementForm from './TimeManagmentForm';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingLog?: ShiftLog;
}

export default function TimeManagementSidebar({
    isOpen,
    onClose,
    onSuccess,
    editingLog,
}: Props) {
    const isEditMode =
        Boolean(editingLog);

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="relative z-50"
        >
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-950/50 backdrop-blur-[2px] transition-opacity duration-300 data-[closed]:opacity-0"
            />

            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
                        <DialogPanel
                            transition
                            className="pointer-events-auto w-screen max-w-7xl transform transition duration-300 ease-in-out data-[closed]:translate-x-full"
                        >
                            <TransitionChild>
                                <div className="absolute left-0 top-0 -ml-10 flex pt-4 pr-2 sm:-ml-12">
                                    <button
                                        type="button"
                                        onClick={
                                            onClose
                                        }
                                        className="rounded-full bg-white/95 p-2 text-gray-500 shadow-lg transition hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white"
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
                            </TransitionChild>

                            <div className="flex h-full flex-col bg-gray-50 shadow-2xl dark:bg-gray-950">

                                {/* HEADER */}

                                <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
                                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {isEditMode
                                            ? 'Цаг ашиглалтын бүртгэл засах'
                                            : 'Цаг ашиглалтын бүртгэл нэмэх'}
                                    </DialogTitle>

                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Огноо болон ээлж сонгоод тухайн ээлжийн бүх техникийн ажилласан болон сул зогсолтын цагийг бүртгэнэ.
                                    </p>
                                </div>

                                {/* BODY */}

                                <div className="flex-1 overflow-y-auto">
                                    <div className="mx-auto w-full max-w-7xl p-5 sm:p-6">
                                        <TimeManagementForm
                                            key={
                                                editingLog?.id ??
                                                'new'
                                            }
                                            editingLog={
                                                editingLog
                                            }
                                            onCancel={
                                                onClose
                                            }
                                            onSuccess={
                                                onSuccess
                                            }
                                        />
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