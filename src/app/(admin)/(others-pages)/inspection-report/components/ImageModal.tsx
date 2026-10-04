'use client';

import { X, ZoomIn, ZoomOut } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageModal({
  isOpen,
  imageUrl,
  onClose,
}: ImageModalProps) {
  const [zoom, setZoom] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Reset zoom when opening
      setZoom(1);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable body scroll when modal closes
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    // Handle ESC key
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  const handleClose = () => {
    setIsAnimating(false);
    // Wait for animation to complete before closing
    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!imageUrl) return null;

  if (!isOpen && !isAnimating) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${
        isOpen && isAnimating ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-in-out ${
          isOpen && isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`relative bg-white dark:bg-gray-900 w-full max-w-6xl h-full max-h-[90vh] rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-in-out transform ${
          isOpen && isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-lg shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Үзлэгийн зураг
          </h3>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              disabled={zoom <= 0.5}
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              disabled={zoom >= 3}
            >
              <ZoomIn size={18} />
            </button>

            {/* Reset Zoom */}
            <button
              onClick={resetZoom}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Reset
            </button>

            {/* Close */}
            <button
              onClick={handleClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image Container - Takes remaining height */}
        <div className="flex-1 overflow-auto bg-black dark:bg-black flex items-center justify-center rounded-b-lg">
          <div 
            className="relative transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom})`,
            }}
          >
            <Image
              src={imageUrl}
              alt="Inspection photo"
              width={1920}
              height={1080}
              className="max-w-full max-h-full object-contain"
              style={{
                width: zoom > 1 ? 'auto' : '100%',
                height: zoom > 1 ? 'auto' : '100%',
              }}
              priority
              quality={95}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
