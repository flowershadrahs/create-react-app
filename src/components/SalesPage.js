// SalesPage.jsx
import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  Plus,
  User,
  Package,
  Truck,
} from "lucide-react";
import AutocompleteInput from "./AutocompleteInput";
import SalesForm from "./sales/SalesForm";
import SuppliesForm from "./SuppliesForm";
import DateFilter from "./DateFilter";
import ClientForm from "./ClientForm";
import ProductForm from "./ProductForm";
import SalesTable from "./SalesTable";
import { startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";

const SalesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    type: 'today',
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [newProduct, setNewProduct] = useState({ name: "", price: "" });
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [newSupply, setNewSupply] = useState({
    productId: "",
    supplyType: "",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [user, setUser] = useState(null);

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

      const clientsQuery = query(collection(db, `users/${user.uid}/clients`));
      const unsubscribeClients = onSnapshot(
        clientsQuery,
        (snapshot) => {
          const clientsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setClients(clientsData);
        },
        (err) => {
          console.error("Error fetching clients:", err);
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

      const suppliesQuery = query(collection(db, `users/${user.uid}/supplies`));
      const unsubscribeSupplies = onSnapshot(
        suppliesQuery,
        (snapshot) => {
          const suppliesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSupplies(suppliesData);
        },
        (err) => {
          console.error("Error fetching supplies:", err);
        }
      );

      return () => {
        unsubscribeSales();
        unsubscribeClients();
        unsubscribeProducts();
        unsubscribeSupplies();
      };
    }
  }, [user]);

  const getFilteredSupplies = () => {
    let filtered = supplies;
    if (dateFilter.type !== 'all') {
      const start = new Date(dateFilter.startDate);
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = supplies.filter(supply => {
        const supplyDate = new Date(supply.date);
        return supplyDate >= start && supplyDate <= end;
      });
    }
    return filtered;
  };

  const getFilteredSales = () => {
    if (dateFilter.type === 'all') return sales;

    const startDate = startOfDay(parseISO(dateFilter.startDate));
    const endDate = endOfDay(parseISO(dateFilter.endDate));

    return sales.filter(sale => {
      if (!sale.date) return false;
      const saleDate = sale.date.toDate ? sale.date.toDate() : new Date(sale.date);
      return isWithinInterval(saleDate, { start: startDate, end: endDate });
    });
  };

  const getSupplySummary = () => {
    const filteredSales = getFilteredSales();
    const filteredSupplies = getFilteredSupplies();

    const strawsProduct = products.find(p => p.name.toLowerCase() === "straws");
    const toiletPaperProduct = products.find(p => p.name.toLowerCase() === "toilet papers");

    const supplyTypes = [
      { type: "kaveera", productId: strawsProduct?.id, product: strawsProduct?.name || "Straws" },
      { type: "box", productId: strawsProduct?.id, product: strawsProduct?.name || "Straws" },
      { type: "60s", productId: toiletPaperProduct?.id, product: toiletPaperProduct?.name || "Toilet Papers" },
      { type: "20p", productId: toiletPaperProduct?.id, product: toiletPaperProduct?.name || "Toilet Papers" },
      { type: "90w", productId: toiletPaperProduct?.id, product: toiletPaperProduct?.name || "Toilet Papers" },
    ];

    return supplyTypes.map(({ type, productId, product }) => {
      const totalSupplied = filteredSupplies
        .filter(s => s.supplyType.toLowerCase() === type.toLowerCase() && s.productId === productId)
        .reduce((sum, supply) => sum + parseInt(supply.quantity || 0), 0);

      const totalSold = filteredSales
        .filter(s => s.product.supplyType.toLowerCase() === type.toLowerCase() && s.product.productId === productId)
        .reduce((sum, sale) => sum + parseInt(sale.product.quantity || 0), 0);

      return {
        supplyType: type,
        product,
        totalSupplied,
        totalSold,
        balance: totalSupplied - totalSold,
      };
    }).filter(summary => summary.totalSupplied > 0 || summary.totalSold > 0);
  };

  const getSalesSummary = () => {
    const filteredSales = getFilteredSales();
    const strawsProduct = products.find(p => p.name.toLowerCase() === "straws");
    const toiletPaperProduct = products.find(p => p.name.toLowerCase() === "toilet papers");

    const strawsSales = filteredSales.filter(s => s.product.productId === strawsProduct?.id);
    const toiletPaperSales = filteredSales.filter(s => s.product.productId === toiletPaperProduct?.id);

    const calculateTotals = (sales) => ({
      totalQuantity: sales.reduce((sum, sale) => sum + parseInt(sale.product.quantity || 0), 0),
      totalAmount: sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount || 0), 0),
      totalDebt: sales.reduce((sum, sale) => sum + (parseFloat(sale.totalAmount || 0) - parseFloat(sale.amountPaid || 0)), 0),
    });

    return {
      straws: calculateTotals(strawsSales),
      toiletPaper: calculateTotals(toiletPaperSales),
    };
  };

  return (
    <div className="space-y-8 max-w-[100vw] overflow-x-auto bg-white">
      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight">
              Sales Dashboard
            </h1>
            <p className="text-slate-600 text-lg max-w-2xl leading-relaxed mt-2">
              Monitor your sales performance, manage transactions, and track your business growth with our comprehensive analytics platform.
            </p>
          </div>

          <DateFilter
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            showDateFilter={showDateFilter}
            setShowDateFilter={setShowDateFilter}
          />
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <button
          onClick={() => setShowClientForm(true)}
          className="w-16 h-16 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
        >
          <User className="w-8 h-8 text-white" />
        </button>
        
        <button
          onClick={() => setShowProductForm(true)}
          className="w-16 h-16 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
        >
          <Package className="w-8 h-8 text-white" />
        </button>
        
        <button
          onClick={() => setShowSupplyForm(true)}
          className="w-16 h-16 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
        >
          <Truck className="w-8 h-8 text-white" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Sales Transactions - Straws</h2>
              <p className="text-slate-600">Complete record of all straws sales activities</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Data
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <SalesTable
            sales={sales.filter(s => products.find(p => p.id === s.product.productId)?.name.toLowerCase() === "straws")}
            products={products}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            dateFilter={dateFilter}
            setEditingSale={setEditingSale}
            setShowForm={setShowForm}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Sales Transactions - Toilet Papers</h2>
              <p className="text-slate-600">Complete record of all toilet paper sales activities</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Data
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <SalesTable
            sales={sales.filter(s => products.find(p => p.id === s.product.productId)?.name.toLowerCase() === "toilet papers")}
            products={products}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            dateFilter={dateFilter}
            setEditingSale={setEditingSale}
            setShowForm={setShowForm}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Sales Summary</h2>
          <p className="text-slate-600">Summary of total sales, amount paid, and debts for today</p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Product</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Total Quantity</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Total Amount (UGX)</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Total Debt (UGX)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100">
                  <td className="px-4 py-3 text-sm text-slate-600">Straws</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getSalesSummary().straws.totalQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getSalesSummary().straws.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getSalesSummary().straws.totalDebt.toLocaleString()}</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <td className="px-4 py-3 text-sm text-slate-600">Toilet Papers</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getSalesSummary().toiletPaper.totalQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getSalesSummary().toiletPaper.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getSalesSummary().toiletPaper.totalDebt.toLocaleString()}</td>
                </tr>
                <tr className="border-t border-slate-100 font-bold">
                  <td className="px-4 py-3 text-sm text-slate-800">Total</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{(getSalesSummary().straws.totalQuantity + getSalesSummary().toiletPaper.totalQuantity).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{(getSalesSummary().straws.totalAmount + getSalesSummary().toiletPaper.totalAmount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{(getSalesSummary().straws.totalDebt + getSalesSummary().toiletPaper.totalDebt).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Supplies Summary</h2>
          <p className="text-slate-600">Summary of supplies taken, sold, and balance for the selected period</p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Supply Type</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Product</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Quantity Taken</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Quantity Sold</th>
                  <th className="px-4 py-3 text-sm font-semibold text-slate-700">Balance</th>
                </tr>
              </thead>
              <tbody>
                {getSupplySummary().map((summary, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm text-slate-600">{summary.supplyType}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{summary.product}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{summary.totalSupplied.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{summary.totalSold.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{summary.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {!showForm && (
        <button
          onClick={() => {
            setEditingSale(null);
            setShowForm(true);
          }}
          className="fixed bottom-20 sm:bottom-24 right-6 bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 transition-all duration-200 hover:scale-110 z-[100]"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-x-auto">
          <div className="w-full max-w-lg">
            <SalesForm
              sale={editingSale}
              clients={clients}
              products={products}
              supplies={supplies}
              onClose={() => {
                setShowForm(false);
                setEditingSale(null);
              }}
            />
          </div>
        </div>
      )}

      {showClientForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-x-auto">
          <div className="w-full max-w-lg">
            <ClientForm
              newClient={newClient}
              setNewClient={setNewClient}
              setShowClientForm={setShowClientForm}
            />
          </div>
        </div>
      )}

      {showProductForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-x-auto">
          <div className="w-full max-w-lg">
            <ProductForm
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              setShowProductForm={setShowProductForm}
            />
          </div>
        </div>
      )}

      {showSupplyForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-x-auto">
          <div className="w-full max-w-lg">
            <SuppliesForm
              newSupply={newSupply}
              setNewSupply={setNewSupply}
              setShowSupplyForm={setShowSupplyForm}
              products={products}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;