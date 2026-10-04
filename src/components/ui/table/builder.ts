export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  accessor?: keyof T | ((item: T) => unknown);
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortKey?: string;
  rowSpan?: (item: T) => number;
}
