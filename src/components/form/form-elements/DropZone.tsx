'use client';
import vehicleService from '@/services/internal/vehicle';
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

interface DropzoneComponentProps {
  position: string;
  title: string;
  onUpload: (url: string) => void;
  initialUrl?: string;
}

const DropzoneComponent: React.FC<DropzoneComponentProps> = ({
  position,
  title,
  onUpload,
  initialUrl,
}) => {
  const [uploadedUrl, setUploadedUrl] = useState(initialUrl || '');

  const { isPending, mutateAsync: uploadImage } = useMutation({
    mutationFn: async (file: File) => {
      const res = await vehicleService.uploadVehicleImage(file);
      return res.body.url;
    },
    onSuccess: (url: string) => {
      setUploadedUrl(url); // update state
      onUpload(url); // call parent callback
      toast.success('Зураг хадгалагдлаа.');
    },
    onError: (x) => {
      toast.error(x.message || 'Зураг оруулахад алдаа гарлаа.');
    },
  });

  const onDrop = (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    const file = acceptedFiles[0];

    uploadImage(file);
  };

  useEffect(() => {
    setUploadedUrl(initialUrl || '');
  }, [initialUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': [],
      'image/jpeg': [],
      'image/webp': [],
      'image/svg+xml': [],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`transition border border-gray-300 border-dashed rounded-xl cursor-pointer p-5 flex flex-col items-center justify-center min-h-[160px] ${
        isDragActive
          ? 'border-brand-500 bg-gray-100 dark:bg-gray-800'
          : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
      }`}
    >
      <input {...getInputProps()} />
      {uploadedUrl ? (
        <Image src={uploadedUrl} alt={position} width={472} height={152} />
      ) : (
        <>
          <h4 className="mb-2 font-semibold text-gray-800 dark:text-white">
            {title}
          </h4>
          <span className="text-xs text-gray-500 text-center">
            {isDragActive ? 'Drop file here' : 'Click or drag image'}
          </span>
        </>
      )}
    </div>
  );
};

export default DropzoneComponent;
