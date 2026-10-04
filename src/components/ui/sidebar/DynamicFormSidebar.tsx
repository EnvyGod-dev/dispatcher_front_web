'use client'

import DropzoneComponent from '@/components/form/form-elements/DropZone'
import Switch from '@/components/form/switch/Switch'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from '@headlessui/react'
import { Button, Input, Select } from 'antd'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Label from '../../form/Label'
import Loading from '../../loading'
import DatePicker from '@/components/form/date-picker'

// TODO: deprecate or refactor this component
export type FieldType = 'text' | 'number' | 'select' | 'switch' | 'date' | 'textarea' | 'image'

export interface SelectOption {
  value: string | number
  label: string
}

export interface ImageAngle {
  angle: string
  label: string
}

export interface FieldConfig<T = any> {
  name: keyof T
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: SelectOption[] // for select fields
  defaultValue?: any
  colSpan?: 1 | 2
  disabled?: boolean
  searchable?: boolean // for select fields
  multiple?: boolean // for select fields
  validation?: (value: any) => string | undefined // custom validation
}

export interface ImageUploadConfig {
  enabled: boolean
  angles?: ImageAngle[]
}

export interface DynamicFormSidebarProps<T> {
  isOpen: boolean
  onClose: () => void
  title: string
  fields: FieldConfig<T>[]
  initialData?: Partial<T>
  onSubmit: (data: T) => Promise<void>
  onSuccess?: () => void
  onError?: (error: any) => void
  submitButtonText?: string
  cancelButtonText?: string
  imageUploadConfig?: ImageUploadConfig
  customValidation?: (data: T) => string | undefined
  isSubmitting?: boolean
  customSections?: React.ReactNode // for additional custom content
}

export default function DynamicFormSidebar<T extends Record<string, any>,>({
  isOpen,
  onClose,
  title,
  fields,
  initialData = {},
  onSubmit,
  onSuccess,
  onError,
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  imageUploadConfig,
  customValidation,
  isSubmitting = false,
  customSections,
}: DynamicFormSidebarProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>(() => {
    const initial: Partial<T> = { ...initialData }
    fields.forEach((field) => {
      if (initial[field.name] === undefined && field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue
      }
    })
    return initial
  })

  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const updated: Partial<T> = { ...initialData }
      fields.forEach((field) => {
        if (updated[field.name] === undefined && field.defaultValue !== undefined) {
          updated[field.name] = field.defaultValue
        }
      })
      setFormData(updated)
    }
  }, [initialData, fields])

  const resetForm = () => {
    const initial: Partial<T> = {}
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue
      }
    })
    setFormData(initial)
    setErrors({})
  }

  const handleInputChange = (field: keyof T, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleImageUpload = (angle: string, url: string) => {
    setFormData((prev) => {
      const images = (prev.images as any[]) || []
      const updated = images.filter((img: any) => img.angle !== angle)
      return { ...prev, images: [...updated, { angle, url }] }
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}

    // Validate required fields
    fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.name]
        if (value === undefined || value === '' || value === null) {
          newErrors[field.name] = `${field.label} is required`
        }
      }

      // Custom field validation
      if (field.validation && formData[field.name] !== undefined) {
        const error = field.validation(formData[field.name])
        if (error) {
          newErrors[field.name] = error
        }
      }
    })

    // Custom form-level validation
    if (customValidation) {
      const error = customValidation(formData as T)
      if (error) {
        toast.error("Validation Error")
        return false
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly")
      return
    }

    try {
      await onSubmit(formData as T)
      resetForm()
      if (onSuccess) onSuccess()
    } catch (error) {
      if (onError) onError(error)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onClose()
    }
  }

  const renderField = (field: FieldConfig<T>) => {
    const value = formData[field.name]
    const error = errors[field.name]

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={String(field.name)} className={`col-span-${field.colSpan || 1}`}>
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <Input
              type={field.type}
              value={value ?? ''}
              onChange={(e) =>
                handleInputChange(
                  field.name,
                  field.type === 'number' ? Number(e.target.value) : e.target.value
                )
              }
              disabled={isSubmitting || field.disabled}
              placeholder={field.placeholder}
              className="mt-2"
              status={error ? 'error' : ''}
            />
            {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
          </div>
        )

      case 'date':
        return (
          <div key={String(field.name)} className={`col-span-${field.colSpan || 1}`}>
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <DatePicker 
              id='date'
              placeholder={field.label}
              defaultDate={field.name as string}
              onChange={(currentDateString) => handleInputChange(field.name, currentDateString[0].toISOString()) }
            />
            {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
        </div>
        )
      

      case 'textarea':
        return (
          <div key={String(field.name)} className={`col-span-${field.colSpan || 2}`}>
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <Input.TextArea
              value={value ?? ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              disabled={isSubmitting || field.disabled}
              placeholder={field.placeholder}
              className="mt-2"
              rows={4}
              status={error ? 'error' : ''}
            />
            {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
          </div>
        )

      case 'select':
        return (
          <div key={String(field.name)} className={`col-span-${field.colSpan || 1}`}>
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <Select
              value={value || undefined}
              onChange={(val) => handleInputChange(field.name, val)}
              className="mt-2 w-full"
              placeholder={field.placeholder || `Select ${field.label}`}
              disabled={isSubmitting || field.disabled}
              options={field.options}
              showSearch={field.searchable}
              mode={field.multiple ? 'multiple' : undefined}
              filterOption={
                field.searchable
                  ? (input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  : undefined
              }
              status={error ? 'error' : ''}
            />
            {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
          </div>
        )

      case 'switch':
        return (
          <div key={String(field.name)} className="flex items-center gap-2">
            <Switch
              label={field.label}
              defaultChecked={value || false}
              onChange={(checked) => handleInputChange(field.name, checked)}
              disabled={isSubmitting || field.disabled}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="z-index-100 fixed inset-0 bg-gray-900/50 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto relative w-screen max-w-3xl transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700"
            >
              <TransitionChild>
                <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
                  >
                    <span className="sr-only">Close panel</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </TransitionChild>

              <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-gray-900 py-6 shadow-xl">
                <div className="px-4 sm:px-6">
                  <DialogTitle className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                    {title}
                  </DialogTitle>
                </div>

                <div className="relative mt-6 flex-1 px-4 sm:px-6">
                  {isSubmitting ? (
                    <div className="flex items-center justify-center h-full">
                      <Loading />
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        {fields
                          .filter((f) => f.type !== 'switch') 
                          .map((field) => renderField(field))}
                      </div>

                      {/* Boolean switches section */}
                      {fields.some((f) => f.type === 'switch') && (
                        <div className="flex gap-4 flex-wrap">
                          {fields
                            .filter((f) => f.type === 'switch')
                            .map((field) => renderField(field))}
                        </div>
                      )}

                      {/* Custom sections */}
                      {customSections}

                      {/* Image upload section */}
                      {imageUploadConfig?.enabled && imageUploadConfig.angles && (
                        <div className="grid grid-cols-2 gap-6 mt-6">
                          {imageUploadConfig.angles.map(({ angle, label }) => (
                            <DropzoneComponent
                              key={angle}
                              position={angle}
                              title={label}
                              onUpload={(url) => handleImageUpload(angle, url)}
                            />
                          ))}
                        </div>
                      )}
                    </form>
                  )}
                </div>

                <div className="flex flex-shrink-0 justify-end px-4 py-4 gap-3">
                  <Button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                  >
                    {cancelButtonText}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {isSubmitting ? 'Processing...' : submitButtonText}
                  </Button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  )
}