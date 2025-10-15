import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem, BatchRow, SummaryData } from '@/types/inventory';
import { calculateFIFORate, calculateTotalReceived, calculateExpenditureBatches, calculateBalanceNextMonth } from './fifoCalculations';

/**
 * CRITICAL FIX: This function creates rows showing the maximum number of batches
 * If prev month has 5 batches and received has 3, we show 5 rows
 */
export function createBatchRows(item: InventoryItem, slNo: number): BatchRow[] {
  const prevBatches = item.prevMonth.batches || [];
  const receivedBatches = item.receivedThisMonth.batches || [];
  
  // Key fix: Use the maximum number of batches
  const maxBatches = Math.max(prevBatches.length, receivedBatches.length);
  
  if (maxBatches === 0) {
    // No batches at all, return single row with zeros
    return [{
      slNo,
      itemName: item.name,
      unit: item.unit,
      prevMonth: { qty: '0.00', rate: '0.00', amount: '0.00' },
      receivedThisMonth: { qty: '0.00', rate: '0.00', amount: '0.00' },
      totalReceived: { qty: '0.00', rate: '0.00', amount: '0.00' },
      expenditure: { qty: '0.00', rate: '0.00', amount: '0.00' },
      balance: { qty: '0.00', rate: '0.00', amount: '0.00' }
    }];
  }
  
  const rows: BatchRow[] = [];
  
  // Calculate totals for expenditure and balance (shown only in first row)
  const totalReceived = calculateTotalReceived(item);
  const expenditureData = calculateExpenditureBatches(item);
  const balanceData = calculateBalanceNextMonth(item);
  
  for (let i = 0; i < maxBatches; i++) {
    const prevBatch = prevBatches[i];
    const receivedBatch = receivedBatches[i];
    
    // Calculate total received for this row (sum of prev + received batch)
    const rowTotalQty = (prevBatch?.qty || 0) + (receivedBatch?.qty || 0);
    const rowTotalAmount = ((prevBatch?.qty || 0) * (prevBatch?.rate || 0)) + 
                           ((receivedBatch?.qty || 0) * (receivedBatch?.rate || 0));
    const rowTotalRate = rowTotalQty > 0 ? rowTotalAmount / rowTotalQty : 0;
    
    rows.push({
      slNo: i === 0 ? slNo : 0, // Only show sl no in first row
      itemName: i === 0 ? item.name : '', // Only show name in first row
      unit: i === 0 ? item.unit : '', // Only show unit in first row
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
        qty: rowTotalQty > 0 ? rowTotalQty.toFixed(2) : '',
        rate: rowTotalRate > 0 ? rowTotalRate.toFixed(2) : '',
        amount: rowTotalAmount > 0 ? rowTotalAmount.toFixed(2) : ''
      },
      // Show expenditure and balance only in first row
      expenditure: i === 0 ? {
        qty: item.expenditureThisMonth.qty.toFixed(2),
        rate: expenditureData.rate.toFixed(2),
        amount: expenditureData.amount.toFixed(2)
      } : { qty: '', rate: '', amount: '' },
      balance: i === 0 ? {
        qty: balanceData.qty.toFixed(2),
        rate: balanceData.rate.toFixed(2),
        amount: balanceData.amount.toFixed(2)
      } : { qty: '', rate: '', amount: '' }
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

export function exportToExcel(items: InventoryItem[], monthName: string) {
  const wb = XLSX.utils.book_new();
  
  // Create main table with batch rows
  const data: any[][] = [];
  
  // Headers
  data.push(['FIFO INVENTORY MANAGEMENT SYSTEM']);
  data.push(['Month:', monthName]);
  data.push([]);
  data.push([
    'Sl No', 'Item Name', 'Unit',
    'Previous Month', '', '',
    'Received This Month', '', '',
    'Total Received', '', '',
    'Expenditure This Month', '', '',
    'Balance Next Month', '', ''
  ]);
  data.push([
    '', '', '',
    'Qty', 'Rate', 'Amount',
    'Qty', 'Rate', 'Amount',
    'Qty', 'Rate', 'Amount',
    'Qty', 'Rate', 'Amount',
    'Qty', 'Rate', 'Amount'
  ]);
  
  // Add data rows - with maximum batches per item
  items.forEach((item, index) => {
    const batchRows = createBatchRows(item, index + 1);
    batchRows.forEach(row => {
      data.push([
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
  });
  
  // Add totals
  const summary = calculateSummary(items);
  data.push([]);
  data.push([
    'GRAND TOTALS', '', '',
    summary.prevMonthTotal.qty.toFixed(2), '', summary.prevMonthTotal.amount.toFixed(2),
    summary.receivedThisMonthTotal.qty.toFixed(2), '', summary.receivedThisMonthTotal.amount.toFixed(2),
    summary.totalReceivedTotal.qty.toFixed(2), '', summary.totalReceivedTotal.amount.toFixed(2),
    summary.totalExpenditureTotal.qty.toFixed(2), '', summary.totalExpenditureTotal.amount.toFixed(2),
    summary.balanceNextMonthTotal.qty.toFixed(2), '', summary.balanceNextMonthTotal.amount.toFixed(2)
  ]);
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { width: 6 }, { width: 25 }, { width: 8 },
    { width: 10 }, { width: 10 }, { width: 12 },
    { width: 10 }, { width: 10 }, { width: 12 },
    { width: 10 }, { width: 10 }, { width: 12 },
    { width: 10 }, { width: 10 }, { width: 12 },
    { width: 10 }, { width: 10 }, { width: 12 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  XLSX.writeFile(wb, `FIFO_Inventory_${monthName.replace(/\s+/g, '_')}.xlsx`);
}

export function exportToPDF(items: InventoryItem[], monthName: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3'
  });
  
  // Title
  doc.setFontSize(20);
  doc.text('FIFO Inventory Management System', doc.internal.pageSize.width / 2, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Month: ${monthName}`, doc.internal.pageSize.width / 2, 30, { align: 'center' });
  
  // Prepare table data with batch rows
  const tableData: any[][] = [];
  
  items.forEach((item, index) => {
    const batchRows = createBatchRows(item, index + 1);
    batchRows.forEach(row => {
      tableData.push([
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
  });
  
  // Add totals
  const summary = calculateSummary(items);
  tableData.push([
    'TOTALS', '', '',
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
    startY: 40,
    theme: 'grid',
    headStyles: { fillColor: [102, 126, 234], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    styles: { cellPadding: 1 }
  });
  
  doc.save(`FIFO_Inventory_${monthName.replace(/\s+/g, '_')}.pdf`);
}
