import { useState, useEffect } from 'react';
import { SummaryData } from '@/types/inventory';
import { Edit, Save } from 'lucide-react';

interface SummarySectionProps {
  summary: SummaryData;
}

export function SummarySection({ summary }: SummarySectionProps) {
  const [editableSummary, setEditableSummary] = useState({
    prevMonthFresh: 9000,
    thisMonthPurchased: 8000,
    totalFreshPurchased: 17000,
    expendituresMonth: 12000,
    balanceNextMonth: 5000
  });

  useEffect(() => {
    const stored = localStorage.getItem('editable-summary');
    if (stored) {
      setEditableSummary(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const totalFresh = editableSummary.prevMonthFresh + editableSummary.thisMonthPurchased;
    const balance = totalFresh - editableSummary.expendituresMonth;
    setEditableSummary(prev => ({
      ...prev,
      totalFreshPurchased: totalFresh,
      balanceNextMonth: balance
    }));
  }, [editableSummary.prevMonthFresh, editableSummary.thisMonthPurchased, editableSummary.expendituresMonth]);

  const handleSave = () => {
    localStorage.setItem('editable-summary', JSON.stringify(editableSummary));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calculated Summary */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 gradient-primary bg-clip-text text-transparent">
          <i className="fas fa-calculator"></i>
          Inventory Summary (Calculated)
        </h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border-l-4 border-red-500">
            <span className="font-semibold">Previous Month Total:</span>
            <div className="text-right">
              <div className="font-bold">₹{summary.prevMonthTotal.amount.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{summary.prevMonthTotal.qty.toFixed(2)} units</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
            <span className="font-semibold">Received This Month Total:</span>
            <div className="text-right">
              <div className="font-bold">₹{summary.receivedThisMonthTotal.amount.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{summary.receivedThisMonthTotal.qty.toFixed(2)} units</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-500">
            <span className="font-semibold">Total Received This Month:</span>
            <div className="text-right">
              <div className="font-bold">₹{summary.totalReceivedTotal.amount.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{summary.totalReceivedTotal.qty.toFixed(2)} units</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-orange-500">
            <span className="font-semibold">Total Expenditure This Month:</span>
            <div className="text-right">
              <div className="font-bold">₹{summary.totalExpenditureTotal.amount.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{summary.totalExpenditureTotal.qty.toFixed(2)} units</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
            <span className="font-semibold">Balance Next Month:</span>
            <div className="text-right">
              <div className="font-bold">₹{summary.balanceNextMonthTotal.amount.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{summary.balanceNextMonthTotal.qty.toFixed(2)} units</div>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Summary */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 gradient-secondary bg-clip-text text-transparent">
          <Edit className="w-5 h-5" />
          Additional Summary (Editable)
        </h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="prev-month-fresh" className="font-medium text-sm">
              1. Previous month Fresh Received:
            </label>
            <input
              type="number"
              id="prev-month-fresh"
              value={editableSummary.prevMonthFresh}
              onChange={(e) => setEditableSummary({ ...editableSummary, prevMonthFresh: parseFloat(e.target.value) || 0 })}
              className="px-4 py-2 rounded-lg border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="this-month-purchased" className="font-medium text-sm">
              2. This month Fresh purchased:
            </label>
            <input
              type="number"
              id="this-month-purchased"
              value={editableSummary.thisMonthPurchased}
              onChange={(e) => setEditableSummary({ ...editableSummary, thisMonthPurchased: parseFloat(e.target.value) || 0 })}
              className="px-4 py-2 rounded-lg border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="total-fresh-purchased" className="font-medium text-sm">
              3. Total fresh purchased:
            </label>
            <input
              type="number"
              id="total-fresh-purchased"
              value={editableSummary.totalFreshPurchased}
              readOnly
              className="px-4 py-2 rounded-lg border-2 border-border bg-muted cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="expenditures-month" className="font-medium text-sm">
              4. Expenditures this month:
            </label>
            <input
              type="number"
              id="expenditures-month"
              value={editableSummary.expendituresMonth}
              onChange={(e) => setEditableSummary({ ...editableSummary, expendituresMonth: parseFloat(e.target.value) || 0 })}
              className="px-4 py-2 rounded-lg border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="balance-next-month" className="font-medium text-sm">
              5. Balance for next month:
            </label>
            <input
              type="number"
              id="balance-next-month"
              value={editableSummary.balanceNextMonth}
              readOnly
              className="px-4 py-2 rounded-lg border-2 border-border bg-muted cursor-not-allowed"
            />
          </div>

          <button onClick={handleSave} className="btn-gradient-primary w-full mt-4">
            <Save className="w-4 h-4" />
            Save Summary
          </button>
        </div>
      </div>
    </div>
  );
}
