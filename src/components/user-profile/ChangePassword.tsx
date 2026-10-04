"use client";
import { Lock } from 'lucide-react';
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import userService from '@/services/internal/user';
import { toast } from 'sonner';
import { Divider } from 'antd';

export default function ChangePasswordCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { isPending, mutateAsync: changePassword } = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      userService.resetPassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Нууц үг шинэчлэгдлээ.')

      setTimeout(() => {
        closeModal()
      }, 500)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Нууц үг шинэчлэхэд алдаа гарлаа.')
    },
  })

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Нууц үг таарахгүй байна.")
      return;
    }
    
    if (!currentPassword || !newPassword) {
      toast.error("Нууц үг оруулна уу.")
      return;
    }

    await changePassword({ currentPassword, newPassword })

    closeModal();
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Нууцлалын аюулгүй байдал
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
             Системээс үүсгэсэн нууц үгийг ашиглаж байгаа бол аюулгүй байдлаа хамгаалах үүднээс өөрийн нууц үгээ үүсгээрэй.
          </p>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <Lock size={16} /> 
            Нууц үг шинэчлэх
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-bold text-brand-500 dark:text-white/90 lg:mb-6">
                  Нууц үг шинэчлэх
                </h5>

                <Divider /> 

                <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                  <div>
                    <Label>Одоогийн нууц үг</Label>
                    <Input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isPending}
                      required={true}
                    />
                  </div>

                  <div>
                    <Label>Шинэ нууц үг</Label>
                    <Input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isPending}
                      required={true}
                    />
                  </div>

                  <div>
                    <Label>Шинэ нууц үг давтах</Label>
                    <Input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isPending}
                      required={true}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Хаах
              </Button>
              <Button size="sm" onClick={handleSave}>
                Хадгалах
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}