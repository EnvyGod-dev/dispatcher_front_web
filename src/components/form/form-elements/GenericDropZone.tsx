"use client";
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from 'sonner';

interface GenericDropzoneComponentProps {
  title: string;
  onUpload: (url: string) => void;
  initialUrl?: string;
  uploadFunction: (file: File) => Promise<{ body: { url: string } }>;
  acceptedFileTypes?: Record<string, string[]>;
  maxFileSize?: number; // in bytes
  showPreview?: boolean;
  className?: string;
  disabled?: boolean;
}

const GenericDropzoneComponent: React.FC<GenericDropzoneComponentProps> = ({
  title,
  onUpload,
  initialUrl,
  uploadFunction,
  acceptedFileTypes = {
    "image/png": [],
    "image/jpeg": [],
    "image/webp": [],
    "image/svg+xml": [],
  },
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  showPreview = true,
  className = "",
  disabled = false,
}) => {
  const [uploadedUrl, setUploadedUrl] = useState(initialUrl || "");

  const { isPending, mutateAsync: uploadImage } = useMutation({
    mutationFn: async (file: File) => {
      const res = await uploadFunction(file);
      return res.body.url;
    },
    onSuccess: (url: string) => {
      setUploadedUrl(url);
      onUpload(url);
      toast.success('Файл амжилттай хуулагдлаа');
    },
    onError: (error: Error) => {
      toast.error(error.message || "Файл хуулахад алдаа гарлаа");
    },
  });
  
  const onDrop = (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
  
    const file = acceptedFiles[0];
    
    // File size validation
    if (file.size > maxFileSize) {
      toast.error(`Файлын хэмжээ ${Math.round(maxFileSize / (1024 * 1024))}MB-аас бага байх ёстой`);
      return;
    }
  
    uploadImage(file); 
  };
  
  const onDropRejected = (rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast.error('Зөвхөн зургийн файл хуулна уу');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    disabled: disabled || isPending,
    multiple: false,
  });

  const removeImage = () => {
    setUploadedUrl("");
    onUpload("");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </span>
        {uploadedUrl && showPreview && (
          <button
            type="button"
            onClick={removeImage}
            disabled={disabled || isPending}
            className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
          >
            Устгах
          </button>
        )}
      </div>
      
      <div
        {...getRootProps()}
        className={`transition border border-dashed rounded-xl cursor-pointer p-5 flex flex-col items-center justify-center min-h-[160px] ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
        } ${
          disabled || isPending ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <input {...getInputProps()} />
        
        {uploadedUrl && showPreview ? (
          <div className="relative w-full max-w-xs">
            <Image
              src={uploadedUrl}
              alt="Uploaded file"
              className="rounded-lg object-cover w-full h-32"
              width={300}
              height={128}
              onError={(e) => {
                console.error('Image load error:', e);
                setUploadedUrl("");
              }}
            />
          </div>
        ) : (
          <div className="text-center">
            {isPending ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Хуулж байна...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h4 className="mb-2 font-semibold text-gray-800 dark:text-white text-sm">
                  Зураг оруулах
                </h4>
                <span className="text-xs text-gray-500 text-center">
                  PNG, JPG {Math.round(maxFileSize / (1024 * 1024))}MB хүртэл 
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericDropzoneComponent;