import { User2Icon, Camera } from 'lucide-react';
import Image from 'next/image';
import { uploadFile } from '@/services/helper/upload-file';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import userService from '@/services/internal/user';

interface UserMetaDataProps {
  firstName: string;
  lastName: string;
  role: string;
  organizationName: string;
  imageUrl: string;
  phoneNumber: string;
  onImageUpdate?: (imageUrl: string) => void;
}

export default function UserMetaCard({
  role,
  organizationName,
  imageUrl,
  firstName,
  lastName,
  onImageUpdate,
}: UserMetaDataProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { updateUser, user } = useAuth();

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // First upload the image to get the URL
      const result = await uploadFile(file, '/api/admin/user/upload-image');
      
      // Then update the profile with the new image URL
      const updateResponse = await userService.updateProfile({
        imageUrl: result.url
      });

      // Update the user state directly without refetching
      if (user && updateResponse.body) {
        updateUser(updateResponse.body);
      }

      if (onImageUpdate) {
        onImageUpdate(result.url);
      }

      toast.success('Зураг амжилттай солигдлоо.');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Зураг оруулахад алдаа гарлаа.');
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="relative group w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              {imageUrl ? (
                <Image
                  width={80}
                  height={80}
                  src={imageUrl}
                  alt="user"
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="mr-1 overflow-hidden rounded-full flex items-center justify-center w-full h-full">
                  <User2Icon
                    width={80}
                    height={80}
                    strokeWidth={1}
                    color="#ff810a"
                  />
                </span>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <label
                  htmlFor="profile-image-upload"
                  className="cursor-pointer"
                >
                  <Camera size={20} className="text-white" />
                </label>
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              )}
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {firstName} {lastName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {role}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {organizationName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
