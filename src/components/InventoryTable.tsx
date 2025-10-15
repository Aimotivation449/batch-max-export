import { InventoryItem } from '@/types/inventory';
import { calculateFIFORate, calculateTotalReceived, calculateExpenditureBatches, calculateBalanceNextMonth } from '@/utils/fifoCalculations';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: number) => void;
}

export function InventoryTable({ items, onEdit, onDelete }: InventoryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl glass-panel">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th rowSpan={2} className="border border-white/20 px-3 py-2">Sl No</th>
            <th rowSpan={2} className="border border-white/20 px-3 py-2">Item Name</th>
            <th rowSpan={2} className="border border-white/20 px-3 py-2">Unit</th>
            <th colSpan={3} className="border border-white/20 px-3 py-2 bg-purple-600">Previous Month</th>
            <th colSpan={3} className="border border-white/20 px-3 py-2 bg-pink-600">Received This Month</th>
            <th colSpan={3} className="border border-white/20 px-3 py-2 bg-cyan-600">Total Received</th>
            <th colSpan={3} className="border border-white/20 px-3 py-2 bg-orange-600">Expenditure This Month</th>
            <th colSpan={3} className="border border-white/20 px-3 py-2 bg-green-600">Balance Next Month</th>
            <th rowSpan={2} className="border border-white/20 px-3 py-2">Actions</th>
          </tr>
          <tr className="bg-primary text-primary-foreground">
            {/* Previous Month */}
            <th className="border border-white/20 px-2 py-1 text-xs">Qty</th>
            <th className="border border-white/20 px-2 py-1 text-xs">Rate</th>
            <th className="border border-white/20 px-2 py-1 text-xs">Amount</th>
            {/* Received This Month */}
            <th className="border border-white/20 px-2 py-1 text-xs">Qty</th>
            <th className="border border-white/20 px-2 py-1 text-xs">Rate</th>
            <th className="border border-white/20 px-2 py-1 text-xs">Amount</th>
            {/* Total Received */}
            <th className="border border-white/20 px-2 py-1 text-xs">Qty</th>
            <th className="border border-white/20 px-2 py-1 text-xs">Rate</th>
            <th className="border border-white/20 px-2 py-1 text-xs">Amount</th>
            {/* Expenditure */}
            <th className="border border-white/20 px-2 py-1 text-xs">Qty</th>
            <th className="border border-white/20 px-2 py-1 text-xs">Rate</th>
            <th className="border border-white/20 px-2 py-1 text-xs">Amount</th>
            {/* Balance */}
            <th className="border border-white/20 px-2 py-1 text-xs">Qty</th>
            <th className="border border-white/20 px-2 py-1 text-xs">Rate</th>
            <th className="border border-white/20 px-2 py-1 text-xs">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const prevMonthSummary = {
              qty: (item.prevMonth.batches || []).reduce((sum, batch) => sum + batch.qty, 0),
              rate: calculateFIFORate(item.prevMonth.batches || []),
              amount: (item.prevMonth.batches || []).reduce((sum, batch) => sum + (batch.qty * batch.rate), 0)
            };

            const receivedSummary = {
              qty: (item.receivedThisMonth.batches || []).reduce((sum, batch) => sum + batch.qty, 0),
              rate: calculateFIFORate(item.receivedThisMonth.batches || []),
              amount: (item.receivedThisMonth.batches || []).reduce((sum, batch) => sum + (batch.qty * batch.rate), 0)
            };

            const totalReceived = calculateTotalReceived(item);
            const expenditureData = calculateExpenditureBatches(item);
            const balanceNextMonth = calculateBalanceNextMonth(item);

            return (
              <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                <td className="border border-border px-3 py-2 text-center">{index + 1}</td>
                <td className="border border-border px-3 py-2 font-medium">{item.name}</td>
                <td className="border border-border px-3 py-2 text-center">{item.unit}</td>
                
                {/* Previous Month */}
                <td className="border border-border px-3 py-2 text-right">{prevMonthSummary.qty.toFixed(2)}</td>
                <td className="border border-border px-3 py-2 text-right">₹{prevMonthSummary.rate.toFixed(2)}</td>
                <td className="border border-border px-3 py-2 text-right">₹{prevMonthSummary.amount.toFixed(2)}</td>
                
                {/* Received This Month */}
                <td className="border border-border px-3 py-2 text-right">{receivedSummary.qty.toFixed(2)}</td>
                <td className="border border-border px-3 py-2 text-right">₹{receivedSummary.rate.toFixed(2)}</td>
                <td className="border border-border px-3 py-2 text-right">₹{receivedSummary.amount.toFixed(2)}</td>
                
                {/* Total Received */}
                <td className="border border-border px-3 py-2 text-right">{totalReceived.qty.toFixed(2)}</td>
                <td className="border border-border px-3 py-2 text-right">₹{totalReceived.rate.toFixed(2)}</td>
                <td className="border border-border px-3 py-2 text-right">₹{totalReceived.amount.toFixed(2)}</td>
                
                {/* Expenditure */}
                <td className="border border-border px-3 py-2 text-right">{item.expenditureThisMonth.qty.toFixed(2)}</td>
                <td className="border border-border px-3 py-2 text-right">₹{expenditureData.rate.toFixed(2)}</td>
                <td className="border border-border px-3 py-2 text-right">₹{expenditureData.amount.toFixed(2)}</td>
                
                {/* Balance */}
                <td className="border border-border px-3 py-2 text-right">{balanceNextMonth.qty.toFixed(2)}</td>
                <td className="border border-border px-3 py-2 text-right">₹{balanceNextMonth.rate.toFixed(2)}</td>
                <td className="border border-border px-3 py-2 text-right">₹{balanceNextMonth.amount.toFixed(2)}</td>
                
                <td className="border border-border px-3 py-2">
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
