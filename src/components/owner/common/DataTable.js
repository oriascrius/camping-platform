"use client";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useState } from 'react';
import { HiChevronLeft, HiChevronRight, HiSearch } from 'react-icons/hi';

export default function DataTable({ 
  data, 
  columns, 
  sorting, 
  setSorting,
  pageSize = 15,
  className = "",
  enableGlobalFilter = true,
  enableColumnFilters = true,
  enableSorting = true,
  enableSelection = false,
}) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting,
    enableColumnFilters,
    enableGlobalFilter,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className={`bg-white rounded-lg shadow flex flex-col h-[calc(100vh-12rem)] ${className}`}>
    
      {/* 表格容器 - 可滾動區域 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none border-b border-gray-200"
                    style={{ width: header.column.columnDef.size }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                      {header.column.getIsSorted() && (
                        <span>
                          {header.column.getIsSorted() === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap border-b border-gray-200"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 分頁控制 - 固定在底部 */}
      <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex-1 flex justify-between items-center">
          <span className="text-sm text-gray-700">
            第 {table.getState().pagination.pageIndex + 1} 頁，
            共 {table.getPageCount()} 頁
            （共 {table.getPreFilteredRowModel().rows.length} 筆資料）
          </span>
          <div className="flex items-center space-x-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              {[10, 15, 20, 30, 50].map(size => (
                <option key={size} value={size}>
                  顯示 {size} 筆
                </option>
              ))}
            </select>
            <div className="flex space-x-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                <HiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                <HiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 