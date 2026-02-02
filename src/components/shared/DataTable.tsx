import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Column<T> {
  header: string
  accessor: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[] | undefined
  isLoading: boolean
  keyExtractor: (row: T) => string
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  keyExtractor,
  emptyMessage = 'No data found',
}: DataTableProps<T>): React.ReactElement {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => `loading-row-${i}`).map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.header} className={col.className}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={keyExtractor(row)}>
            {columns.map((col) => (
              <TableCell key={col.header} className={col.className}>
                {col.accessor(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
