
import React, { useState, useContext, forwardRef, useImperativeHandle } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format, isToday } from "date-fns";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../logo.jpg";
import { DataContext } from '../../DataContext';

const DebtsReport = ({ dateFilter }, ref) => {
  const { user, debts, clients, products, loading, error } = useContext(DataContext);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter debts based on dateFilter
  const filteredDebts = debts.filter(debt => {
    if (dateFilter.type === 'all') return true;
    const debtDate = debt.createdAt?.toDate ? debt.createdAt.toDate() : new Date(debt.createdAt);
    if (dateFilter.type === 'range' && dateFilter.startDate && dateFilter.endDate) {
      return debtDate >= new Date(dateFilter.startDate) && debtDate <= new Date(dateFilter.endDate);
    }
    return true;
  });

  const generateDebtsReport = async () => {
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
      const strawColor = [0, 128, 128]; // Corporate teal for straws
      const toiletPaperColor = [34, 139, 34]; // Corporate forest green for toilet paper
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
        
        doc.text("Richmond Manufacturer's Ltd - Debts Report", 15, footerY);
        
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
        doc.text("OUTSTANDING DEBTS REPORT", 20, yPos + 13);
        
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
        doc.text("Status:", 25, cardContentY + 12);
        
        doc.setTextColor(...secondary);
        doc.setFontSize(12);
        doc.setFont("times", "normal");
        doc.text("Current Outstanding Balances", 60, cardContentY + 12);

        const badgeX = pageWidth - 80;
        doc.setFillColor(220, 38, 38);
        doc.roundedRect(badgeX, cardContentY - 5, 55, 18, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("times", "bold");
        doc.text("DEBTS", badgeX + 27.5, cardContentY + 5, { align: "center" });

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
      const addTable = (title, columns, rows, startY, sectionType = 'debts') => {
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

        const sectionColor = sectionType === 'debts' ? strawColor : 
                           sectionType === 'strawPayments' ? strawColor : 
                           toiletPaperColor;
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
            fillColor: sectionColor,
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
            if (data.row.raw.client === "TOTAL") {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.fontSize = 15;
            }
          },
        });

        let finalY = doc.lastAutoTable.finalY || startY + 30;
        return finalY + 20;
      };

      // Filter debts by product
      const strawDebts = filteredDebts.filter(debt => {
        const product = products.find(p => p.id === debt.productId);
        return product?.name === 'Straws';
      });

      const toiletPaperDebts = filteredDebts.filter(debt => {
        const product = products.find(p => p.id === debt.productId);
        return product?.name === 'Toilet Paper';
      });

      // Debts paid today
      const strawDebtsPaidToday = strawDebts.filter(debt => 
        debt.lastPaidAmount > 0 && isToday(debt.updatedAt?.toDate ? debt.updatedAt.toDate() : new Date(debt.updatedAt))
      );
      const toiletPaperDebtsPaidToday = toiletPaperDebts.filter(debt => 
        debt.lastPaidAmount > 0 && isToday(debt.updatedAt?.toDate ? debt.updatedAt.toDate() : new Date(debt.updatedAt))
      );

      // Prepare data for tables
      const strawDebtsData = strawDebts.map((debt) => {
        const client = clients.find((c) => c.name === debt.client);
        return {
          client: client?.name || debt.client || "-",
          debtBalance: (parseFloat(debt.amount) || 0).toLocaleString(),
          updatedAt: debt.updatedAt ? format(debt.updatedAt.toDate ? debt.updatedAt.toDate() : new Date(debt.updatedAt), "MMM dd, yyyy") : "-",
          rawAmount: parseFloat(debt.amount) || 0,
        };
      }).sort((a, b) => b.rawAmount - a.rawAmount);

      const toiletPaperDebtsData = toiletPaperDebts.map((debt) => {
        const client = clients.find((c) => c.name === debt.client);
        return {
          client: client?.name || debt.client || "-",
          debtBalance: (parseFloat(debt.amount) || 0).toLocaleString(),
          updatedAt: debt.updatedAt ? format(debt.updatedAt.toDate ? debt.updatedAt.toDate() : new Date(debt.updatedAt), "MMM dd, yyyy") : "-",
          rawAmount: parseFloat(debt.amount) || 0,
        };
      }).sort((a, b) => b.rawAmount - a.rawAmount);

      const strawPaidTodayData = strawDebtsPaidToday.map((debt) => {
        const client = clients.find((c) => c.name === debt.client);
        return {
          client: client?.name || debt.client || "-",
          paidToday: (parseFloat(debt.lastPaidAmount) || 0).toLocaleString(),
          balanceLeft: (parseFloat(debt.amount) || 0).toLocaleString(),
        };
      });

      const toiletPaperPaidTodayData = toiletPaperDebtsPaidToday.map((debt) => {
        const client = clients.find((c) => c.name === debt.client);
        return {
          client: client?.name || debt.client || "-",
          paidToday: (parseFloat(debt.lastPaidAmount) || 0).toLocaleString(),
          balanceLeft: (parseFloat(debt.amount) || 0).toLocaleString(),
        };
      });

      // Calculate totals and metrics
      const strawTotal = strawDebts.reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);
      const toiletPaperTotal = toiletPaperDebts.reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);
      
      const highestStrawDebt = strawDebts.reduce((max, debt) => 
        (parseFloat(debt.amount) || 0) > (parseFloat(max.amount) || 0) ? debt : max, { amount: 0 });
      const highestToiletPaperDebt = toiletPaperDebts.reduce((max, debt) => 
        (parseFloat(debt.amount) || 0) > (parseFloat(max.amount) || 0) ? debt : max, { amount: 0 });
      
      const oldestStrawDebt = strawDebts.reduce((oldest, debt) => 
        (!oldest.createdAt || (debt.createdAt && debt.createdAt.toDate().getTime() < oldest.createdAt.toDate().getTime())) ? debt : oldest, 
        { createdAt: null });
      const oldestToiletPaperDebt = toiletPaperDebts.reduce((oldest, debt) => 
        (!oldest.createdAt || (debt.createdAt && debt.createdAt.toDate().getTime() < oldest.createdAt.toDate().getTime())) ? debt : oldest, 
        { createdAt: null });

      // Add total rows
      if (strawDebtsData.length > 0) {
        strawDebtsData.push({
          client: "TOTAL",
          debtBalance: strawTotal.toLocaleString(),
          updatedAt: "",
        });
      }

      if (toiletPaperDebtsData.length > 0) {
        toiletPaperDebtsData.push({
          client: "TOTAL",
          debtBalance: toiletPaperTotal.toLocaleString(),
          updatedAt: "",
        });
      }

      // Start generating PDF
      addHeader();
      let yPosition = 55;
      yPosition = addIntroductionCard(yPosition);

      // Add summary section
      if (yPosition > pageHeight - footerSpace - 120) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPosition, pageWidth - 30, 120, 4, 4, "FD");
      
      doc.setFillColor(220, 38, 38);
      doc.roundedRect(15, yPosition, pageWidth - 30, 20, 4, 4, "F");
      doc.rect(15, yPosition + 16, pageWidth - 30, 4, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("times", "bold");
      doc.text("DEBT SUMMARY", 20, yPosition + 13);
      
      const summaryY = yPosition + 30;
      
      doc.setTextColor(...primary);
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("Straws Total Outstanding:", 25, summaryY);
      doc.setTextColor(...strawColor);
      doc.text(`${strawTotal.toLocaleString()} UGX`, 25, summaryY + 12);
      
      doc.setTextColor(...primary);
      doc.text("Highest Straw Debt:", 25, summaryY + 24);
      doc.setTextColor(...secondary);
      doc.setFont("times", "normal");
      doc.text(highestStrawDebt.amount ? `${(parseFloat(highestStrawDebt.amount) || 0).toLocaleString()} UGX (${highestStrawDebt.client || '-'})` : "N/A", 25, summaryY + 36);
      
      doc.setTextColor(...primary);
      doc.setFont("times", "bold");
      doc.text("Oldest Straw Debt:", 25, summaryY + 48);
      doc.setTextColor(...secondary);
      doc.setFont("times", "normal");
      doc.text(oldestStrawDebt.createdAt ? format(oldestStrawDebt.createdAt.toDate ? oldestStrawDebt.createdAt.toDate() : new Date(oldestStrawDebt.createdAt), "MMM dd, yyyy") + ` (${oldestStrawDebt.client || '-'})` : "N/A", 25, summaryY + 60);
      
      doc.setTextColor(...primary);
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("Toilet Paper Total Outstanding:", pageWidth / 2 + 10, summaryY);
      doc.setTextColor(...toiletPaperColor);
      doc.text(`${toiletPaperTotal.toLocaleString()} UGX`, pageWidth / 2 + 10, summaryY + 12);
      
      doc.setTextColor(...primary);
      doc.text("Highest Toilet Paper Debt:", pageWidth / 2 + 10, summaryY + 24);
      doc.setTextColor(...secondary);
      doc.setFont("times", "normal");
      doc.text(highestToiletPaperDebt.amount ? `${(parseFloat(highestToiletPaperDebt.amount) || 0).toLocaleString()} UGX (${highestToiletPaperDebt.client || '-'})` : "N/A", pageWidth / 2 + 10, summaryY + 36);
      
      doc.setTextColor(...primary);
      doc.setFont("times", "bold");
      doc.text("Oldest Toilet Paper Debt:", pageWidth / 2 + 10, summaryY + 48);
      doc.setTextColor(...secondary);
      doc.setFont("times", "normal");
      doc.text(oldestToiletPaperDebt.createdAt ? format(oldestToiletPaperDebt.createdAt.toDate ? oldestToiletPaperDebt.createdAt.toDate() : new Date(oldestToiletPaperDebt.createdAt), "MMM dd, yyyy") + ` (${oldestToiletPaperDebt.client || '-'})` : "N/A", pageWidth / 2 + 10, summaryY + 60);

      yPosition += 130;

      // Add Straws debts paid today table
      yPosition = addTable(
        "Straws Debts Paid Today",
        [
          { header: "CLIENT", dataKey: "client" },
          { header: "AMOUNT PAID TODAY (UGX)", dataKey: "paidToday" },
          { header: "BALANCE LEFT (UGX)", dataKey: "balanceLeft" }
        ],
        strawPaidTodayData,
        yPosition,
        'strawPayments'
      );

      // Add Toilet Paper debts paid today table
      yPosition = addTable(
        "Toilet Paper Debts Paid Today",
        [
          { header: "CLIENT", dataKey: "client" },
          { header: "AMOUNT PAID TODAY (UGX)", dataKey: "paidToday" },
          { header: "BALANCE LEFT (UGX)", dataKey: "balanceLeft" }
        ],
        toiletPaperPaidTodayData,
        yPosition,
        'toiletPaperPayments'
      );

      // Add Straws debts table
      yPosition = addTable(
        "Outstanding Straws Debts",
        [
          { header: "CLIENT", dataKey: "client" },
          { header: "DEBTS (UGX)", dataKey: "debtBalance" },
          { header: "UPDATED", dataKey: "updatedAt" }
        ],
        strawDebtsData,
        yPosition,
        'debts'
      );

      // Add Toilet Paper debts table
      yPosition = addTable(
        "Outstanding Toilet Paper Debts",
        [
          { header: "CLIENT", dataKey: "client" },
          { header: "DEBTS (UGX)", dataKey: "debtBalance" },
          { header: "UPDATED", dataKey: "updatedAt" }
        ],
        toiletPaperDebtsData,
        yPosition,
        'toiletPaperPayments'
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
      const fileName = `Outstanding_Debts_Report_${format(new Date(), "yyyy-MM-dd")}_RML.pdf`;
      doc.save(fileName);
      toast.success("Debts report generated successfully!");
      
    } catch (error) {
      console.error("Error generating debts report:", error);
      toast.error(`Failed to generate debts report: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  useImperativeHandle(ref, () => ({
    generateDebtsReport,
  }));

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-600">
        Loading debts data...
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
        Please log in to generate debts report.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Outstanding Debts Report</h2>
        <p className="text-slate-600">
          Generate a comprehensive PDF report of all outstanding debts by product category.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-teal-800 mb-1">Straws Debts</h3>
          <p className="text-2xl font-bold text-teal-600">{strawTotal.toLocaleString()} UGX</p>
          <p className="text-sm text-teal-700">{strawDebts.length} outstanding debt{strawDebts.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-1">Toilet Paper Debts</h3>
          <p className="text-2xl font-bold text-green-600">{toiletPaperTotal.toLocaleString()} UGX</p>
          <p className="text-sm text-green-700">{toiletPaperDebts.length} outstanding debt{toiletPaperDebts.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateDebtsReport}
        disabled={isGenerating || filteredDebts.length === 0}
        className="w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Generating Report...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>
              {filteredDebts.length === 0 ? 'No Debts to Report' : 'Generate Debts Report'}
            </span>
          </>
        )}
      </button>

      {filteredDebts.length === 0 && (
        <p className="text-center text-slate-500 mt-4 text-sm">
          No outstanding debts found. Add some debts to generate a report.
        </p>
      )}
    </div>
  );
};

export default forwardRef(DebtsReport);