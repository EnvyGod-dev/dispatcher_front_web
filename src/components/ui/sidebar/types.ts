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
