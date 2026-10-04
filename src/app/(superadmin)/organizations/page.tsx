'use client';

import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import DynamicTable from '@/components/tables/DynamicTable';
import Pagination from '@/components/tables/Pagination';
import { ConfirmDialog } from '@/components/ui/alert/Alert';
import Badge from '@/components/ui/badge/Badge';
import { TableActions } from '@/components/ui/table/TableActions';
import { TableColumn } from '@/components/ui/table/TableColumn';
import { usePagination } from '@/hooks/pagination';
import organizationService from '@/services/internal/organization';
import { Organization } from '@/services/internal/organization/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import CreateOrganizationSidebar from './Sidebar';

/**
 * Лого байхгүй эсвэл ачаалагдахгүй бол
 * нэрийн эхний үсгийг харуулна.
 */
function OrganizationLogo({
  logoUrl,
  name,
}: {
  logoUrl?: string | null;
  name: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!logoUrl || hasError) {
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        {name.trim().charAt(0).toUpperCase() || '?'}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      onError={() => setHasError(true)}
      className="h-9 w-9 flex-shrink-0 rounded-full border border-gray-200 bg-white object-contain p-0.5 dark:border-gray-700"
    />
  );
}

export default function OrganizationManagementPage() {
  const { offset, limit, paginate } = usePagination();

  const queryClient = useQueryClient();

  const [isAddSidebarOpen, setIsAddSidebarOpen] = useState(false);

  const [editingOrganization, setEditingOrganization] = useState<
    Organization | undefined
  >();

  const [deletingOrganization, setDeletingOrganization] = useState<
    Organization | undefined
  >();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['organizations', { offset, limit }],
    queryFn: () =>
      organizationService.getOrganizations({
        offset,
        limit,
      }),
  });

  const dataSource = data?.data || [];
  const total = data?.totalCount || dataSource.length;

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      organizationService.deleteOrganization(id),

    onSuccess: () => {
      toast.success('Байгууллага амжилттай устлаа.');
      refetch();
    },

    onError: () => {
      toast.error('Байгууллага устгахад алдаа гарлаа');
    },
  });

  const handleEdit = (organization: Organization) => {
    setEditingOrganization(organization);
    setIsAddSidebarOpen(true);
  };

  const handleDelete = (organization: Organization) => {
    setDeletingOrganization(organization);
  };

  const columns = [
    TableColumn.custom<Organization>(
      'createdAt',
      'Элссэн огноо',
      (organization) => (
        <span className="text-gray-800 text-theme-sm dark:text-white/90">
          {new Date(organization.createdAt).toLocaleDateString()}
        </span>
      )
    ).build(),

    TableColumn.custom<Organization>(
      'organization.name',
      'Байгууллага',
      (organization) => (
        <div className="flex items-center gap-3">
          <OrganizationLogo
            logoUrl={organization.logoUrl}
            name={organization.name}
          />
          <span className="text-gray-800 text-theme-sm italic dark:text-white/90">
            {organization.name}
          </span>
        </div>
      )
    ).build(),

    TableColumn.custom<Organization>(
      'subdomain',
      'Вэб хаяг',
      (organization) => {
        if (!organization.subdomain) {
          return (
            <span className="text-theme-sm text-gray-400">
              -
            </span>
          );
        }

        const url = `https://${organization.subdomain}.stratum.mn`;

        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-theme-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {organization.subdomain}.stratum.mn
          </a>
        );
      }
    ).build(),

    TableColumn.text<Organization>(
      'phone',
      'Холбогдох дугаар',
      'contactPhone'
    ).build(),

    TableColumn.custom<Organization>(
      'deactivatedAt',
      'Төлөв',
      (organization) => (
        <div>
          <span className="text-gray-800 text-theme-sm dark:text-white/90">
            {organization.deactivatedAt ? (
              <Badge color="error">
                Идэвхгүй
              </Badge>
            ) : (
              <Badge color="success">
                Идэвхтэй
              </Badge>
            )}
          </span>
        </div>
      )
    ).build(),
  ];

  const actions = [
    TableActions.edit<Organization>(handleEdit),
    TableActions.delete<Organization>(handleDelete),
  ];

  const handleCloseSidebar = () => {
    setIsAddSidebarOpen(false);
    setEditingOrganization(undefined);
  };

  const handleOrganizationAdded = () => {
    queryClient.invalidateQueries({
      queryKey: ['organizations'],
    });

    setIsAddSidebarOpen(false);
    setEditingOrganization(undefined);
  };

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Байгууллага бүртгэл"
        actions={{
          label: 'Нэмэх',
          onClick: () => {
            setEditingOrganization(undefined);
            setIsAddSidebarOpen(true);
          },
          variant: 'primary',
        }}
      />

      <div className="space-y-4">
        <DynamicTable<Organization>
          indexOffset={offset}
          data={[dataSource]}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          rowKey="id"
          emptyMessage="Бүртгэл байхгүй"
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={(page) => paginate(page, limit)}
          isLoading={isLoading}
        />
      </div>

      <CreateOrganizationSidebar
        isOpen={isAddSidebarOpen}
        onSuccess={handleOrganizationAdded}
        onClose={handleCloseSidebar}
        editingOrganization={editingOrganization}
      />

      <ConfirmDialog
        open={!!deletingOrganization}
        onOpenChange={() =>
          setDeletingOrganization(undefined)
        }
        title="Байгууллагыг устгах уу?"
        description={`"${
          deletingOrganization?.name || ''
        }" байгууллагыг устгах үйлдлийг буцаах боломжгүй.`}
        variant="destructive"
        onConfirm={() => {
          if (!deletingOrganization) {
            return;
          }

          deleteMutation.mutate(
            deletingOrganization.id
          );

          setDeletingOrganization(undefined);
        }}
      />
    </div>
  );
}