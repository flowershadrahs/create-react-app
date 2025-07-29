import React, { useState, useContext } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../logo.jpg";
import { DataContext } from '../../DataContext';

const DebtsReport = () => {
  const { user, debts, clients, products, loading, error } = useContext(DataContext);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDebtsReport = async () => {
    if (isGenerating || !user) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      const primary = [15, 23, 42];
      const secondary = [71, 85, 105];
      const background = [248, 250, 252];
      const border = [226, 232, 240];
      const footerSpace = 30;

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
        
        doc.setFillColor(31, 41, 55);
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
          doc.setFontSize(11);
          doc.setTextColor(...secondary);
          doc.text("No outstanding debts for this product", 15, startY + 15);
          return startY + 30;
        }

        const sectionColor = [255, 159, 64]; // Orange for debts
        const tableWidth = pageWidth - 30;

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
            fontSize: 12,
            fontStyle: "bold",
            halign: "left",
            cellPadding: { top: 7, right: 5, bottom: 7, left: 5 },
            lineWidth: 0,
            minCellHeight: 18,
          },
          bodyStyles: {
            fontSize: 11,
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
            fontSize: 11,
          },
        });

        let finalY = doc.lastAutoTable.finalY || startY + 30;
        return finalY + 20;
      };

      // Filter debts by product
      const strawDebts = debts.filter(debt => {
        const product = products.find(p => p.id === debt.productId);
        return product?.name === 'Straws';
      });

      const toiletPaperDebts = debts.filter(debt => {
        const product = products.find(p => p.id === debt.productId);
        return product?.name === 'Toilet Paper';
      });

      // Prepare data for tables
      const strawDebtsData = strawDebts.map((debt) => {
        const client = clients.find((c) => c.name === debt.client);
        return {
          client: client?.name || debt.client || "-",
          debtBalance: (parseFloat(debt.amount) || 0).toLocaleString(),
          createdAt: debt.createdAt ? format(debt.createdAt.toDate ? debt.createdAt.toDate() : new Date(debt.createdAt), "MMM dd, yyyy") : "-",
          updatedAt: debt.updatedAt ? format(debt.updatedAt.toDate ? debt.updatedAt.toDate() : new Date(debt.updatedAt), "MMM dd, yyyy") : "-",
          notes: debt.notes || "-"
        };
      });

      const toiletPaperDebtsData = toiletPaperDebts.map((debt) => {
        const client = clients.find((c) => c.name === debt.client);
        return {
          client: client?.name || debt.client || "-",
          debtBalance: (parseFloat(debt.amount) || 0).toLocaleString(),
          createdAt: debt.createdAt ? format(debt.createdAt.toDate ? debt.createdAt.toDate() : new Date(debt.createdAt), "MMM dd, yyyy") : "-",
          updatedAt: debt.updatedAt ? format(debt.updatedAt.toDate ? debt.updatedAt.toDate() : new Date(debt.updatedAt), "MMM dd, yyyy") : "-",
          notes: debt.notes || "-"
        };
      });

      // Calculate totals
      const strawTotal = strawDebts.reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);
      const toiletPaperTotal = toiletPaperDebts.reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);

      // Add total rows
      if (strawDebtsData.length > 0) {
        strawDebtsData.push({
          client: "TOTAL",
          debtBalance: strawTotal.toLocaleString(),
          createdAt: "",
          updatedAt: "",
          notes: ""
        });
      }

      if (toiletPaperDebtsData.length > 0) {
        toiletPaperDebtsData.push({
          client: "TOTAL",
          debtBalance: toiletPaperTotal.toLocaleString(),
          createdAt: "",
          updatedAt: "",
          notes: ""
        });
      }

      // Start generating PDF
      addHeader();
      let yPosition = 55;
      yPosition = addIntroductionCard(yPosition);

      // Add Straws debts table
      yPosition = addTable(
        "Outstanding Straws Debts",
        [
          { header: "CLIENT", dataKey: "client" },
          { header: "OUTSTANDING DEBT (UGX)", dataKey: "debtBalance" },
          { header: "CREATED", dataKey: "createdAt" },
          { header: "UPDATED", dataKey: "updatedAt" },
          { header: "NOTES", dataKey: "notes" }
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
          { header: "OUTSTANDING DEBT (UGX)", dataKey: "debtBalance" },
          { header: "CREATED", dataKey: "createdAt" },
          { header: "UPDATED", dataKey: "updatedAt" },
          { header: "NOTES", dataKey: "notes" }
        ],
        toiletPaperDebtsData,
        yPosition,
        'debts'
      );

      // Add summary section
      if (yPosition > pageHeight - footerSpace - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.roundedRect(15, yPosition, pageWidth - 30, 70, 4, 4, "FD");
      
      doc.setFillColor(220, 38, 38);
      doc.roundedRect(15, yPosition, pageWidth - 30, 20, 4, 4, "F");
      doc.rect(15, yPosition + 16, pageWidth - 30, 4, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("times", "bold");
      doc.text("DEBT SUMMARY", 20, yPosition + 13);
      
      const summaryY = yPosition + 35;
      
      doc.setTextColor(...primary);
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("Straws Total Outstanding:", 25, summaryY);
      doc.setTextColor(220, 38, 38);
      doc.text(`${strawTotal.toLocaleString()} UGX`, 25, summaryY + 12);
      
      doc.setTextColor(...primary);
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("Toilet Paper Total Outstanding:", pageWidth / 2 + 10, summaryY);
      doc.setTextColor(220, 38, 38);
      doc.text(`${toiletPaperTotal.toLocaleString()} UGX`, pageWidth / 2 + 10, summaryY + 12);
      
      doc.setTextColor(...primary);
      doc.setFontSize(16);
      doc.setFont("times", "bold");
      doc.text("GRAND TOTAL:", 25, summaryY + 30);
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(18);
      doc.text(`${(strawTotal + toiletPaperTotal).toLocaleString()} UGX`, 25, summaryY + 45);

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

  // Calculate totals for display
  const strawDebts = debts.filter(debt => {
    const product = products.find(p => p.id === debt.productId);
    return product?.name === 'Straws';
  });

  const toiletPaperDebts = debts.filter(debt => {
    const product = products.find(p => p.id === debt.productId);
    return product?.name === 'Toilet Paper';
  });

  const strawTotal = strawDebts.reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);
  const toiletPaperTotal = toiletPaperDebts.reduce((sum, debt) => sum + (parseFloat(debt.amount) || 0), 0);
  const grandTotal = strawTotal + toiletPaperTotal;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Outstanding Debts Report</h2>
        <p className="text-slate-600">
          Generate a comprehensive PDF report of all outstanding debts by product category.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-red-800 mb-1">Straws Debts</h3>
          <p className="text-2xl font-bold text-red-600">{strawTotal.toLocaleString()} UGX</p>
          <p className="text-sm text-red-700">{strawDebts.length} outstanding debt{strawDebts.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-orange-800 mb-1">Toilet Paper Debts</h3>
          <p className="text-2xl font-bold text-orange-600">{toiletPaperTotal.toLocaleString()} UGX</p>
          <p className="text-sm text-orange-700">{toiletPaperDebts.length} outstanding debt{toiletPaperDebts.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Total Outstanding</h3>
          <p className="text-2xl font-bold text-slate-700">{grandTotal.toLocaleString()} UGX</p>
          <p className="text-sm text-slate-600">{debts.length} total debt{debts.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateDebtsReport}
        disabled={isGenerating || debts.length === 0}
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
              {debts.length === 0 ? 'No Debts to Report' : 'Generate Debts Report'}
            </span>
          </>
        )}
      </button>

      {debts.length === 0 && (
        <p className="text-center text-slate-500 mt-4 text-sm">
          No outstanding debts found. Add some debts to generate a report.
        </p>
      )}
    </div>
  );
};

export default DebtsReport;