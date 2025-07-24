import React, { useState, useEffect, useMemo } from "react";
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel,
  getPaginationRowModel,
  flexRender 
} from "@tanstack/react-table";
import { format, startOfDay, endOfDay, isWithinInterval, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Edit, Trash2, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { collection, deleteDoc, doc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";

const SalesTable = ({ globalFilter, setGlobalFilter, dateFilter, setEditingSale, setShowForm }) => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [sorting, setSorting] = useState([{ id: 'date', desc: true }]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const salesQuery = query(collection(db, `users/${user.uid}/sales`));
      const unsubscribeSales = onSnapshot(
        salesQuery,
        (snapshot) => {
          const salesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSales(salesData);
        },
        (err) => {
          console.error("Error fetching sales:", err);
        }
      );

      const productsQuery = query(collection(db, `users/${user.uid}/products`));
      const unsubscribeProducts = onSnapshot(
        productsQuery,
        (snapshot) => {
          const productsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setProducts(productsData);
        },
        (err) => {
          console.error("Error fetching products:", err);
        }
      );

      return () => {
        unsubscribeSales();
        unsubscribeProducts();
      };
    }
  }, [user]);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    
    if (dateFilter.type === 'all') return sales;
    
    const now = new Date();
    let startDate, endDate;
    
    switch (dateFilter.type) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'custom':
        if (!dateFilter.startDate || !dateFilter.endDate) return sales;
        startDate = startOfDay(parseISO(dateFilter.startDate));
        endDate = endOfDay(parseISO(dateFilter.endDate));
        break;
      default:
        return sales;
    }
    
    return sales.filter(sale => {
      if (!sale.date) return false;
      const saleDate = sale.date.toDate();
      return isWithinInterval(saleDate, { start: startDate, end: endDate });
    });
  }, [sales, dateFilter]);

  const totals = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      const totalAmount = typeof sale.totalAmount === 'number' ? sale.totalAmount : parseFloat(sale.totalAmount) || 0;
      const amountPaid = typeof sale.amountPaid === 'number' ? sale.amountPaid : parseFloat(sale.amountPaid) || 0;
      const quantity = sale.product?.quantity || 0;
      const discount = sale.product?.discount || 0;
      
      return {
        totalSales: acc.totalSales + totalAmount,
        totalPaid: acc.totalPaid + amountPaid,
        totalQuantity: acc.totalQuantity + quantity,
        totalDiscount: acc.totalDiscount + discount,
        outstandingBalance: acc.outstandingBalance + (totalAmount - amountPaid)
      };
    }, {
      totalSales: 0,
      totalPaid: 0,
      totalQuantity: 0,
      totalDiscount: 0,
      outstandingBalance: 0
    });
  }, [filteredSales]);

  const columns = useMemo(
    () => [
      {
        header: "Client",
        accessorKey: "client",
        cell: info => (
          <div className="font-medium text-gray-900">
            {info.getValue() || "-"}
          </div>
        ),
      },
      {
        header: "Product",
        accessorKey: "product",
        cell: info => (
          <div className="text-gray-800">
            {products.find(prod => prod.id === info.getValue()?.productId)?.name || "-"}
          </div>
        ),
      },
      {
        header: "Quantity",
        accessorKey: "product",
        cell: info => (
          <div className="text-center font-medium">
            {info.getValue()?.quantity || 0}
          </div>
        ),
      },
      {
        header: "Unit Price",
        accessorKey: "product",
        cell: info => (
          <div className="font-mono text-sm">
            UGX {(info.getValue()?.unitPrice || 0).toLocaleString()}
          </div>
        ),
      },
      {
        header: "Discount",
        accessorKey: "product",
        cell: info => (
          <div className="font-mono text-sm text-orange-600">
            {info.getValue()?.discount > 0 ? `-UGX ${info.getValue().discount.toLocaleString()}` : "-"}
          </div>
        ),
      },
      {
        header: "Total",
        accessorKey: "totalAmount",
        cell: info => (
          <span className="font-semibold text-green-700">
            UGX {(info.getValue() || 0).toLocaleString()}
          </span>
        ),
      },
      {
        header: "Payment Status",
        accessorKey: "paymentStatus",
        cell: info => (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            info.getValue() === 'paid' ? 'bg-green-100 text-green-800' :
            info.getValue() === 'partial' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {(info.getValue() || 'unpaid').charAt(0).toUpperCase() + (info.getValue() || 'unpaid').slice(1)}
          </span>
        ),
      },
      {
        header: "Amount Paid",
        accessorKey: "amountPaid",
        cell: info => (
          <div className="font-mono text-sm">
            UGX {(info.getValue() || 0).toLocaleString()}
          </div>
        ),
      },
      {
        header: "Date",
        accessorKey: "date",
        cell: info => (
          <span className="text-gray-500 text-sm">
            {info.getValue() ? format(info.getValue().toDate(), 'MMM dd, yyyy') : '-'}
          </span>
        ),
        sortingFn: (rowA, rowB) => {
          const dateA = rowA.original.date?.toDate ? rowA.original.date.toDate() : new Date(rowA.original.date);
          const dateB = rowB.original.date?.toDate ? rowB.original.date.toDate() : new Date(rowB.original.date);
          return dateA.getTime() - dateB.getTime();
        }
      },
      {
        header: "Actions",
        cell: info => (
          <div className="flex gap-1">
            <button
              onClick={() => {
                setEditingSale(info.row.original);
                setShowForm(true);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="Edit sale"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteSale(info.row.original.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Delete sale"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [products, setEditingSale, setShowForm]
  );

  const table = useReactTable({
    data: filteredSales || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const client = row.getValue('client')?.toLowerCase() || '';
      const product = products.find(prod => prod.id === row.getValue('product')?.productId)?.name.toLowerCase() || '';
      const paymentStatus = row.getValue('paymentStatus')?.toLowerCase() || '';
      const searchTerm = filterValue.toLowerCase();
      return client.includes(searchTerm) || product.includes(searchTerm) || paymentStatus.includes(searchTerm);
    },
    state: {
      globalFilter,
      sorting,
      pagination
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  const handleDeleteSale = async (id) => {
    if (window.confirm("Are you sure you want to delete this sale? This action cannot be undone.") && user) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/sales`, id));
        const debtsQuery = query(
          collection(db, `users/${user.uid}/debts`),
          where("saleId", "==", id)
        );
        const querySnapshot = await getDocs(debtsQuery);
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      } catch (err) {
        console.error("Error deleting sale:", err);
        alert("Failed to delete sale. Please try again.");
      }
    }
  };

  const getDateFilterLabel = () => {
    switch (dateFilter.type) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'custom':
        return dateFilter.startDate && dateFilter.endDate 
          ? `${format(parseISO(dateFilter.startDate), 'MMM dd')} - ${format(parseISO(dateFilter.endDate), 'MMM dd')}`
          : 'Custom Range';
      default:
        return 'All Time';
    }
  };

  return (
    <div className="space-y-6 w-full max-w-none">
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by client, product, or status..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
        />
        {globalFilter && (
          <X
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            onClick={() => setGlobalFilter("")}
          />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm w-full">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Sales Records ({filteredSales.length})
              </h2>
              {dateFilter.type !== 'all' && (
                <p className="text-gray-500 text-sm mt-1">
                  {getDateFilterLabel()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            <ChevronUp 
                              className={`w-3 h-3 ${
                                header.column.getIsSorted() === 'asc' ? 'text-blue-600' : 'text-gray-400'
                              }`} 
                            />
                            <ChevronDown 
                              className={`w-3 h-3 -mt-1 ${
                                header.column.getIsSorted() === 'desc' ? 'text-blue-600' : 'text-gray-400'
                              }`} 
                            />
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              
              {/* Totals Row */}
              {filteredSales.length > 0 && (
                <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    TOTALS
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center text-gray-900">
                    {totals.totalQuantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-700">
                    -UGX {totals.totalDiscount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                    UGX {totals.totalSales.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                    UGX {totals.totalPaid.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    -
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {globalFilter ? "No matching sales found" : "No sales recorded yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {globalFilter ? "Try adjusting your search terms" : "Add your first sale to get started"}
            </p>
            {!globalFilter && (
              <button
                onClick={() => {
                  setEditingSale(null);
                  setShowForm(true);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first sale
              </button>
            )}
          </div>
        )}

        {filteredSales.length > 0 && (
          <div className="p-6 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => {
                    table.setPageSize(Number(e.target.value))
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                >
                  {[25, 50, 100].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesTable;