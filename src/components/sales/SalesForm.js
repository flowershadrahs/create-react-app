// src/components/SalesForm.jsx
import React, { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { X, Package, User, Calculator, CheckCircle2 } from "lucide-react";
import AutocompleteInput from "../AutocompleteInput";

const SalesForm = ({ sale, onClose, clients, products, supplies }) => {
  const [formData, setFormData] = useState({
    client: sale?.client || "",
    productId: sale?.product?.productId || products.find(p => p.name.toLowerCase() === "straws")?.id || "",
    supplyType: sale?.product?.supplyType || "kaveera",
    quantity: sale?.product?.quantity || 1,
    unitPrice: sale?.product?.unitPrice || "",
    discount: sale?.product?.discount || 0,
    amountPaid: sale?.amountPaid || 0,
    date: sale?.date ? sale.date.toDate().toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (products.length > 0 && !formData.unitPrice && formData.productId) {
      const product = products.find(p => p.id === formData.productId);
      if (product) {
        setFormData(prev => ({ ...prev, unitPrice: product.price || "" }));
      }
    }
  }, [products, formData.productId]);

  const getAvailableSupplyTypes = () => {
    if (!formData.productId) return [];
    
    const selectedProduct = products.find(p => p.id === formData.productId);
    if (!selectedProduct) return [];
    
    const productSupplies = supplies.filter(supply => supply.productId === formData.productId);
    const uniqueSupplyTypes = [...new Set(productSupplies.map(supply => supply.supplyType.toLowerCase()))]; // Normalize case
    
    if (uniqueSupplyTypes.length === 0) {
      return [
        { value: "kaveera", label: "Kaveera (K)" },
        { value: "box", label: "Box (B)" }
      ];
    }
    
    return uniqueSupplyTypes.map(type => ({
      value: type,
      label: type === "kaveera" ? "Kaveera (K)" : type === "box" ? "Box (B)" : type
    }));
  };

  useEffect(() => {
    const availableTypes = getAvailableSupplyTypes();
    if (availableTypes.length > 0 && !availableTypes.find(type => type.value === formData.supplyType)) {
      setFormData(prev => ({ ...prev, supplyType: availableTypes[0].value }));
    }
  }, [formData.productId]);

  const subtotal = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitPrice) || 0);
  const totalAmount = subtotal - (parseFloat(formData.discount) || 0);
  const remainingBalance = totalAmount - (parseFloat(formData.amountPaid) || 0);
  const paymentStatus = formData.amountPaid >= totalAmount ? "paid" : formData.amountPaid > 0 ? "partial" : "unpaid";

  useEffect(() => {
    if (isFullyPaid && totalAmount > 0) {
      setFormData(prev => ({ ...prev, amountPaid: totalAmount }));
    }
  }, [isFullyPaid, totalAmount]);

  useEffect(() => {
    if (totalAmount > 0 && parseFloat(formData.amountPaid) === totalAmount) {
      setIsFullyPaid(true);
    } else {
      setIsFullyPaid(false);
    }
  }, [formData.amountPaid, totalAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!user) {
      setError("User not authenticated");
      setIsSubmitting(false);
      return;
    }

    if (!formData.client || !formData.productId || !formData.supplyType || !formData.unitPrice || !formData.quantity) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const saleData = {
        client: formData.client,
        product: {
          productId: formData.productId,
          supplyType: formData.supplyType.toLowerCase(), // Normalize case
          quantity: parseInt(formData.quantity),
          unitPrice: parseFloat(formData.unitPrice),
          discount: parseFloat(formData.discount || 0),
        },
        totalAmount,
        amountPaid: parseFloat(formData.amountPaid || 0),
        paymentStatus,
        date: new Date(formData.date),
        createdAt: sale ? sale.createdAt : new Date(),
        updatedAt: new Date(),
      };

      const batch = writeBatch(db);
      let saleRef;

      if (sale) {
        saleRef = doc(db, `users/${user.uid}/sales`, sale.id);
        batch.update(saleRef, saleData);

        const existingDebtQuery = query(
          collection(db, `users/${user.uid}/debts`),
          where("saleId", "==", sale.id)
        );
        const querySnapshot = await getDocs(existingDebtQuery);
        querySnapshot.forEach(docSnapshot => {
          batch.delete(docSnapshot.ref);
        });
      } else {
        saleRef = doc(collection(db, `users/${user.uid}/sales`));
        batch.set(saleRef, saleData);
      }

      if (remainingBalance > 0) {
        const debtRef = doc(collection(db, `users/${user.uid}/debts`));
        const product = products.find(p => p.id === formData.productId);
        batch.set(debtRef, {
          client: formData.client,
          amount: remainingBalance,
          productId: formData.productId,
          productName: product ? product.name : "",
          supplyType: formData.supplyType.toLowerCase(), // Normalize case
          saleId: saleRef.id,
          lastPaidAmount: parseFloat(formData.amountPaid) || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await batch.commit();
      onClose();
    } catch (err) {
      console.error("Error saving sale:", err);
      setError("Failed to save sale. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFullyPaidToggle = () => {
    if (!isFullyPaid) {
      setFormData(prev => ({ ...prev, amountPaid: totalAmount }));
      setIsFullyPaid(true);
    } else {
      setFormData(prev => ({ ...prev, amountPaid: 0 }));
      setIsFullyPaid(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getPaymentStatusColor = () => {
    switch (paymentStatus) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'partial':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-red-600 bg-red-50';
    }
  };

  const getPaymentStatusText = () => {
    switch (paymentStatus) {
      case 'paid':
        return 'Fully Paid';
      case 'partial':
        return 'Partially Paid';
      default:
        return 'Unpaid';
    }
  };

  const availableSupplyTypes = getAvailableSupplyTypes();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex-shrink-0 flex justify-between items-center p-4 sm:p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800">{sale ? "Edit Sale" : "Add New Sale"}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Client</label>
            <AutocompleteInput
              options={clients.map(c => ({ id: c.id, name: c.name }))}
              value={formData.client}
              onChange={value => handleChange("client", value)}
              placeholder="Select or type client name"
              allowNew
              icon={<User className="w-5 h-5 text-neutral-400" />}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Product</label>
            <AutocompleteInput
              options={products.map(p => ({ id: p.id, name: p.name }))}
              value={formData.productId}
              onChange={value => {
                handleChange("productId", value);
                const product = products.find(p => p.id === value);
                if (product) handleChange("unitPrice", product.price || "");
              }}
              placeholder="Select product"
              icon={<Package className="w-5 h-5 text-neutral-400" />}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Supply Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplyType}
              onChange={e => handleChange("supplyType", e.target.value)}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="" disabled>Select supply type</option>
              {availableSupplyTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={e => handleChange("quantity", e.target.value)}
                min="1"
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Unit Price (UGX)</label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={e => handleChange("unitPrice", e.target.value)}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Discount (UGX)</label>
            <input
              type="number"
              value={formData.discount}
              onChange={e => handleChange("discount", e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {formData.quantity && formData.unitPrice && (
            <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3">
                <Calculator className="w-4 h-4" />
                Calculation Summary
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">
                    Subtotal ({formData.quantity} × {formatCurrency(formData.unitPrice)}):
                  </span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {formData.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Discount:</span>
                    <span className="text-red-600">-{formatCurrency(formData.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium text-neutral-800">Total Amount:</span>
                  <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-neutral-700">Amount Paid (UGX)</label>
              {totalAmount > 0 && (
                <button
                  type="button"
                  onClick={handleFullyPaidToggle}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isFullyPaid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {isFullyPaid ? 'Fully Paid' : 'Mark as Fully Paid'}
                </button>
              )}
            </div>
            <input
              type="number"
              value={formData.amountPaid}
              onChange={e => {
                handleChange("amountPaid", e.target.value);
                setIsFullyPaid(false);
              }}
              min="0"
              step="0.01"
              max={totalAmount}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {totalAmount > 0 && (
            <div className="bg-white border rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Payment Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor()}`}>
                  {getPaymentStatusText()}
                </span>
              </div>
              {remainingBalance > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm9791 text-neutral-600">Remaining Balance:</span>
                  <span className="font-medium text-red-600">{formatCurrency(remainingBalance)}</span>
                </div>
              )}
              {remainingBalance <= 0 && formData.amountPaid > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Status:</span>
                  <span className="font-medium text-green-600">Payment Complete ✓</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => handleChange("date", e.target.value)}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-6 border-t border-neutral-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.client || !formData.productId || !formData.supplyType || !formData.unitPrice || !formData.quantity}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Saving..." : sale ? "Update Sale" : "Add Sale"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesForm;