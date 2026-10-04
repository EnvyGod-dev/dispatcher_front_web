'use client';

import { useState } from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';

interface EndShiftModalProps {
  isOpen: boolean;
  onSave: (mileageEnd: string, motoEnd: string) => void;
  onClose: () => void;
  isEnding?: boolean;
}

export default function EndShiftModal({
  isOpen,
  onSave,
  onClose,
  isEnding = false,
}: EndShiftModalProps) {
  const [mileageEnd, setMileageEnd] = useState('');
  const [motoEnd, setMotoEnd] = useState('');

  const handleSave = () => {
    if (!mileageEnd || !motoEnd) {
      return;
    }
    onSave(mileageEnd, motoEnd);
  };

  const handleClose = () => {
    setMileageEnd('');
    setMotoEnd('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-lg p-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
        Ээлж дуусгах
      </h3>

      <div className="space-y-4">
        <div>
          <Label>Дуусах км-ын заалт *</Label>
          <Input
            type="number"
            onChange={(e) => setMileageEnd(e.target.value)}
            placeholder="Дуусах км-ын заалт оруулах..."
            className="mt-2"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Ээлж дуусах үеийн км-ын заалтыг оруулна уу
          </p>
        </div>

        <div>
          <Label>Дуусах мото цагийн заалт *</Label>
          <Input
            type="number"
            onChange={(e) => setMotoEnd(e.target.value)}
            placeholder="Дуусах мото цагийн заалт оруулах..."
            className="mt-2"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Ээлж дуусах үеийн мото цагийн заалтыг оруулна уу
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isEnding}
          >
            Буцах
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex-1"
            disabled={!mileageEnd || !motoEnd || isEnding}
          >
            {isEnding ? 'Дуусгаж байна...' : 'Ээлж дуусгах'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}