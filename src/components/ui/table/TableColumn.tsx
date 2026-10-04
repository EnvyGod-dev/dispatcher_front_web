import Image from 'next/image';
import { ColumnDef } from './builder';
import { TableBadge } from './TableBadge';

export class TableColumnBuilder<T> {
  private config: Partial<ColumnDef<T>>;

  constructor(key: string, header: string) {
    this.config = { key, header };
  }

  accessor(accessor: keyof T | ((item: T) => unknown)): this {
    this.config.accessor = accessor;
    return this;
  }

  render(renderFn: (item: T) => React.ReactNode): this {
    this.config.render = renderFn;
    return this;
  }

  className(className: string): this {
    this.config.className = className;
    return this;
  }

  headerClassName(className: string): this {
    this.config.headerClassName = className;
    return this;
  }

  sortable(isSortable = true): this {
    this.config.sortable = isSortable;
    return this;
  }

  rowSpan(rowSpanFn: (item: T) => number): this {
    this.config.rowSpan = rowSpanFn;
    return this;
  }

  build(): ColumnDef<T> {
    return this.config as ColumnDef<T>;
  }
}

export const TableColumn = {
  text<T>(
    key: string,
    header: string,
    accessor: keyof T,
    sortable?: boolean,
    sortKey?: string
  ) {
    return new TableColumnBuilder<T>(key, header)
      .accessor(accessor)
      .render((item) => (
        <span className="text-gray-800 text-theme-sm dark:text-white/90">
          {String(item[accessor] || '-')}
        </span>
      ));
  },

  custom<T>(
    key: string,
    header: string,
    render: (item: T) => React.ReactNode,
    sortable?: boolean,
    sortKey?: string
  ) {
    return new TableColumnBuilder<T>(key, header).render(render);
  },

  badge<T>(
    key: string,
    header: string,
    accessor: keyof T,
    colorMap?: Record<
      string,
      'success' | 'error' | 'warning' | 'info' | 'default'
    >
  ) {
    return new TableColumnBuilder<T>(key, header)
      .accessor(accessor)
      .render((item) => {
        const value = String(item[accessor] || '');
        const color = colorMap?.[value] || 'default';
        return <TableBadge color={color}>{value}</TableBadge>;
      });
  },

  avatar<T>(
    key: string,
    header: string,
    config: {
      name: keyof T;
      subtitle?: keyof T;
      image?: keyof T;
    }
  ) {
    return new TableColumnBuilder<T>(key, header).render((item) => (
      <div className="flex items-center gap-3">
        {config.image && item[config.image] && (
          <Image
            width={120}
            height={50}
            src={String(item[config.image])}
            alt={String(item[config.name])}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div>
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {String(item[config.name] || '-')}
          </span>
          {config.subtitle && (
            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
              {String(item[config.subtitle] || '')}
            </span>
          )}
        </div>
      </div>
    ));
  },
};
