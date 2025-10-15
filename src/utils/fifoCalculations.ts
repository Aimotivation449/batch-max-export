import { Batch, InventoryItem } from '@/types/inventory';

export function calculateFIFORate(batches: Batch[]): number {
  if (!batches || batches.length === 0) return 0;
  const totalQty = batches.reduce((sum, batch) => sum + batch.qty, 0);
  const totalAmount = batches.reduce((sum, batch) => sum + (batch.qty * batch.rate), 0);
  return totalQty > 0 ? totalAmount / totalQty : 0;
}

export function calculateTotalReceived(item: InventoryItem) {
  const allBatches = [
    ...(item.prevMonth.batches || []),
    ...(item.receivedThisMonth.batches || [])
  ];
  
  const qty = allBatches.reduce((sum, batch) => sum + batch.qty, 0);
  const amount = allBatches.reduce((sum, batch) => sum + (batch.qty * batch.rate), 0);
  const rate = qty > 0 ? amount / qty : 0;
  
  return { qty, rate, amount };
}

export function calculateExpenditureBatches(item: InventoryItem) {
  const expenditureQty = item.expenditureThisMonth.qty;
  let remainingExpenditure = expenditureQty;
  const expenditureBatches: Batch[] = [];
  
  const allBatches = [
    ...(item.prevMonth.batches || []),
    ...(item.receivedThisMonth.batches || [])
  ];
  
  for (const batch of allBatches) {
    if (remainingExpenditure <= 0) break;
    
    const qtyToUse = Math.min(batch.qty, remainingExpenditure);
    expenditureBatches.push({
      id: batch.id,
      qty: qtyToUse,
      rate: batch.rate
    });
    remainingExpenditure -= qtyToUse;
  }
  
  const amount = expenditureBatches.reduce((sum, b) => sum + (b.qty * b.rate), 0);
  const rate = expenditureQty > 0 ? amount / expenditureQty : 0;
  
  return { batches: expenditureBatches, rate, amount };
}

export function calculateBalanceNextMonth(item: InventoryItem) {
  const totalReceived = calculateTotalReceived(item);
  const expenditureData = calculateExpenditureBatches(item);
  
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
  
  const qty = balanceBatches.reduce((sum, b) => sum + b.qty, 0);
  const amount = balanceBatches.reduce((sum, b) => sum + (b.qty * b.rate), 0);
  const rate = qty > 0 ? amount / qty : 0;
  
  return { qty, rate, amount };
}
