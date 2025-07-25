// src/components/reports/SuppliesSummary.jsx
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from "date-fns";

const SuppliesSummary = ({ doc, data, products, dateFilter, addTable, yPosition }) => {
  const safeFormatDate = (date) => {
    try {
      if (!date) return "-";
      if (date.toDate) return format(date.toDate(), "MMM dd, yyyy");
      if (typeof date === "string") return format(new Date(date), "MMM dd, yyyy");
      if (date instanceof Date) return format(date, "MMM dd, yyyy");
      return "-";
    } catch (error) {
      console.warn("Invalid date:", date);
      return "-";
    }
  };

  const filterData = (dataset) => {
    if (!Array.isArray(dataset)) return [];
    if (dateFilter.type === "all") return dataset;
    return dataset.filter((item) => {
      if (!item.date) return false; // Skip items without date
      try {
        const itemDate = item.date ? new Date(item.date) : null;
        if (!itemDate) return false;
        const start = dateFilter.startDate ? parseISO(dateFilter.startDate) : null;
        const end = dateFilter.endDate ? parseISO(dateFilter.endDate) : null;
        return start && end
          ? isWithinInterval(itemDate, { start: startOfDay(start), end: endOfDay(end) })
          : true;
      } catch (error) {
        console.warn("Date filtering error:", error);
        return false;
      }
    });
  };

  const filteredSupplies = filterData(data.supplies);
  const filteredSales = filterData(data.sales);

  const supplySummary = filteredSupplies.reduce((acc, supply) => {
    if (!supply.productId || !supply.supplyType || !supply.quantity) return acc; // Skip invalid supply records
    const product = products.find((p) => p.id === supply.productId);
    if (!product) {
      console.warn(`Product not found for productId: ${supply.productId}`);
      return acc; // Skip if product not found
    }
    const productName = product.name;
    const supplyType = supply.supplyType.toLowerCase(); // Normalize case
    const key = `${supplyType}_${productName}`;
    if (!acc[key]) {
      acc[key] = {
        supplyType,
        product: productName,
        quantity: 0,
        quantitySold: 0,
      };
    }
    acc[key].quantity += parseInt(supply.quantity || 0);
    const salesForProduct = filteredSales.filter(
      (sale) =>
        sale.product?.productId === supply.productId &&
        (sale.product?.supplyType?.toLowerCase() === supplyType || !sale.product?.supplyType) // Handle missing supplyType
    );
    acc[key].quantitySold += salesForProduct.reduce(
      (sum, sale) => sum + parseInt(sale.product?.quantity || 0),
      0
    );
    return acc;
  }, {});

  const suppliesData = Object.values(supplySummary).map((data) => ({
    supplyType: data.supplyType,
    product: data.product,
    quantity: data.quantity.toString(),
    quantitySold: data.quantitySold.toString(),
    balance: (data.quantity - data.quantitySold).toString(),
  }));

  return addTable(
    "Supplies Summary",
    [
      { header: "SUPPLY TYPE", dataKey: "supplyType" },
      { header: "PRODUCT", dataKey: "product" },
      { header: "QUANTITY", dataKey: "quantity" },
      { header: "SOLD", dataKey: "quantitySold" },
      { header: "BALANCE", dataKey: "balance" },
    ],
    suppliesData,
    yPosition
  );
};

export default SuppliesSummary;