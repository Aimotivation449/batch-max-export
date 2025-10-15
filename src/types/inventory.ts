export interface Batch {
  id: number;
  qty: number;
  rate: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  prevMonth: {
    batches: Batch[];
  };
  receivedThisMonth: {
    batches: Batch[];
  };
  expenditureThisMonth: {
    qty: number;
  };
}

export interface BatchRow {
  slNo: number;
  itemName: string;
  unit: string;
  prevMonth: { qty: string; rate: string; amount: string };
  receivedThisMonth: { qty: string; rate: string; amount: string };
  totalReceived: { qty: string; rate: string; amount: string };
  expenditure: { qty: string; rate: string; amount: string };
  balance: { qty: string; rate: string; amount: string };
}

export interface SummaryData {
  prevMonthTotal: { qty: number; amount: number };
  receivedThisMonthTotal: { qty: number; amount: number };
  totalReceivedTotal: { qty: number; amount: number };
  totalExpenditureTotal: { qty: number; amount: number };
  balanceNextMonthTotal: { qty: number; amount: number };
}
