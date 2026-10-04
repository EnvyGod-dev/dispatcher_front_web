import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateFull } from '@/lib/time-formatter';
import { DailyPlan } from '@/services/internal/daily-plan/types';
import { MiningBlock } from '@/services/internal/mining-block/types';
import { Route } from '@/services/internal/routes/types';
import { Stockpile } from '@/services/internal/stockpile/types';
import { Vehicle } from '@/services/internal/vehicle/types';
import { hasRole, stockpileActionRoles } from '@/services/roles';
import { FileText, Forklift, Layers, MapPin, Pencil } from 'lucide-react';
import { WorkLog } from '../shift/types';
import StockpileLabel from '../stockpile/StockpileTag';
import { Card, CardContent } from '../ui/card';

type WorkLogWithDetails = WorkLog & {
  stockPile: Pick<Stockpile, 'id' | 'type' | 'layerNumber'>;
  vehicle: Pick<Vehicle, 'id' | 'code'>;
  dailyPlan: Pick<
    DailyPlan,
    'id' | 'pickUpBlockId' | 'vehicleId' | 'transportAmount' | 'date'
  >;
  miningBlock: Pick<MiningBlock, 'id' | 'name' | 'layerNumber'>;
  route: Pick<Route, 'id' | 'routeCode'>;
};
interface WorkLogsTableProps {
  workLogs: WorkLogWithDetails[];
  onEditWorkLog?: (workLog: WorkLogWithDetails) => void;
}

export default function WorkLogsTable({
  workLogs,
  onEditWorkLog,
}: WorkLogsTableProps) {
  const { user } = useAuth();
  const canEdit = hasRole(user?.role, stockpileActionRoles);
  if (!workLogs || workLogs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">
            Ажлын бүртгэл байхгүй байна.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: any; label: string; className?: string }
    > = {
      completed: {
        variant: 'default',
        label: 'Дууссан',
        className:
          'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
      },
      in_progress: {
        variant: 'secondary',
        label: 'Эхэлсэн',
        className:
          'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      },
      cancelled: {
        variant: 'destructive',
        label: 'Цуцлагдсан',
        className:
          'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
      },
    };

    const config = variants[status] || {
      variant: 'outline',
      label: status,
      className:
        'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
    };

    return (
      <Badge variant="outline" className={`font-normal ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent text-xs">
          <TableHead className="w-12 font-semibold text-xs">#</TableHead>
          <TableHead className="min-w-32">
            <div className="flex items-center gap-2">Хугацаа</div>
          </TableHead>
          <TableHead className="">
            <div className="flex items-center gap-2">
              <Forklift className="h-4 w-4" />
              Экскаватор
            </div>
          </TableHead>
          <TableHead className="">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Блок
            </div>
          </TableHead>
          <TableHead className="">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Овоолго
            </div>
          </TableHead>
          <TableHead className="">Тэмдэглэл</TableHead>
          <TableHead className="">Төлөв</TableHead>
          {canEdit && onEditWorkLog && (
            <TableHead className="">Үйлдэл</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody className="text-xs">
        {workLogs.map((log, index) => (
          <TableRow key={log.id}>
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell className="text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">
                    Эхэлсэн:
                  </span>
                  <span className="font-medium">
                    {formatDateFull(log.startTime)}
                  </span>
                </div>
                {log.endTime ? (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      Дууссан:
                    </span>
                    <span className="font-medium">
                      {formatDateFull(log.endTime)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-xs">
                      Дууссан:
                    </span>
                    <span className="text-muted-foreground text-xs">-</span>
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="text-xs line-clamp-2">{log.vehicle?.code}</span>
            </TableCell>
            <TableCell>
              <span className="text-xs line-clamp-2">
                {log.miningBlock.name}
              </span>
            </TableCell>
            <TableCell>
              {log?.stockPile ? (
                <StockpileLabel
                  type={log?.stockPile?.type ?? ''}
                  layerNumber={log?.stockPile?.layerNumber ?? ''}
                  className="text-xs"
                />
              ) : (
                <span className="text-muted-foreground text-xs">-</span>
              )}
            </TableCell>
            <TableCell className="max-w-xs">
              {log.notes ? (
                <span className="text-xs line-clamp-2">{log.notes}</span>
              ) : (
                <span className="text-muted-foreground text-xs">-</span>
              )}
            </TableCell>
            <TableCell>{getStatusBadge(log.status)}</TableCell>
            {canEdit && onEditWorkLog && (
              <TableCell>
                <button
                  onClick={() => onEditWorkLog(log)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                  title="Засах"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
