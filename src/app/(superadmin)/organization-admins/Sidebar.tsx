'use client'

import Label from '@/components/form/Label'
import Input from '@/components/form/input/InputField'
import Button from '@/components/ui/button/Button'
import employeeService from '@/services/internal/employee'
import { CreateEmployeeInput } from '@/services/internal/employee/type'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from '@headlessui/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Select } from 'antd'
import { useState, useMemo, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/components/AuthProvider'
import organizationService from '@/services/internal/organization'
import GenericDropzoneComponent from '@/components/form/form-elements/GenericDropZone'
import Loading from '@/components/loading'

interface CreateEmployeeSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Backend rbac.middleware-ийн SUBDOMAIN_REGEX-тэй ижил.
 */
const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'stratum.mn'

/**
 * Хэрэглэгчийн бичсэнийг subdomain формат руу ойртуулна:
 * жижиг үсэг, зөвхөн a-z 0-9 болон '-'.
 */
const sanitizeSubdomain = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 63)

export default function CreateAdminSidebar({
  isOpen,
  onClose,
  onSuccess,
}: CreateEmployeeSidebarProps) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('')
  const [isCreatingNewOrg, setIsCreatingNewOrg] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [orgSubdomain, setOrgSubdomain] = useState('')
  const [orgLogoUrl, setOrgLogoUrl] = useState('')
  const [orgCode, setOrgCode] = useState('')
  const [orgContactEmail, setOrgContactEmail] = useState('')
  const [orgContactPhone, setOrgContactPhone] = useState('')
  const [password, setPassword] = useState('')

  const handleImageUpload = (url: string) => {
    setImageUrl(url)
  }

  const handleOrgLogoUpload = (url: string) => {
    setOrgLogoUrl(url)
  }

  const handleOrganizationChange = (value: string) => {
    if (value === 'CREATE_NEW') {
      setIsCreatingNewOrg(true)
      setSelectedOrganizationId('')
    } else {
      setIsCreatingNewOrg(false)
      setSelectedOrganizationId(value)
    }
  }

  const { data: organizationsData, isLoading: isLoadingOrganizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationService.getOrganizations({ limit: 100, offset: 0 }),
    enabled: user?.role === 'superadmin',
  })

  const organizationOptions = useMemo(() => {
    const options = []

    if (organizationsData?.data) {
      options.push(...organizationsData.data.map(org => ({
        value: org.id,
        label: org.name,
      })))
    }

    options.push({
      value: 'CREATE_NEW',
      label: '+ Шинэ байгууллага үүсгэх',
    })

    return options
  }, [organizationsData])

  const { isPending: isCreatingEmployee, mutateAsync: createEmployee } = useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => {
      toast.success('Админ амжилттай нэмэгдлээ')
      resetForm()
      if (onSuccess) onSuccess()
      setTimeout(() => {
        onClose()
      }, 500)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Админ бүртгэхэд алдаа гарлаа')
    },
  })

  const { isPending: isCreatingOrganization, mutateAsync: createOrganization } = useMutation({
    mutationFn: organizationService.createOrganization,
    onError: (error: Error) => {
      toast.error(error.message || 'Байгууллага үүсгэхэд алдаа гарлаа')
    },
  })

  const isPending = isCreatingEmployee || isCreatingOrganization

  const resetForm = () => {
    setEmail('')
    setFirstName('')
    setLastName('')
    setPhone('')
    setImageUrl('')
    setSelectedOrganizationId('')
    setIsCreatingNewOrg(false)
    setOrgName('')
    setOrgSubdomain('')
    setOrgLogoUrl('')
    setOrgCode('')
    setOrgContactEmail('')
    setOrgContactPhone('')
    setPassword('')
  }

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('И-мэйл, нэр, овог заавал бөглөнө үү')
      return
    }

    if (user?.role === 'superadmin' && !selectedOrganizationId && !isCreatingNewOrg) {
      toast.error('Байгууллага сонгоно уу')
      return
    }

    if (isCreatingNewOrg) {
      if (!orgName.trim()) {
        toast.error('Байгууллагын нэр заавал бөглөнө үү')
        return
      }

      if (!orgSubdomain.trim()) {
        toast.error('Subdomain заавал бөглөнө үү')
        return
      }

      if (!SUBDOMAIN_REGEX.test(orgSubdomain.trim())) {
        toast.error(
          'Subdomain зөвхөн жижиг латин үсэг, тоо, "-" агуулах ба "-"-ээр эхэлж/төгсөж болохгүй'
        )
        return
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      toast.error('И-мэйл хаяг буруу байна')
      return
    }

    try {
      let organizationId = selectedOrganizationId

      if (isCreatingNewOrg) {
        const orgData = {
          name: orgName.trim(),
          subdomain: orgSubdomain.trim(),
          logoUrl: orgLogoUrl.trim() || undefined,
          code: orgCode.trim(),
          contactEmail: orgContactEmail.trim(),
          contactPhone: orgContactPhone.trim() || undefined,
        }

        const createdOrg = await createOrganization(orgData)
        organizationId = createdOrg.body.id
        toast.success('Байгууллага амжилттай үүслээ.')
      }

      const formData: CreateEmployeeInput = {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: 'admin',
        phone: Number(phone.trim()),
        imageUrl: imageUrl.trim() || undefined,
        password,
        organizationId:
          user?.role === 'superadmin'
            ? organizationId
            : user?.organizationId ?? undefined,
      }

      await createEmployee(formData)
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
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
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

              <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-xl">
                <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Уурхайн админ томилох
                  </DialogTitle>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Харилцагч байгууллагыг удирдах админ хэрэглэгчийн бүртгэл
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  <div>
                    <Label>Утасны дугаар</Label>
                    <Input
                      type="tel"
                      className="mt-1"
                      placeholder="99001122"
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>
                      И-мэйл хаяг <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      className="mt-1"
                      placeholder="user@example.com"
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label>
                      Нууц үг <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="password"
                      className="mt-1"
                      placeholder="нууц үг"
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        Нэр <span className="text-red-500">*</span>
                      </Label>
                      <Input
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
                        className="mt-1"
                        placeholder=""
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>
                      Байгууллага <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      className="w-full mt-1"
                      placeholder="Байгууллага сонгох"
                      value={isCreatingNewOrg ? 'CREATE_NEW' : selectedOrganizationId}
                      onChange={handleOrganizationChange}
                      disabled={isPending || isLoadingOrganizations}
                      options={organizationOptions}
                      loading={isLoadingOrganizations}
                    />
                  </div>

                  {isCreatingNewOrg && (
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Шинэ байгууллага үүсгэх</h4>

                      <div>
                        <Label>
                          Байгууллагын нэр <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className="mt-1"
                          placeholder="Байгууллагын нэр"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          disabled={isPending}
                        />
                      </div>

                      <div>
                        <Label>
                          Subdomain <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className="mt-1"
                          placeholder="khavtsgait"
                          value={orgSubdomain}
                          onChange={(e) => setOrgSubdomain(sanitizeSubdomain(e.target.value))}
                          disabled={isPending}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {orgSubdomain
                            ? `${orgSubdomain}.${ROOT_DOMAIN}`
                            : 'Жижиг латин үсэг, тоо, "-" ашиглана'}
                        </p>
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
                          onChange={(e) => setOrgContactPhone(e.target.value)}
                          disabled={isPending}
                        />
                      </div>

                      <GenericDropzoneComponent
                        title="Байгууллагын лого"
                        onUpload={handleOrgLogoUpload}
                        initialUrl={orgLogoUrl}
                        uploadFunction={employeeService.uploadUserImage}
                        disabled={isPending}
                        showPreview={true}
                      />
                    </div>
                  )}

                  <div>
                    <Label>
                      Системийн үүрэг <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      className="w-full mt-1"
                      placeholder="Системийн үүрэг"
                      value='Админ'
                      disabled={true}
                    />
                  </div>

                  <GenericDropzoneComponent
                    title="Хэрэглэгчийн зураг"
                    onUpload={handleImageUpload}
                    initialUrl={imageUrl}
                    uploadFunction={employeeService.uploadUserImage}
                    disabled={isPending}
                    showPreview={true}
                  />
                </form>

                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                  {
                    isPending ?
                      <Loading /> :
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
                        onClick={() => handleSubmit()}
                        disabled={isPending}
                      >
                        {isPending ? 'Нэмж байна...' : 'Нэмэх'}
                      </Button>
                    </div>
                  }

                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  )
}