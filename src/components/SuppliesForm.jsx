import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { X, Package } from "lucide-react";
import AutocompleteInput from "./AutocompleteInput";

const SuppliesForm = ({ newSupply, setNewSupply, setShowSupplyForm, products }) => {
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleAddSupply = async (e) => {
    e.preventDefault();
    if (!newSupply.productId.trim() || !newSupply.supplyType || !newSupply.quantity || !user) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      await addDoc(collection(db, `users/${user.uid}/supplies`), {
        productId: newSupply.productId,
        supplyType: newSupply.supplyType,
        quantity: parseInt(newSupply.quantity),
        date: new Date(newSupply.date),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setNewSupply({ productId: "", supplyType: "", quantity: "", date: new Date().toISOString().split("T")[0] });
      setShowSupplyForm(false);
    } catch (err) {
      console.error("Error adding supply:", err);
      setError("Failed to add supply. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-neutral-800">Add New Supply</h3>
          <button
            onClick={() => {
              setShowSupplyForm(false);
              setNewSupply({ productId: "", supplyType: "", quantity: "", date: new Date().toISOString().split("T")[0] });
            }}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleAddSupply} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Product <span className="text-red-500">*</span>
              </label>
              <AutocompleteInput
                options={products.map(p => ({ id: p.id, name: p.name }))}
                value={newSupply.productId}
                onChange={(value) => setNewSupply({ ...newSupply, productId: value })}
                placeholder="Select product"
                icon={<Package className="w-5 h-5 text-neutral-400" />}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Supply Type <span className="text-red-500">*</span>
              </label>
              <select
                value={newSupply.supplyType}
                onChange={(e) => setNewSupply({ ...newSupply, supplyType: e.target.value })}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-colors"
              >
                <option value="" disabled>Select supply type</option>
                <option value="Kaveera">Kaveera (K)</option>
                <option value="Box">Box (B)</option>
                <option value="P">P</option>
                <option value="S">S</option>
                <option value="W">W</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={newSupply.quantity}
                onChange={(e) => setNewSupply({ ...newSupply, quantity: e.target.value })}
                required
                min="1"
                placeholder="Enter quantity"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={newSupply.date}
                onChange={(e) => setNewSupply({ ...newSupply, date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </form>
        </div>
        
        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-neutral-200 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowSupplyForm(false);
              setNewSupply({ productId: "", supplyType: "", quantity: "", date: new Date().toISOString().split("T")[0] });
            }}
            className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSupply}
            disabled={!newSupply.productId || !newSupply.supplyType || !newSupply.quantity || isSubmitting}
            className="px-4 py-2 bg-orange-800 text-white rounded-lg hover:bg-orange-900 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Adding..." : "Add Supply"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuppliesForm;