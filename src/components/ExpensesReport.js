import React, { useState, useContext } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import toast from "react-hot-toast";
import logo from "./logo.jpg";
import { DataContext } from '../DataContext';

const ExpensesReport = ({ dateFilter }) => {
  const { user, expenses, categories, loading, error } = useContext(DataContext);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter expenses based on dateFilter
  const getFilteredExpenses = () => {
    const now = new Date();
    let startDate, endDate;

    switch (dateFilter.type) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'yesterday':
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case 'thisWeek':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'range':
        startDate = dateFilter.startDate ? new Date(dateFilter.startDate + 'T00:00:00') : null;
        endDate = dateFilter.endDate ? new Date(dateFilter.endDate + 'T23:59:59') : null;
        break;
      case 'all':
      default:
        return expenses;
    }

    if (startDate && endDate) {
      return expenses.filter(expense => {
        const expenseDate = expense.createdAt?.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
    }
    return expenses;
  };

  const filteredExpenses = getFilteredExpenses();

  const generateExpensesReport = async () => {
    if (isGenerating || !user) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      const primary = [15, 23, 42]; // Dark navy for headers
      const secondary = [71, 85, 105]; // Slate for text
      const background = [248, 250, 252]; // Light gray for backgrounds
      const border = [226, 232, 240]; // Light border
      const expenseColor = [220, 38, 38]; // Red for expenses
      const footerSpace = 30;
      const tableWidth = pageWidth - 30;

      // Load logo
      let logoBase64 = null;
      try {
        logoBase64 = await new Promise((resolve, reject) => {
          const img = new Image();
          const timeout = setTimeout(() => resolve(null), 5000);
          img.onload = () => {
            clearTimeout(timeout);
            const canvas = document.createElement("canvas");
            const size = Math.min(img.width, img.height);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, 0, 0, size, size);
            resolve(canvas.toDataURL("image/jpeg", 0.9));
          };
          img.onerror = () => {
            clearTimeout(timeout);
            resolve(null);
          };
          img.src = logo;
        });
      } catch (error) {
        console.warn("Failed to load logo:", error);
      }

      // Add header
      const addHeader = () => {
        const headerHeight = 45;
        doc.setFillColor(...primary);
        doc.rect(0, 0, pageWidth, headerHeight, "F");

        if (logoBase64) {
          doc.addImage(logoBase64, "JPEG", 15, 8, 28, 28);
        }

        const logoOffset = logoBase64 ? 50 : 15;
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("times", "bold");
        doc.text("RICHMOND MANUFACTURER'S LTD", logoOffset, 18);
        doc.setFontSize(11);
        doc.setFont("times", "normal");
        doc.setTextColor(203, 213, 225);
        doc.text("Plot 19191, Kimwanyi Road, Nakwero, Wakiso District", logoOffset, 26);
        doc.text("Kira Municipality, Kira Division | Tel: 0705555498 / 0776 210570", logoOffset, 32);
      };

      // Add footer
      const addFooter = (pageNumber, totalPages) => {
        const footerY = pageHeight - 15;
        
        doc.setDrawColor(...border);
        doc.setLineWidth(0.5);
        doc.line(15, footerY - 8, pageWidth - 15, footerY - 8);
        
        doc.setTextColor(...secondary);
        doc.setFontSize(9);
        doc.setFont("times", "normal");
        
        doc.text("Richmond Manufacturer's Ltd - Expenses Report", 15, footerY);
        
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(10);
        doc.setFont("times", "bold");
        doc.text("CONFIDENTIAL", pageWidth / 2, footerY, { align: "center" });
        
        doc.setTextColor(...secondary);
        doc.setFontSize(9);
        doc.setFont("times", "normal");
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 15, footerY, { align: "right" });
      };

      // Add introduction card
      const addIntroductionCard = (yPos) => {
        if (yPos > pageHeight - footerSpace - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, yPos, pageWidth - 30, 60, 4, 4, "FD");
        
        doc.setFillColor(...primary);
        doc.roundedRect(15, yPos, pageWidth - 30, 20, 4, 4, "F");
        doc.rect(15, yPos + 16, pageWidth - 30, 4, "F");
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("times", "bold");
        doc.text("EXPENSES REPORT", 20, yPos + 13);
        
        const cardContentY = yPos + 30;
        
        doc.setTextColor(...primary);
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text("Generated:", 25, cardContentY);
        
        doc.setTextColor(...secondary);
        doc.setFontSize(12);
        doc.setFont("times", "normal");
        doc.text(format(new Date(), "MMM dd, yyyy 'at' HH:mm"), 70, cardContentY);
        
        doc.setTextColor(...primary);
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text("Period:", 25, cardContentY + 12);
        
        doc.setTextColor(...secondary);
        doc.setFontSize(12);
        doc.setFont("times", "normal");
        let periodText = dateFilter.type === 'all' ? "All Time" :
                         dateFilter.type === 'today' ? "Today" :
                         dateFilter.type === 'yesterday' ? "Yesterday" :
                         dateFilter.type === 'thisWeek' ? "This Week" :
                         dateFilter.type === 'thisMonth' ? "This Month" :
                         `${format(new Date(dateFilter.startDate), "MMM dd, yyyy")} - ${format(new Date(dateFilter.endDate), "MMM dd, yyyy")}`;
        doc.text(periodText, 60, cardContentY + 12);

        const badgeX = pageWidth - 80;
        doc.setFillColor(220, 38, 38);
        doc.roundedRect(badgeX, cardContentY - 5, 55, 18, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("times", "bold");
        doc.text("EXPENSES", badgeX + 27.5, cardContentY + 5, { align: "center" });

        return yPos + 70;
      };

      // Add approval section
      const addApprovalSection = (yPos) => {
        if (yPos > pageHeight - footerSpace - 70) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, yPos, pageWidth - 30, 70, 4, 4, "FD");
        
        doc.setFillColor(...primary);
        doc.roundedRect(15, yPos, pageWidth - 30, 15, 4, 4, "F");
        doc.rect(15, yPos + 11, pageWidth - 30, 4, "F");
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        doc.text("DOCUMENT APPROVAL", 20, yPos + 10);
        
        const cardContentY = yPos + 25;
        
        const leftX = 25;
        const rightX = pageWidth / 2 + 10;
        
        doc.setTextColor(...primary);
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text("COMPILED BY:", leftX, cardContentY);
        
        doc.setTextColor(...secondary);
        doc.setFontSize(11);
        doc.setFont("times", "normal");
        doc.text("SHADIA NAKITTO", leftX, cardContentY + 12);
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.text("Sales & Accounts Assistant", leftX, cardContentY + 20);
        
        doc.setDrawColor(...secondary);
        doc.setLineWidth(0.5);
        doc.line(leftX, cardContentY + 35, leftX + 70, cardContentY + 35);
        doc.setFontSize(9);
        doc.text("Signature", leftX, cardContentY + 42);
        doc.text(`Date: ${format(new Date(), "MMM dd, yyyy")}`, leftX + 35, cardContentY + 42);
        
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(pageWidth / 2, cardContentY - 5, pageWidth / 2, yPos + 65);
        
        doc.setTextColor(...primary);
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        doc.text("PRESENTED TO:", rightX, cardContentY);
        
        doc.setTextColor(...secondary);
        doc.setFontSize(11);
        doc.setFont("times", "normal");
        doc.text("CHRISTINE NAKAZIBA", rightX, cardContentY + 12);
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.text("Marketing Manager", rightX, cardContentY + 20);
        
        doc.setDrawColor(...secondary);
        doc.setLineWidth(0.5);
        doc.line(rightX, cardContentY + 35, rightX + 70, cardContentY + 35);
        doc.setFontSize(9);
        doc.text("Signature & Date", rightX, cardContentY + 42);

        return yPos + 80;
      };

      // Add table function
      const addTable = (title, columns, rows, startY) => {
        if (startY > pageHeight - footerSpace - 60) {
          doc.addPage();
          startY = 20;
        }

        doc.setFontSize(16);
        doc.setFont("times", "bold");
        doc.setTextColor(...primary);
        doc.text(title, 15, startY);

        if (!rows || rows.length === 0) {
          doc.setFontSize(13);
          doc.setTextColor(...secondary);
          doc.text("No data available for this section", 15, startY + 15);
          return startY + 30;
        }

        const filteredRows = rows.filter(row => 
          row && 
          Object.values(row).some(cell => 
            cell !== null && cell !== undefined && cell.toString().trim() !== ''
          )
        );

        doc.autoTable({
          columns,
          body: filteredRows,
          startY: startY + 8,
          theme: "plain",
          headStyles: {
            fillColor: expenseColor,
            textColor: [255, 255, 255],
            fontSize: 14,
            fontStyle: "bold",
            halign: "left",
            cellPadding: { top: 7, right: 5, bottom: 7, left: 5 },
            lineWidth: 0,
            minCellHeight: 18,
          },
          bodyStyles: {
            fontSize: 13,
            cellPadding: { top: 6, right: 5, bottom: 6, left: 5 },
            textColor: secondary,
            lineWidth: 0.2,
            lineColor: border,
            minCellHeight: 16,
          },
          alternateRowStyles: {
            fillColor: background,
          },
          margin: { left: 15, right: 15, bottom: footerSpace },
          tableWidth: tableWidth,
          styles: {
            overflow: "ellipsize",
            cellWidth: "wrap",
            font: "times",
            fontSize: 13,
          },
          didParseCell: (data) => {
            if (data.row.raw.category === "TOTAL") {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.fontSize = 15;
            }
          },
        });

        let finalY = doc.lastAutoTable.finalY || startY + 30;
        return finalY + 20;
      };

      // Prepare data for expenses table
      const expensesData = filteredExpenses
        .map((expense) => {
          const category = categories.find((c) => c.id === expense.categoryId);
          return {
            category: category?.name || expense.category || "-",
            amount: (parseFloat(expense.amount) || 0).toLocaleString(),
            description: expense.description || "-",
            payee: expense.payee || "-",
            createdAt: expense.createdAt ? format(expense.createdAt.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt), "MMM dd, yyyy") : "-",
            rawAmount: parseFloat(expense.amount) || 0,
          };
        })
        .sort((a, b) => b.rawAmount - a.rawAmount);

      // Calculate totals and metrics
      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
      
      const highestExpense = filteredExpenses.reduce((max, expense) => 
        (parseFloat(expense.amount) || 0) > (parseFloat(max.amount) || 0) ? expense : max, { amount: 0 });
      
      const oldestExpense = filteredExpenses.reduce((oldest, expense) => 
        (!oldest.createdAt || (expense.createdAt && expense.createdAt.toDate().getTime() < oldest.createdAt.toDate().getTime())) ? expense : oldest, 
        { createdAt: null });

      // Add total row
      if (expensesData.length > 0) {
        expensesData.push({
          category: "TOTAL",
          amount: totalExpenses.toLocaleString(),
          description: "",
          payee: "",
          createdAt: "",
        });
      }

      // Start generating PDF
      addHeader();
      let yPosition = 55;
      yPosition = addIntroductionCard(yPosition);

      // Add summary section
      if (yPosition > pageHeight - footerSpace - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPosition, pageWidth - 30, 80, 4, 4, "FD");
      
      doc.setFillColor(220, 38, 38);
      doc.roundedRect(15, yPosition, pageWidth - 30, 20, 4, 4, "F");
      doc.rect(15, yPosition + 16, pageWidth - 30, 4, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("times", "bold");
      doc.text("EXPENSE SUMMARY", 20, yPosition + 13);
      
      const summaryY = yPosition + 30;
      
      doc.setTextColor(...primary);
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("Total Expenses:", 25, summaryY);
      doc.setTextColor(...expenseColor);
      doc.text(`${totalExpenses.toLocaleString()} UGX`, 25, summaryY + 12);
      
      doc.setTextColor(...primary);
      doc.text("Highest Expense:", 25, summaryY + 24);
      doc.setTextColor(...secondary);
      doc.setFont("times", "normal");
      doc.text(highestExpense.amount ? `${(parseFloat(highestExpense.amount) || 0).toLocaleString()} UGX (${highestExpense.category || '-'})` : "N/A", 25, summaryY + 36);
      
      doc.setTextColor(...primary);
      doc.setFont("times", "bold");
      doc.text("Oldest Expense:", 25, summaryY + 48);
      doc.setTextColor(...secondary);
      doc.setFont("times", "normal");
      doc.text(oldestExpense.createdAt ? format(oldestExpense.createdAt.toDate ? oldestExpense.createdAt.toDate() : new Date(oldestExpense.createdAt), "MMM dd, yyyy") + ` (${oldestExpense.category || '-'})` : "N/A", 25, summaryY + 60);

      yPosition += 90;

      // Add expenses table
      yPosition = addTable(
        "Expenses",
        [
          { header: "CATEGORY", dataKey: "category" },
          { header: "AMOUNT (UGX)", dataKey: "amount" },
          { header: "DESCRIPTION", dataKey: "description" },
          { header: "PAYEE", dataKey: "payee" },
          { header: "DATE", dataKey: "createdAt" },
        ],
        expensesData,
        yPosition,
        'expenses'
      );

      // Add approval section
      yPosition = addApprovalSection(yPosition);

      // Add footers to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
      }

      // Save PDF
      const fileName = `Expenses_Report_${format(new Date(), "yyyy-MM-dd")}_RML.pdf`;
      doc.save(fileName);
      toast.success("Expenses report generated successfully!");
      
    } catch (error) {
      console.error("Error generating expenses report:", error);
      toast.error(`Failed to generate expenses report: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-600">
        Loading expenses data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-slate-600">
        Please log in to generate expenses report.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Expenses Report</h2>
        <p className="text-slate-600">
          Generate a comprehensive PDF report of all expenses.
        </p>
      </div>

      <button
        onClick={generateExpensesReport}
        disabled={isGenerating || filteredExpenses.length === 0}
        className="w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Generating Report...</span>
          </>
        ) : (
          <>
            <FileText className="w-5 h-5" />
            <span>
              {filteredExpenses.length === 0 ? 'No Expenses to Report' : 'Generate Expenses Report'}
            </span>
          </>
        )}
      </button>

      {filteredExpenses.length === 0 && (
        <p className="text-center text-slate-500 mt-4 text-sm">
          No expenses found. Add some expenses to generate a report.
        </p>
      )}
    </div>
  );
};

export default ExpensesReport;