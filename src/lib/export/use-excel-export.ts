'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

/** Excel татах үйлдлийг (ачаалж буй төлөв, алдааны мессеж) нэгтгэнэ. */
export function useExcelExport(run: () => Promise<number>) {
  const [isExporting, setIsExporting] = useState(false);

  const exportNow = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const count = await run();
      if (count === 0) toast.error('Татах мэдээлэл алга');
    } catch (error) {
      toast.error((error as Error)?.message || 'Excel татахад алдаа гарлаа');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, run]);

  return { isExporting, exportNow };
}
