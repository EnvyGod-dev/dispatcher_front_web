'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from '@headlessui/react'
import Label from '@/components/form/Label'
import Input from '@/components/form/input/InputField'
import TextArea from '@/components/form/input/TextArea'
import Button from '@/components/ui/button/Button'
import { Route, UpdateRouteInput } from '@/services/internal/routes/types'
import routeService from '@/services/internal/routes'


interface RouteFormSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingRoute?: Route
}

export default function RouteFormSidebar({
  isOpen,
  onClose,
  onSuccess,
  editingRoute,
}: RouteFormSidebarProps) {
  const [routeCode, setCode] = useState('')
  const [description, setDescription] = useState('')

  const isEditMode = !!editingRoute

  useEffect(() => {
    console.log(description)
  }, [description])

  // populating
  useEffect(() => {
    if (editingRoute) {
      setCode(editingRoute.routeCode)
      setDescription(editingRoute.description || '')
    }
  }, [editingRoute])

  // Create mutation  
  const createMutation = useMutation({
    mutationFn: routeService.createRoute,
    onSuccess: () => {
      toast.success('Маршрут амжилттай үүслээ')
      resetForm()
      if (onSuccess) onSuccess()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Маршрут үүсгэхэд алдаа гарлаа')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRouteInput }) =>
      routeService.updateRoute({ ...data, id }),
    onSuccess: () => {
      toast.success('Маршрут амжилттай шинэчлэгдлээ')
      resetForm()
      if (onSuccess) onSuccess()
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Маршрут шинэчлэхэд алдаа гарлаа')
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const resetForm = () => {
    setCode('')
    setDescription('')
  }

  const handleSubmit = async () => {
    if (!routeCode.trim()) {
      toast.error('Код болон нэр заавал бөглөнө үү')
      return
    }

    const formData = {
      id: isEditMode ? editingRoute.id : undefined,
      routeCode: routeCode.trim(),
      description: description.trim() || undefined,
    }

    try {
      if (isEditMode && editingRoute) {
        console.log(description, 'description in edit')

        await updateMutation.mutateAsync({ id: editingRoute.id, data: { ...formData, id: editingRoute.id } })
      } else {
        await createMutation.mutateAsync(formData)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleClose = () => {
    if (!isPending) {
      resetForm()
      onClose()
    }
  }

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
              className="pointer-events-auto w-screen max-w-md transform transition duration-300 ease-in-out data-[closed]:translate-x-full"
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
                        stroke="white"
                      >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </TransitionChild>

              <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-xl">
                <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isEditMode ? 'Маршрут засах' : 'Маршрут үүсгэх'}
                  </DialogTitle>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isEditMode ? 'Маршрутын мэдээллийг шинэчлэх' : 'Шинэ маршрут нэмэх'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  <div>
                    <Label>
                      Код <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="mt-1"
                      placeholder="ROUTE-001"
                      value={routeCode}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>Тайлбар</Label>
                    <TextArea
                      className="mt-1"
                      rows={3}
                      placeholder="Маршрутын тайлбар"
                      value={description}
                      onChange={(e) => setDescription(e)}
                      disabled={isPending}
                    />
                  </div>

                </form>

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
                      onClick={handleSubmit}
                      disabled={isPending}
                    >
                      {isPending ? 'Түр хүлээнэ үү...' : isEditMode ? 'Хадгалах' : 'Үүсгэх'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  )
}