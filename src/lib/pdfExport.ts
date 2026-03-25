import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem, Category } from '../types';
import { formatTimestamp } from './inventoryUtils';

export const exportToPDF = (items: InventoryItem[]) => {
  const doc = new jsPDF();
  const timestamp = formatTimestamp(Date.now());

  // Add Title
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text('Alfonso Stock Inventory Report', 14, 22);

  // Add Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${timestamp}`, 14, 30);

  const categories: Category[] = ['Sauces', 'Syrups', 'Others', 'Lazada Supplies', 'S&R Supplies'];

  let currentY = 40;

  categories.forEach((category) => {
    const categoryItems = items.filter(item => item.category === category);
    
    if (categoryItems.length === 0) return;

    // Check if we need a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(category, 14, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Item Name', 'Quantity', 'Unit', 'Last Updated']],
      body: categoryItems.map(item => [
        item.name,
        item.quantity,
        item.unit,
        formatTimestamp(item.lastUpdated)
      ]),
      theme: 'striped',
      headStyles: { 
        fillColor: [61, 30, 20], // Coffee 900
        halign: 'center',
        fontSize: 10,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 40, halign: 'center' }
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data: any) => {
        currentY = data.cursor.y + 15;
      }
    });
  });

  doc.save(`Alfonso_Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
