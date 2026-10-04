"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import employeeService from "@/services/internal/employee";
import { userRoleOptions } from "@/services/internal/employee/type";
import type { Employee } from "@/services/internal/employee/type";
import type { UserRole } from "@/services/roles";
import notificationService from "@/services/internal/notification";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type RoleFilter = UserRole | "all";

export default function NotificationsPage() {
  const [selectedRole, setSelectedRole] = useState<RoleFilter>("driver");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data: employeesData, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ["notification-employees", selectedRole],
    queryFn: () =>
      employeeService.getEmployees({
        offset: 0,
        limit: 1000,
        role: selectedRole === "all" ? undefined : selectedRole,
      }),
    staleTime: 60000,
  });

  const employees = useMemo(
    () => (employeesData?.data || []).filter((e: Employee) => e.isActive),
    [employeesData],
  );

  const sendMutation = useMutation({
    mutationFn: () => {
      const userIds = employees.map((e: Employee) => e.id);
      return notificationService.sendBulk({
        userIds,
        title,
        body,
      });
    },
    onSuccess: (res) => {
      toast.success(
        `Мэдэгдэл амжилттай илгээлээ (${res.body.successCount || 0} хэрэглэгч)`,
      );
      setTitle("");
      setBody("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Мэдэгдэл илгээхэд алдаа гарлаа");
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Гарчиг болон мэдэгдлийн текст оруулна уу");
      return;
    }
    if (employees.length === 0) {
      toast.error("Илгээх хэрэглэгч олдсонгүй");
      return;
    }
    sendMutation.mutate();
  };

  const roleOptions = [
    { value: "all", label: "Бүх хэрэглэгч" },
    ...userRoleOptions.filter((r) => r.value !== "superadmin"),
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Мэдэгдэл илгээх" />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Мэдэгдэл илгээх хэрэглэгч</Label>
              <Select
                options={roleOptions}
                placeholder="Үүрэг сонгох"
                value={selectedRole}
                onChange={(value) => setSelectedRole(value as RoleFilter)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isEmployeesLoading
                  ? "Ачааллаж байна..."
                  : `${employees.length} идэвхтэй хэрэглэгч`}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Гарчиг</Label>
              <Input
                type="text"
                placeholder="Мэдэгдлийн гарчиг"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Мэдэгдлийн текст</Label>
              <TextArea
                placeholder="Мэдэгдлийн дэлгэрэнгүй текст"
                rows={4}
                value={body}
                onChange={(value) => setBody(value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={
                  sendMutation.isPending ||
                  !title.trim() ||
                  !body.trim() ||
                  employees.length === 0
                }
              >
                <Send className="mr-2 h-4 w-4" />
                {sendMutation.isPending ? "Илгээж байна..." : "Мэдэгдэл илгээх"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
