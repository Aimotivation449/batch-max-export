import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem, BatchRow, SummaryData, Batch } from '@/types/inventory';
import { calculateFIFORate, calculateTotalReceived, calculateExpenditureBatches, calculateBalanceNextMonth } from './fifoCalculations';

/**
 * CRITICAL FIX: This function creates rows showing the maximum number of batches
 * If prev month has 5 batches and received has 3, we show 5 rows
 */
export function createBatchRows(item: InventoryItem, slNo: number): BatchRow[] {
  const prevBatches = item.prevMonth.batches || [];
  const receivedBatches = item.receivedThisMonth.batches || [];
  
  // Calculate expenditure and balance batches using FIFO
  const expenditureData = calculateExpenditureBatches(item);
  const expenditureBatches = expenditureData.batches;
  
  // Calculate balance batches
  let remainingExpenditure = item.expenditureThisMonth.qty;
  const balanceBatches: Batch[] = [];
  const allBatches = [
    ...(item.prevMonth.batches || []),
    ...(item.receivedThisMonth.batches || [])
  ];
  
  for (const batch of allBatches) {
    if (remainingExpenditure > 0) {
      const qtyUsed = Math.min(batch.qty, remainingExpenditure);
      remainingExpenditure -= qtyUsed;
      const remainingQty = batch.qty - qtyUsed;
      if (remainingQty > 0) {
        balanceBatches.push({
          id: batch.id,
          qty: remainingQty,
          rate: batch.rate
        });
      }
    } else {
      balanceBatches.push({ ...batch });
    }
  }
  
  // Total received batches (combination of prev + received)
  const totalReceivedBatches = [...prevBatches, ...receivedBatches];
  
  // Find maximum number of batches across all columns
  const maxBatches = Math.max(
    prevBatches.length,
    receivedBatches.length,
    totalReceivedBatches.length,
    expenditureBatches.length,
    balanceBatches.length,
    1 // At least 1 row
  );
  
  const rows: BatchRow[] = [];
  
  for (let i = 0; i < maxBatches; i++) {
    const prevBatch = prevBatches[i];
    const receivedBatch = receivedBatches[i];
    const totalReceivedBatch = totalReceivedBatches[i];
    const expenditureBatch = expenditureBatches[i];
    const balanceBatch = balanceBatches[i];
    
    rows.push({
      slNo: i === 0 ? slNo : 0,
      itemName: i === 0 ? item.name : '',
      unit: i === 0 ? item.unit : '',
      prevMonth: {
        qty: prevBatch ? prevBatch.qty.toFixed(2) : '',
        rate: prevBatch ? prevBatch.rate.toFixed(2) : '',
        amount: prevBatch ? (prevBatch.qty * prevBatch.rate).toFixed(2) : ''
      },
      receivedThisMonth: {
        qty: receivedBatch ? receivedBatch.qty.toFixed(2) : '',
        rate: receivedBatch ? receivedBatch.rate.toFixed(2) : '',
        amount: receivedBatch ? (receivedBatch.qty * receivedBatch.rate).toFixed(2) : ''
      },
      totalReceived: {
        qty: totalReceivedBatch ? totalReceivedBatch.qty.toFixed(2) : '',
        rate: totalReceivedBatch ? totalReceivedBatch.rate.toFixed(2) : '',
        amount: totalReceivedBatch ? (totalReceivedBatch.qty * totalReceivedBatch.rate).toFixed(2) : ''
      },
      expenditure: {
        qty: expenditureBatch ? expenditureBatch.qty.toFixed(2) : '',
        rate: expenditureBatch ? expenditureBatch.rate.toFixed(2) : '',
        amount: expenditureBatch ? (expenditureBatch.qty * expenditureBatch.rate).toFixed(2) : ''
      },
      balance: {
        qty: balanceBatch ? balanceBatch.qty.toFixed(2) : '',
        rate: balanceBatch ? balanceBatch.rate.toFixed(2) : '',
        amount: balanceBatch ? (balanceBatch.qty * balanceBatch.rate).toFixed(2) : ''
      }
    });
  }
  
  return rows;
}

export function calculateSummary(items: InventoryItem[]): SummaryData {
  let prevMonthTotal = { qty: 0, amount: 0 };
  let receivedThisMonthTotal = { qty: 0, amount: 0 };
  let totalReceivedTotal = { qty: 0, amount: 0 };
  let totalExpenditureTotal = { qty: 0, amount: 0 };
  let balanceNextMonthTotal = { qty: 0, amount: 0 };
  
  items.forEach(item => {
    // Previous month
    const prevBatches = item.prevMonth.batches || [];
    prevMonthTotal.qty += prevBatches.reduce((sum, b) => sum + b.qty, 0);
    prevMonthTotal.amount += prevBatches.reduce((sum, b) => sum + (b.qty * b.rate), 0);
    
    // Received this month
    const receivedBatches = item.receivedThisMonth.batches || [];
    receivedThisMonthTotal.qty += receivedBatches.reduce((sum, b) => sum + b.qty, 0);
    receivedThisMonthTotal.amount += receivedBatches.reduce((sum, b) => sum + (b.qty * b.rate), 0);
    
    // Total received
    const totalReceived = calculateTotalReceived(item);
    totalReceivedTotal.qty += totalReceived.qty;
    totalReceivedTotal.amount += totalReceived.amount;
    
    // Expenditure
    const expenditure = calculateExpenditureBatches(item);
    totalExpenditureTotal.qty += item.expenditureThisMonth.qty;
    totalExpenditureTotal.amount += expenditure.amount;
    
    // Balance
    const balance = calculateBalanceNextMonth(item);
    balanceNextMonthTotal.qty += balance.qty;
    balanceNextMonthTotal.amount += balance.amount;
  });
  
  return {
    prevMonthTotal,
    receivedThisMonthTotal,
    totalReceivedTotal,
    totalExpenditureTotal,
    balanceNextMonthTotal
  };
}

export function exportToExcel(items: InventoryItem[], monthName: string, editableSummary: any, rationData: any, attendanceData: any) {
  const wb = XLSX.utils.book_new();
  const summary = calculateSummary(items);
  
  // Read actual data from localStorage (source of truth)
  const storedSummary = localStorage.getItem('editable-summary');
  if (storedSummary) {
    editableSummary = JSON.parse(storedSummary);
  }
  
  // Calculate attendance data from current values like RationSection does
  const dryRationConsumed = summary.totalExpenditureTotal.amount;
  const freshRationConsumed = editableSummary.expendituresMonth || 0;
  const totalRationConsumed = dryRationConsumed + freshRationConsumed;
  const calculatedNetAmount = totalRationConsumed - (rationData.casualDiet || 0) - (rationData.riPerson || 0) - (rationData.baraKhana || 0);
  
  // Calculate current month's actual days
  const currentDate = new Date();
  const totalDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  // Update attendance data with calculated values
  attendanceData = {
    ...attendanceData,
    totalDaysMonth: totalDaysInMonth,
    netAttendance: (attendanceData.totalAttendance || 0) - (attendanceData.lessCasualAttendance || 0) - (attendanceData.lessRiAttendance || 0),
    perDayDietAmount: totalDaysInMonth > 0 ? (attendanceData.rmaPerMonth || 0) / totalDaysInMonth : 0,
    totalRationExpenditure: calculatedNetAmount,
    messProfit: (attendanceData.recoveryFromJawans || 0) - calculatedNetAmount
  };
  
  // Sheet 1: Main Inventory Table
  const mainData: any[][] = [];
  mainData.push(['FIFO INVENTORY MANAGEMENT SYSTEM']);
  mainData.push([]);
  mainData.push(['Month:', monthName]);
  mainData.push([]);
  mainData.push([
    'Sl No', 'Item Name', 'Unit',
    'Previous Month', '', '',
    'Received This Month', '', '',
    'Total Received', '', '',
    'Expenditure This Month', '', '',
    'Balance Next Month', '', ''
  ]);
  mainData.push([
    '', '', '',
    'Qty', 'Rate', 'Amount',
    'Qty', 'Rate', 'Amount',
    'Qty', 'Rate', 'Amount',
    'Qty', 'Rate', 'Amount',
    'Qty', 'Rate', 'Amount'
  ]);
  
  const startRow = mainData.length; // Track row numbers for styling
  
  items.forEach((item, index) => {
    const batchRows = createBatchRows(item, index + 1);
    
    batchRows.forEach((row) => {
      mainData.push([
        row.slNo || '',
        row.itemName,
        row.unit,
        row.prevMonth.qty,
        row.prevMonth.rate,
        row.prevMonth.amount,
        row.receivedThisMonth.qty,
        row.receivedThisMonth.rate,
        row.receivedThisMonth.amount,
        row.totalReceived.qty,
        row.totalReceived.rate,
        row.totalReceived.amount,
        row.expenditure.qty,
        row.expenditure.rate,
        row.expenditure.amount,
        row.balance.qty,
        row.balance.rate,
        row.balance.amount
      ]);
    });
    
    // Add separator row after each item (except last)
    if (index < items.length - 1) {
      mainData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    }
  });
  
  mainData.push([]);
  mainData.push([
    'GRAND TOTALS', '', '',
    summary.prevMonthTotal.qty.toFixed(2), '', summary.prevMonthTotal.amount.toFixed(2),
    summary.receivedThisMonthTotal.qty.toFixed(2), '', summary.receivedThisMonthTotal.amount.toFixed(2),
    summary.totalReceivedTotal.qty.toFixed(2), '', summary.totalReceivedTotal.amount.toFixed(2),
    summary.totalExpenditureTotal.qty.toFixed(2), '', summary.totalExpenditureTotal.amount.toFixed(2),
    summary.balanceNextMonthTotal.qty.toFixed(2), '', summary.balanceNextMonthTotal.amount.toFixed(2)
  ]);
  
  const wsMain = XLSX.utils.aoa_to_sheet(mainData);
  wsMain['!cols'] = [
    { width: 6 }, { width: 25 }, { width: 8 },
    { width: 10 }, { width: 10 }, { width: 12 },
    { width: 10 }, { width: 10 }, { width: 12 },
    { width: 10 }, { width: 10 }, { width: 12 },
    { width: 10 }, { width: 10 }, { width: 12 },
    { width: 10 }, { width: 10 }, { width: 12 }
  ];
  
  XLSX.utils.book_append_sheet(wb, wsMain, "Inventory Table");
  
  // Sheet 2: Summary - Side by Side Layout
  const summaryData: any[][] = [];
  summaryData.push(['INVENTORY SUMMARY REPORT', '', '', '']);
  summaryData.push([]);
  summaryData.push(['Month:', monthName, '', '']);
  summaryData.push([]);
  summaryData.push(['INVENTORY SUMMARY', '', 'ADDITIONAL SUMMARY', '']);
  summaryData.push(['Description', 'Amount (₹)', 'Description', 'Amount (₹)']);
  summaryData.push(['Previous Month Total', summary.prevMonthTotal.amount.toFixed(2), 'Previous month Fresh Received', editableSummary.prevMonthFresh.toFixed(2)]);
  summaryData.push(['Received This Month Total', summary.receivedThisMonthTotal.amount.toFixed(2), 'This month Fresh purchased', editableSummary.thisMonthPurchased.toFixed(2)]);
  summaryData.push(['Total Received This Month', summary.totalReceivedTotal.amount.toFixed(2), 'Total fresh purchased', editableSummary.totalFreshPurchased.toFixed(2)]);
  summaryData.push(['Total Expenditure This Month', summary.totalExpenditureTotal.amount.toFixed(2), 'Expenditures this month', editableSummary.expendituresMonth.toFixed(2)]);
  summaryData.push(['Balance Next Month', summary.balanceNextMonthTotal.amount.toFixed(2), 'Balance for next month', editableSummary.balanceNextMonth.toFixed(2)]);
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ width: 35 }, { width: 18 }, { width: 35 }, { width: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  
  // Sheet 3: Ration & Attendance - Side by Side Layout
  const rationSheetData: any[][] = [];
  rationSheetData.push(['RATION CONSUMPTION & ATTENDANCE REPORT', '', '', '']);
  rationSheetData.push([]);
  rationSheetData.push(['Month:', monthName, '', '']);
  rationSheetData.push([]);
  rationSheetData.push(['RATION CONSUMPTION CALCULATION', '', 'ATTENDANCE & DIET CALCULATION', '']);
  rationSheetData.push(['Description', 'Amount (₹)', 'Description', 'Value']);
  
  const totalRation = summary.totalExpenditureTotal.amount + editableSummary.expendituresMonth;
  const netAmount = totalRation - rationData.casualDiet - rationData.riPerson - rationData.baraKhana;
  
  rationSheetData.push(['DRY RATION CONSUMED', summary.totalExpenditureTotal.amount.toFixed(2), 'Total attendance', attendanceData.totalAttendance]);
  rationSheetData.push(['FRESH RATION CONSUMED', editableSummary.expendituresMonth.toFixed(2), 'LESS CASUAL ATTENDENCE', attendanceData.lessCasualAttendance]);
  rationSheetData.push(['TOTAL RATION CONSUMED', totalRation.toFixed(2), 'LESS RI ATTENDENCE', attendanceData.lessRiAttendance]);
  rationSheetData.push(['LESS CASUAL DIET AMOUNT', rationData.casualDiet.toFixed(2), 'NET ATTENDENCE', attendanceData.netAttendance]);
  rationSheetData.push(['LESS RI PERSON AMOUNT', rationData.riPerson.toFixed(2), 'TOTAL DAYS IN THIS MONTH', attendanceData.totalDaysMonth]);
  rationSheetData.push(['LESS BARA KHANA AMOUNT', rationData.baraKhana.toFixed(2), 'RMA PER MONTH (₹)', attendanceData.rmaPerMonth.toFixed(2)]);
  rationSheetData.push(['NET AMOUNT', netAmount.toFixed(2), 'PER DAY DIET-AMOUNT (₹)', attendanceData.perDayDietAmount.toFixed(2)]);
  rationSheetData.push(['', '', 'RECOVERY FROM JAWAN\'S (₹)', attendanceData.recoveryFromJawans.toFixed(2)]);
  rationSheetData.push(['', '', 'TOTAL RATION EXPENDITURED/MONTH (₹)', attendanceData.totalRationExpenditure.toFixed(2)]);
  rationSheetData.push(['', '', 'MESS PROFIT (₹)', attendanceData.messProfit.toFixed(2)]);
  
  const wsRation = XLSX.utils.aoa_to_sheet(rationSheetData);
  wsRation['!cols'] = [{ width: 35 }, { width: 18 }, { width: 40 }, { width: 20 }];
  XLSX.utils.book_append_sheet(wb, wsRation, "Ration & Attendance");
  
  XLSX.writeFile(wb, `FIFO_Inventory_${monthName.replace(/\s+/g, '_')}.xlsx`);
}

export function exportToPDF(items: InventoryItem[], monthName: string, editableSummary: any, rationData: any, attendanceData: any) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3'
  });
  
  const summary = calculateSummary(items);
  
  // Read actual data from localStorage (source of truth)
  const storedSummary = localStorage.getItem('editable-summary');
  if (storedSummary) {
    editableSummary = JSON.parse(storedSummary);
  }
  
  // Calculate attendance data from current values like RationSection does
  const dryRationConsumedPDF = summary.totalExpenditureTotal.amount;
  const freshRationConsumedPDF = editableSummary.expendituresMonth || 0;
  const totalRationConsumedPDF = dryRationConsumedPDF + freshRationConsumedPDF;
  const calculatedNetAmountPDF = totalRationConsumedPDF - (rationData.casualDiet || 0) - (rationData.riPerson || 0) - (rationData.baraKhana || 0);
  
  // Calculate current month's actual days
  const currentDate = new Date();
  const totalDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  // Update attendance data with calculated values
  attendanceData = {
    ...attendanceData,
    totalDaysMonth: totalDaysInMonth,
    netAttendance: (attendanceData.totalAttendance || 0) - (attendanceData.lessCasualAttendance || 0) - (attendanceData.lessRiAttendance || 0),
    perDayDietAmount: totalDaysInMonth > 0 ? (attendanceData.rmaPerMonth || 0) / totalDaysInMonth : 0,
    totalRationExpenditure: calculatedNetAmountPDF,
    messProfit: (attendanceData.recoveryFromJawans || 0) - calculatedNetAmountPDF
  };
  
  // Title Page
  doc.setFontSize(24);
  doc.text('FIFO INVENTORY MANAGEMENT SYSTEM', doc.internal.pageSize.width / 2, 50, { align: 'center' });
  doc.setFontSize(18);
  doc.text(`Report for ${monthName}`, doc.internal.pageSize.width / 2, 70, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width / 2, 85, { align: 'center' });
  
  // Inventory Table - Batch-wise display
  doc.addPage();
  doc.setFontSize(12);
  doc.text(`INVENTORY TABLE - ${monthName}`, 20, 20);
  
  const tableData: any[][] = [];
  let itemEndRows: number[] = []; // Track which rows are item ends
  let currentRow = 0;
  
  items.forEach((item, itemIndex) => {
    const batchRows = createBatchRows(item, itemIndex + 1);
    
    batchRows.forEach((row, batchIndex) => {
      tableData.push([
        batchIndex === 0 ? (itemIndex + 1).toString() : '',
        batchIndex === 0 ? item.name : '',
        batchIndex === 0 ? item.unit : '',
        row.prevMonth.qty,
        row.prevMonth.rate,
        row.prevMonth.amount,
        row.receivedThisMonth.qty,
        row.receivedThisMonth.rate,
        row.receivedThisMonth.amount,
        row.totalReceived.qty,
        row.totalReceived.rate,
        row.totalReceived.amount,
        row.expenditure.qty,
        row.expenditure.rate,
        row.expenditure.amount,
        row.balance.qty,
        row.balance.rate,
        row.balance.amount
      ]);
      currentRow++;
    });
    
    // Mark the last row of each item
    itemEndRows.push(currentRow - 1);
  });
  
  tableData.push([
    { content: 'GRAND TOTALS', colSpan: 3 },
    summary.prevMonthTotal.qty.toFixed(2), '', summary.prevMonthTotal.amount.toFixed(2),
    summary.receivedThisMonthTotal.qty.toFixed(2), '', summary.receivedThisMonthTotal.amount.toFixed(2),
    summary.totalReceivedTotal.qty.toFixed(2), '', summary.totalReceivedTotal.amount.toFixed(2),
    summary.totalExpenditureTotal.qty.toFixed(2), '', summary.totalExpenditureTotal.amount.toFixed(2),
    summary.balanceNextMonthTotal.qty.toFixed(2), '', summary.balanceNextMonthTotal.amount.toFixed(2)
  ]);
  
  autoTable(doc, {
    head: [[
      { content: 'Sl No', rowSpan: 2 },
      { content: 'Item Name', rowSpan: 2 },
      { content: 'Unit', rowSpan: 2 },
      { content: 'Previous Month', colSpan: 3 },
      { content: 'Received This Month', colSpan: 3 },
      { content: 'Total Received', colSpan: 3 },
      { content: 'Expenditure', colSpan: 3 },
      { content: 'Balance', colSpan: 3 }
    ], [
      '', '', '',
      'Qty', 'Rate', 'Amount',
      'Qty', 'Rate', 'Amount',
      'Qty', 'Rate', 'Amount',
      'Qty', 'Rate', 'Amount',
      'Qty', 'Rate', 'Amount'
    ]],
    body: tableData,
    startY: 25,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234], fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 7 },
    styles: { cellPadding: 1, valign: 'middle', lineWidth: 0.1 },
    columnStyles: {
      0: { halign: 'center', valign: 'middle' },
      1: { halign: 'left', valign: 'middle' },
      2: { halign: 'center', valign: 'middle' }
    },
    didDrawCell: function(data: any) {
      // Add thicker bottom border for item end rows
      if (data.section === 'body' && itemEndRows.includes(data.row.index)) {
        const doc = data.doc;
        doc.setLineWidth(0.8);
        doc.setDrawColor(0, 0, 0);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    }
  } as any);
  
  // Summary Page - Two columns side by side
  doc.addPage();
  doc.setFontSize(18);
  doc.text('SUMMARY REPORT', doc.internal.pageSize.width / 2, 15, { align: 'center' });
  
  const pageWidth = doc.internal.pageSize.width;
  const col1X = 15;
  const col2X = pageWidth / 2 + 5;
  const startY = 25;
  
  // Column 1: INVENTORY SUMMARY
  doc.setFontSize(12);
  doc.text('INVENTORY SUMMARY', col1X, startY);
  autoTable(doc, {
    startY: startY + 3,
    margin: { left: col1X, right: pageWidth / 2 + 10 },
    head: [['Description', 'Amount (₹)']],
    body: [
      ['Previous Month Total', summary.prevMonthTotal.amount.toFixed(2)],
      ['Received This Month', summary.receivedThisMonthTotal.amount.toFixed(2)],
      ['Total Received', summary.totalReceivedTotal.amount.toFixed(2)],
      ['Total Expenditure', summary.totalExpenditureTotal.amount.toFixed(2)],
      ['Balance Next Month', summary.balanceNextMonthTotal.amount.toFixed(2)]
    ],
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [102, 126, 234] }
  });
  
  // Column 2: ADDITIONAL SUMMARY
  doc.setFontSize(12);
  doc.text('ADDITIONAL SUMMARY', col2X, startY);
  autoTable(doc, {
    startY: startY + 3,
    margin: { left: col2X },
    head: [['Description', 'Amount (₹)']],
    body: [
      ['Prev Month Fresh', editableSummary.prevMonthFresh.toFixed(2)],
      ['This Month Purchased', editableSummary.thisMonthPurchased.toFixed(2)],
      ['Total Fresh Purchased', editableSummary.totalFreshPurchased.toFixed(2)],
      ['Expenditures', editableSummary.expendituresMonth.toFixed(2)],
      ['Balance Next Month', editableSummary.balanceNextMonth.toFixed(2)]
    ],
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [102, 126, 234] }
  });
  
  // Second row - RATION CONSUMPTION & ATTENDANCE side by side
  const firstRowY = Math.max((doc as any).lastAutoTable.finalY || startY + 50) + 15;
  
  // Column 1: RATION CONSUMPTION
  const totalRation = summary.totalExpenditureTotal.amount + editableSummary.expendituresMonth;
  const netAmount = totalRation - rationData.casualDiet - rationData.riPerson - rationData.baraKhana;
  
  doc.setFontSize(12);
  doc.text('RATION CONSUMPTION', col1X, firstRowY);
  autoTable(doc, {
    startY: firstRowY + 3,
    margin: { left: col1X, right: pageWidth / 2 + 10 },
    head: [['Description', 'Amount (₹)']],
    body: [
      ['DRY RATION', summary.totalExpenditureTotal.amount.toFixed(2)],
      ['FRESH RATION', editableSummary.expendituresMonth.toFixed(2)],
      ['TOTAL CONSUMED', totalRation.toFixed(2)],
      ['LESS CASUAL DIET', rationData.casualDiet.toFixed(2)],
      ['LESS RI PERSON', rationData.riPerson.toFixed(2)],
      ['LESS BARA KHANA', rationData.baraKhana.toFixed(2)],
      ['NET AMOUNT', netAmount.toFixed(2)]
    ],
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [102, 126, 234] }
  });
  
  // Column 2: ATTENDANCE & DIET CALCULATION
  doc.setFontSize(12);
  doc.text('ATTENDANCE & DIET CALCULATION', col2X, firstRowY);
  autoTable(doc, {
    startY: firstRowY + 3,
    margin: { left: col2X },
    head: [['Description', 'Value']],
    body: [
      ['Total attendance', attendanceData.totalAttendance.toString()],
      ['LESS CASUAL ATTENDENCE', attendanceData.lessCasualAttendance.toString()],
      ['LESS RI ATTENDENCE', attendanceData.lessRiAttendance.toString()],
      ['NET ATTENDENCE', attendanceData.netAttendance.toString()],
      ['TOTAL DAYS IN THIS MONTH', attendanceData.totalDaysMonth.toString()],
      ['RMA PER MONTH (₹)', attendanceData.rmaPerMonth.toFixed(2)],
      ['PER DAY DIET AMOUNT (₹)', attendanceData.perDayDietAmount.toFixed(2)],
      ['RECOVERY FROM JAWAN\'S (₹)', attendanceData.recoveryFromJawans.toFixed(2)],
      ['TOTAL RATION EXPENDITURE/MONTH (₹)', attendanceData.totalRationExpenditure.toFixed(2)],
      ['MESS PROFIT (₹)', attendanceData.messProfit.toFixed(2)]
    ],
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [102, 126, 234] }
  });
  
  doc.save(`FIFO_Inventory_${monthName.replace(/\s+/g, '_')}.pdf`);
}
