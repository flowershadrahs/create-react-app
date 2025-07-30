import React, { useState, useEffect, useMemo, useContext } from 'react';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Trash2, Edit, Search, X, Tag, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { useReactTable, getCoreRowModel, flexRender, getSortedRowModel, getPaginationRowModel } from '@tanstack/react-table';
import AutocompleteInput from './AutocompleteInput';
import ExpenseForm from './ExpenseForm';
import ExpensesDateFilter from './ExpensesDateFilter';
import ExpensesReport from './ExpensesReport';
import { format } from 'date-fns';
import { DataContext } from '../DataContext';

const ExpensesPage = () => {
  const { user, expenses, categories, loading, error } = useContext(DataContext);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filter, setFilter] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);
  const [dateFilter, setDateFilter] = useState({
    type: 'all',
    startDate: '',
    endDate: ''
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  useEffect(() => {
    if (!expenses || !Array.isArray(expenses)) {
      setFilteredExpenses([]);
      return;
    }

    const filtered = expenses.filter(expense => {
      if (!expense) return false;

      const categoryMatch = expense.category?.toLowerCase().includes(filter.toLowerCase()) || false;
      const payeeMatch = expense.payee?.toLowerCase().includes(filter.toLowerCase()) || false;
      const descriptionMatch = expense.description?.toLowerCase().includes(filter.toLowerCase()) || false;

      let dateMatch = true;
      if (dateFilter.startDate && dateFilter.endDate && expense.createdAt) {
        const expenseDate = expense.createdAt.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
        const startDate = new Date(dateFilter.startDate + 'T00:00:00');
        const endDate = new Date(dateFilter.endDate + 'T23:59:59');
        dateMatch = expenseDate >= startDate && expenseDate <= endDate;
      }

      return (categoryMatch || payeeMatch || descriptionMatch || filter === '') && dateMatch;
    });
    
    setFilteredExpenses(filtered);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [filter, expenses, dateFilter]);

  const columns = [
    {
      header: 'Category',
      accessorKey: 'category',
      cell: info => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {info.getValue() || 'Uncategorized'}
        </span>
      ),
    },
    {
      header: 'Amount (UGX)',
      accessorKey: 'amount',
      cell: info => {
        const amount = info.getValue();
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return (
          <span className="font-semibold text-green-700">
            {numAmount.toLocaleString()}
          </span>
        );
      },
      sortingFn: (rowA, rowB) => {
        const a = typeof rowA.original.amount === 'number' ? rowA.original.amount : parseFloat(rowA.original.amount) || 0;
        const b = typeof rowB.original.amount === 'number' ? rowB.original.amount : parseFloat(rowB.original.amount) || 0;
        return a - b;
      }
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: info => (
        <span className="text-gray-900 font-medium">
          {info.getValue() || '-'}
        </span>
      ),
    },
    {
      header: 'Payee',
      accessorKey: 'payee',
      cell: info => (
        <span className="text-gray-600">
          {info.getValue() || '-'}
        </span>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: info => {
        const date = info.getValue();
        if (!date) return '-';
        
        try {
          const dateObj = date.toDate ? date.toDate() : new Date(date);
          return (
            <span className="text-gray-500 text-sm">
              {format(dateObj, 'MMM dd, yyyy')}
            </span>
          );
        } catch (err) {
          console.error('Date formatting error:', err);
          return '-';
        }
      },
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.createdAt?.toDate ? rowA.original.createdAt.toDate() : new Date(rowA.original.createdAt);
        const dateB = rowB.original.createdAt?.toDate ? rowB.original.createdAt.toDate() : new Date(rowB.original.createdAt);
        return dateA.getTime() - dateB.getTime();
      }
    },
    {
      header: 'Actions',
      cell: info => (
        <div className="flex gap-1">
          <button
            onClick={() => {
              setEditingExpense(info.row.original);
              setShowForm(true);
            }}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteExpense(info.row.original.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    columns,
    data: filteredExpenses,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { 
      sorting,
      pagination 
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await deleteDoc(doc(db, `users/${user?.uid}/expenses`, id));
    } catch (err) {
      console.error('Error deleting expense:', err);
      setCategoryError('Failed to delete expense');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await updateDoc(doc(db, `users/${user?.uid}/categories`, editingCategory.id), {
          name: categoryName.trim(),
          updatedAt: new Date(),
        });
      } else {
        await addDoc(collection(db, `users/${user?.uid}/categories`), {
          name: categoryName.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      setCategoryName('');
      setCategoryError('');
      setShowCategoryModal(false);
      setEditingCategory(null);
    } catch (err) {
      console.error('Error saving category:', err);
      setCategoryError('Failed to save category. Please try again.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await deleteDoc(doc(db, `users/${user?.uid}/categories`, id));
    } catch (err) {
      console.error('Error deleting category:', err);
      setCategoryError('Failed to delete category');
    }
  };

  // Function to trigger PDF generation directly
  const generateExpensesReport = () => {
    const tempContainer = document.createElement('div');
    document.body.appendChild(tempContainer);
    
    import('react-dom').then(ReactDOM => {
      ReactDOM.render(
        <DataContext.Provider value={{ user, expenses, categories, loading, error }}>
          <ExpensesReport dateFilter={dateFilter} ref={reportComponent => {
            if (reportComponent) {
              reportComponent.generateExpensesReport();
            }
          }} />
        </DataContext.Provider>,
        tempContainer,
        () => {
          ReactDOM.unmountComponentAtNode(tempContainer);
          document.body.removeChild(tempContainer);
        }
      );
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-4 w-full bg-white p-1">
      <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Expense Tracker
            </h1>
            <p className="text-slate-600 text-sm">
              Manage and analyze your spending.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-sm font-medium text-slate-800 transition-all"
            >
              <Tag className="w-4 h-4 inline-block mr-1" />
              Categories
            </button>
            <button
              onClick={generateExpensesReport}
              disabled={filteredExpenses.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium text-sm">Generate Report</span>
            </button>
          </div>
        </div>
        <div className="mt-2">
          <ExpensesDateFilter
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            showDateFilter={showDateFilter}
            setShowDateFilter={setShowDateFilter}
          />
        </div>
      </div>

      {(error || categoryError) && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-2 py-2 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4" />
          {error || categoryError}
        </div>
      )}

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search expenses..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 text-sm"
        />
        {filter && (
          <X
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            onClick={() => setFilter('')}
          />
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
        <div className="p-2 border-b border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
            <p className="text-sm text-gray-500">
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            <ChevronUp 
                              className={`w-3 h-3 ${header.column.getIsSorted() === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} 
                            />
                            <ChevronDown 
                              className={`w-3 h-3 -mt-1 ${header.column.getIsSorted() === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} 
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
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter || dateFilter.type !== 'all' ? 'No matching expenses found' : 'No expenses recorded yet'}
            </h3>
            <p className="text-gray-500 text-sm">
              {filter || dateFilter.type !== 'all' ? 'Try adjusting your search terms or date filter' : 'Add your first expense to get started'}
            </p>
          </div>
        )}

        {filteredExpenses.length > 0 && (
          <div className="p-2 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => {
                    table.setPageSize(Number(e.target.value))
                  }}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
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
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setEditingExpense(null);
          setShowForm(true);
        }}
        className="fixed bottom-16 sm:bottom-20 right-2 bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition-all duration-200 hover:scale-110 z-[100]"
      >
        <Plus className="w-5 h-5" />
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-2 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <ExpenseForm
              expense={editingExpense}
              onClose={() => {
                setShowForm(false);
                setEditingExpense(null);
              }}
            />
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-2 overflow-y-auto">
          <div className="w-full max-w-lg my-8 bg-white rounded-lg shadow-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Categories</h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setCategoryName('');
                  setCategoryError('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
              {categoryError && (
                <p className="mt-2 text-sm text-red-600">{categoryError}</p>
              )}
            </form>

            <div className="space-y-2 max-h-60 overflow-auto">
              {categories.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Tag className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No categories yet</p>
                </div>
              ) : (
                categories.map(category => (
                  <div
                    key={category.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryName(category.name);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;