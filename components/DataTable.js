'use client'

import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

export default function DataTable({
  columns,
  data,
  rowKey,
  emptyText = 'No data found.',
  tableClassName = 'w-full text-left border-collapse',
  mobileCardRender,
  bodyScrollable = false,
  bodyMaxHeightClass = 'max-h-[65vh]',
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50],
}) {
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  const tableColumns = useMemo(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row) => row[column.key],
        header: column.header,
        enableSorting: Boolean(column.sortable),
        meta: {
          className: column.className || '',
          headerClassName: column.headerClassName || '',
        },
        cell: (ctx) =>
          column.render
            ? column.render(ctx.row.original, ctx.row.index)
            : ctx.getValue(),
      })),
    [columns]
  )

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId: (row, index) => String(rowKey(row, index)),
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const rows = table.getRowModel().rows
  const totalRows = data.length
  const pageCount = table.getPageCount()
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const canPrev = table.getCanPreviousPage()
  const canNext = table.getCanNextPage()
  const showingFrom = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const showingTo = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className="bg-background rounded-2xl border overflow-hidden shadow-sm">
      {mobileCardRender ? (
        <div className="md:hidden p-3 space-y-3">
          {rows.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">{emptyText}</div>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-xl border bg-card p-3">
                {mobileCardRender(row.original, row.index)}
              </div>
            ))
          )}
        </div>
      ) : null}

      <div className={`${mobileCardRender ? 'hidden md:block' : ''} overflow-x-auto overscroll-x-contain`}>
        <div className={bodyScrollable ? `${bodyMaxHeightClass} overflow-y-auto` : ''}>
          <table className={`${tableClassName} min-w-[1200px] w-max`}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-secondary text-muted-foreground text-sm uppercase tracking-wider">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`p-4 font-semibold ${bodyScrollable ? 'sticky top-0 z-10 bg-secondary' : ''} ${header.column.columnDef.meta?.headerClassName || ''}`}
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={header.column.getCanSort() ? 'inline-flex items-center gap-1 hover:text-foreground' : 'inline-flex'}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() ? (
                          <span className="text-[10px]">
                            {header.column.getIsSorted() === 'asc' ? '▲' : header.column.getIsSorted() === 'desc' ? '▼' : ''}
                          </span>
                        ) : null}
                      </button>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length} className="p-8 text-center text-muted-foreground">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-secondary/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={`p-4 ${cell.column.columnDef.meta?.className || ''}`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-border/70 px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm">
        <div className="text-muted-foreground">
          Showing {showingFrom}-{showingTo} of {totalRows}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground">Rows</label>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value) || 10)}
            className="p-1.5 border rounded-lg bg-secondary/50"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!canPrev}
            className="px-3 py-1.5 rounded-lg border bg-secondary/40 hover:bg-secondary disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-muted-foreground">Page {pageIndex + 1} / {pageCount}</span>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!canNext}
            className="px-3 py-1.5 rounded-lg border bg-secondary/40 hover:bg-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
