// src/components/reports/SuppliesSummary.jsx
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from "date-fns";

const SuppliesSummary = ({ doc, data, dateFilter, addTable, yPosition }) => {
  const filterDataByDate = (dataset) => {
    if (!Array.isArray(dataset)) return [];
    if (dateFilter.type === "all") return dataset;
    return dataset.filter((item) => {
      if (!item.date) return false;
      try {
        const itemDate = new Date(item.date);
        const start = dateFilter.startDate ? parseISO(dateFilter.startDate) : null;
        const end = dateFilter.endDate ? parseISO(dateFilter.endDate) : null;
        return start && end
          ? isWithinInterval(itemDate, { start: startOfDay(start), end: endOfDay(end) })
          : false;
      } catch (error) {
        console.warn("Date filtering error:", error);
        return false;
      }
    });
  };

  const filteredSupplies = filterDataByDate(data.supplies);
  const filteredSales = filterDataByDate(data.sales);

  const supplySummary = filteredSupplies.reduce((acc, supply) => {
    if (!supply.supplyType || !supply.quantity) return acc;
    const supplyType = supply.supplyType.toLowerCase();
    if (!acc[supplyType]) {
      acc[supplyType] = {
        supplyType,
        quantity: 0,
        quantitySold: 0,
      };
    }
    acc[supplyType].quantity += parseInt(supply.quantity || 0);
    return acc;
  }, {});

  filteredSales.forEach((sale) => {
    if (!sale.product?.supplyType || !sale.product?.quantity) return;
    const supplyType = sale.product.supplyType.toLowerCase();
    if (supplySummary[supplyType]) {
      supplySummary[supplyType].quantitySold += parseInt(sale.product.quantity || 0);
    }
  });

  const suppliesData = Object.values(supplySummary).map((data) => ({
    supplyType: data.supplyType,
    quantity: data.quantity.toString(),
    quantitySold: data.quantitySold.toString(),
    balance: (data.quantity - data.quantitySold).toString(),
  }));

  return addTable(
    "Supplies Summary",
    [
      { header: "SUPPLY TYPE", dataKey: "supplyType" },
      { header: "TAKEN", dataKey: "quantity" },
      { header: "SOLD", dataKey: "quantitySold" },
      { header: "BALANCE", dataKey: "balance" },
    ],
    suppliesData,
    yPosition
  );
};

export default SuppliesSummary;