import React from "react";
import { format } from "date-fns";
import { Link, Trash2, Edit } from "lucide-react";
import Skeleton from 'react-loading-skeleton';
import { flexRender, useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

const DebtTable = ({
  debts,
  sales,
  setEditingDebt,
  setShowForm,
  setEditingSale,
  setShowSalesForm,
  handleDeleteDebt,
  loading,
  total,
  showTotalAtTop
}) => {
  const [sorting, setSorting] = React.useState([{ id: "client", desc: false }]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const getSortValue = (row, columnId) => {
    const value = row.getValue(columnId);
    switch (columnId) {
      case 'client':
        return (value || '').toLowerCase();
      case 'amount':
        return parseFloat(value) || 0;
      case 'status':
        return parseFloat(row.original.amount) === 0 ? 0 : 1;
      case 'updatedAt':
        return value ? value.toDate().getTime() : 0;
      default:
        return value;
    }
  };

  const columns = [
    {
      header: "Debtor",
      accessorKey: "client",
      cell: (info) => info.getValue() || "-",
      sortingFn: (rowA, rowB, columnId) => {
        const a = getSortValue(rowA, columnId);
        const b = getSortValue(rowB, columnId);
        return a.localeCompare(b);
      },
    },
    {
      header: "Debts (UGX)",
      accessorKey: "amount",
      cell: (info) => {
        const value = parseFloat(info.getValue()) || 0;
        return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      },
      sortingFn: (rowA, rowB, columnId) => {
        const a = getSortValue(rowA, columnId);
        const b = getSortValue(rowB, columnId);
        return a - b;
      },
    },
    {
      header: "Status",
      accessorKey: "amount",
      id: "status",
      cell: (info) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            parseFloat(info.getValue()) === 0
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-amber-100 text-amber-700 border border-amber-200'
          }`}
        >
          {parseFloat(info.getValue()) === 0 ? 'Paid' : 'Pending'}
        </span>
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const a = getSortValue(rowA, columnId);
        const b = getSortValue(rowB, columnId);
        return a - b;
      },
    },
    {
      header: "Updated",
      accessorKey: "updatedAt",
      cell: (info) => (info.getValue() ? format(info.getValue().toDate ? info.getValue().toDate() : new Date(info.getValue()), 'MMM dd, yyyy') : '-'),
      sortingFn: (rowA, rowB, columnId) => {
        const a = getSortValue(rowA, columnId);
        const b = getSortValue(rowB, columnId);
        return a - b;
      },
    },
    {
      header: "Linked Sale",
      accessorKey: "saleId",
      enableSorting: false,
      cell: (info) =>
        info.getValue() ? (
          <button
            onClick={() => {
              const sale = sales.find((s) => s.id === info.getValue());
              setEditingSale(sale);
              setShowSalesForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm"
          >
            <Link className="w-3.5 h-3.5" />
            View Sale
          </button>
        ) : (
          <span className="text-neutral-400 text-sm">-</span>
        ),
    },
    {
      header: "Actions",
      enableSorting: false,
      cell: (info) => (
        <div className="flex items-center gap-2">
          {parseFloat(info.row.original.amount) !== 0 && (
            <>
              <button
                onClick={() => {
                  setEditingDebt(info.row.original);
                  setShowForm(true);
                }}
                className="inline-flex items-center justify-center w-8 h-8 text-neutral-600 bg-neutral-100 hover:bg-blue-100 hover:text-blue-700 border border-neutral-200 hover:border-blue-300 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm"
                title="Edit debt"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteDebt(info.row.original.id)}
                className="inline-flex items-center justify-center w-8 h-8 text-neutral-600 bg-neutral-100 hover:bg-red-100 hover:text-red-700 border border-neutral-200 hover:border-red-300 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm"
                title="Delete debt"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    columns,
    data: debts || [],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    manualPagination: false,
  });

  const renderSortIcon = (header) => {
    if (!header.column.getCanSort()) return null;

    const sortDirection = header.column.getIsSorted();

    return (
      <span className="ml-2 flex-shrink-0">
        {sortDirection === 'asc' && <ChevronUp className="w-4 h-4" />}
        {sortDirection === 'desc' && <ChevronDown className="w-4 h-4" />}
        {!sortDirection && <ChevronsUpDown className="w-4 h-4 text-neutral-400" />}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
      {showTotalAtTop && (
        <div className="p-4 bg-neutral-50 border-b border-neutral-100">
          <div className="text-right font-bold text-neutral-800">
            Total: {parseFloat(total).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} UGX
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6">
            <Skeleton height={40} className="mb-4" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={60} className="mb-2" />
            ))}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider ${
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none hover:bg-neutral-100 transition-colors'
                            : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {renderSortIcon(header)}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100">
                {table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-neutral-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-neutral-25'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {!showTotalAtTop && (
                <tfoot>
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-right font-bold">
                      Total: {parseFloat(total).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} UGX
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
            <div className="p-6 border-t border-neutral-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Rows per page:</span>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => {
                      table.setPageSize(Number(e.target.value));
                    }}
                    className="border border-neutral-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[10, 20, 50, 100].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-neutral-600">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-3 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-3 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {!loading && debts.length === 0 && (
        <div className="text-center py-12 text-neutral-500 bg-neutral-25">
          <div className="text-lg font-medium mb-2">No debts recorded yet</div>
          <div className="text-sm">Add a debt to get started</div>
        </div>
      )}
    </div>
  );
};

export default DebtTable;