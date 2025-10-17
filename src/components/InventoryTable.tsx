import { InventoryItem, Batch } from '@/types/inventory';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Edit, X, Check } from 'lucide-react';
import { calculateFIFORate, calculateTotalReceived, calculateExpenditureBatches, calculateBalanceNextMonth } from '@/utils/fifoCalculations';
import { useState } from 'react';

interface InventoryTableProps {
  items: InventoryItem[];
  onUpdate: (updatedItems: InventoryItem[]) => void;
}

export function InventoryTable({ items, onUpdate }: InventoryTableProps) {
  const [batchInputs, setBatchInputs] = useState<{ [key: string]: { qty: string; rate: string } }>({});
  const [editingBatch, setEditingBatch] = useState<{ itemId: number; type: string; batchId: number } | null>(null);
  const [editValues, setEditValues] = useState<{ qty: string; rate: string }>({ qty: '', rate: '' });

  const updateItemName = (id: number, name: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, name } : item
    );
    onUpdate(updatedItems);
  };

  const updateUnit = (id: number, unit: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, unit } : item
    );
    onUpdate(updatedItems);
  };

  const addBatch = (itemId: number, type: 'prevMonth' | 'receivedThisMonth') => {
    const inputKey = `${itemId}-${type}`;
    const inputs = batchInputs[inputKey];
    
    if (!inputs?.qty || !inputs?.rate) {
      alert('Please enter both quantity and rate');
      return;
    }

    const qty = parseFloat(inputs.qty);
    const rate = parseFloat(inputs.rate);

    if (qty <= 0 || rate <= 0) {
      alert('Please enter valid positive numbers');
      return;
    }

    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const maxId = Math.max(0, ...item[type].batches.map(b => b.id));
        const newBatch: Batch = {
          id: maxId + 1,
          qty,
          rate
        };
        return {
          ...item,
          [type]: {
            batches: [...item[type].batches, newBatch]
          }
        };
      }
      return item;
    });

    onUpdate(updatedItems);
    setBatchInputs({ ...batchInputs, [inputKey]: { qty: '', rate: '' } });
  };

  const removeBatch = (itemId: number, type: 'prevMonth' | 'receivedThisMonth', batchId: number) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          [type]: {
            batches: item[type].batches.filter(b => b.id !== batchId)
          }
        };
      }
      return item;
    });
    onUpdate(updatedItems);
  };

  const startEditBatch = (itemId: number, type: string, batchId: number) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const batch = item[type === 'prevMonth' ? 'prevMonth' : 'receivedThisMonth'].batches.find(b => b.id === batchId);
      if (batch) {
        setEditingBatch({ itemId, type, batchId });
        setEditValues({ qty: batch.qty.toString(), rate: batch.rate.toString() });
      }
    }
  };

  const saveEditBatch = () => {
    if (!editingBatch) return;

    const qty = parseFloat(editValues.qty);
    const rate = parseFloat(editValues.rate);

    if (qty <= 0 || rate <= 0) {
      alert('Please enter valid positive numbers');
      return;
    }

    const updatedItems = items.map(item => {
      if (item.id === editingBatch.itemId) {
        const type = editingBatch.type as 'prevMonth' | 'receivedThisMonth';
        return {
          ...item,
          [type]: {
            batches: item[type].batches.map(b =>
              b.id === editingBatch.batchId ? { ...b, qty, rate } : b
            )
          }
        };
      }
      return item;
    });

    onUpdate(updatedItems);
    setEditingBatch(null);
  };

  const updateExpenditure = (itemId: number, qty: string) => {
    const expenditureQty = parseFloat(qty) || 0;
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, expenditureThisMonth: { qty: expenditureQty } } : item
    );
    onUpdate(updatedItems);
  };

  const deleteItem = (id: number) => {
    onUpdate(items.filter(item => item.id !== id));
  };

  const renderBatches = (batches: Batch[], type: 'qty' | 'rate' | 'amount', unit: string = '', itemId?: number, section?: string) => {
    if (!batches || batches.length === 0) {
      return <div className="text-xs text-muted-foreground">No batches</div>;
    }

    return (
      <div className="space-y-1 mt-1">
        {batches.map((batch) => {
          const isEditing = editingBatch?.itemId === itemId && editingBatch?.type === section && editingBatch?.batchId === batch.id;
          
          if (isEditing && type === 'amount') {
            return (
              <div key={batch.id} className="flex items-center gap-1 text-xs">
                <Input
                  type="number"
                  value={editValues.qty}
                  onChange={(e) => setEditValues({ ...editValues, qty: e.target.value })}
                  className="h-6 text-xs w-16"
                  step="0.01"
                />
                <Input
                  type="number"
                  value={editValues.rate}
                  onChange={(e) => setEditValues({ ...editValues, rate: e.target.value })}
                  className="h-6 text-xs w-16"
                  step="0.01"
                />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveEditBatch}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingBatch(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          }

          let value = '';
          switch (type) {
            case 'qty':
              value = `${batch.qty.toFixed(2)} ${unit}`;
              break;
            case 'rate':
              value = `₹${batch.rate.toFixed(2)}`;
              break;
            case 'amount':
              value = `₹${(batch.qty * batch.rate).toFixed(2)}`;
              break;
          }

          return (
            <div key={batch.id} className="flex items-center justify-between gap-1 text-xs">
              <span>{value}</span>
              {type === 'amount' && itemId && section && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => startEditBatch(itemId, section, batch.id)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive"
                    onClick={() => removeBatch(itemId, section as 'prevMonth' | 'receivedThisMonth', batch.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const summary = items.reduce(
    (acc, item) => {
      const prevQty = item.prevMonth.batches.reduce((sum, b) => sum + b.qty, 0);
      const prevAmount = item.prevMonth.batches.reduce((sum, b) => sum + b.qty * b.rate, 0);
      const recQty = item.receivedThisMonth.batches.reduce((sum, b) => sum + b.qty, 0);
      const recAmount = item.receivedThisMonth.batches.reduce((sum, b) => sum + b.qty * b.rate, 0);
      const totalReceived = calculateTotalReceived(item);
      const expenditure = calculateExpenditureBatches(item);
      const balance = calculateBalanceNextMonth(item);

      acc.prevMonthTotal.qty += prevQty;
      acc.prevMonthTotal.amount += prevAmount;
      acc.receivedThisMonthTotal.qty += recQty;
      acc.receivedThisMonthTotal.amount += recAmount;
      acc.totalReceivedTotal.qty += totalReceived.qty;
      acc.totalReceivedTotal.amount += totalReceived.amount;
      acc.totalExpenditureTotal.qty += item.expenditureThisMonth.qty;
      acc.totalExpenditureTotal.amount += expenditure.amount;
      acc.balanceNextMonthTotal.qty += balance.qty;
      acc.balanceNextMonthTotal.amount += balance.amount;

      return acc;
    },
    {
      prevMonthTotal: { qty: 0, amount: 0 },
      receivedThisMonthTotal: { qty: 0, amount: 0 },
      totalReceivedTotal: { qty: 0, amount: 0 },
      totalExpenditureTotal: { qty: 0, amount: 0 },
      balanceNextMonthTotal: { qty: 0, amount: 0 }
    }
  );

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden bg-background/95 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[1800px]">
          <thead>
            <tr className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <th rowSpan={2} className="border border-border/50 p-2 text-xs font-semibold">Sl No</th>
              <th rowSpan={2} className="border border-border/50 p-2 text-xs font-semibold">Item Name</th>
              <th rowSpan={2} className="border border-border/50 p-2 text-xs font-semibold">Unit</th>
              <th colSpan={3} className="border border-border/50 p-2 text-xs font-semibold bg-red-500/20">Previous Month</th>
              <th colSpan={3} className="border border-border/50 p-2 text-xs font-semibold bg-blue-500/20">Received This Month</th>
              <th colSpan={3} className="border border-border/50 p-2 text-xs font-semibold bg-purple-500/20">Total Received</th>
              <th colSpan={3} className="border border-border/50 p-2 text-xs font-semibold bg-red-500/20">Expenditure This Month</th>
              <th colSpan={3} className="border border-border/50 p-2 text-xs font-semibold bg-green-500/20">Balance Next Month</th>
              <th rowSpan={2} className="border border-border/50 p-2 text-xs font-semibold">Actions</th>
            </tr>
            <tr className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <th className="border border-border/50 p-1 text-xs">Qty</th>
              <th className="border border-border/50 p-1 text-xs">Rate</th>
              <th className="border border-border/50 p-1 text-xs">Amount</th>
              <th className="border border-border/50 p-1 text-xs">Qty</th>
              <th className="border border-border/50 p-1 text-xs">Rate</th>
              <th className="border border-border/50 p-1 text-xs">Amount</th>
              <th className="border border-border/50 p-1 text-xs">Qty</th>
              <th className="border border-border/50 p-1 text-xs">Rate</th>
              <th className="border border-border/50 p-1 text-xs">Amount</th>
              <th className="border border-border/50 p-1 text-xs">Qty</th>
              <th className="border border-border/50 p-1 text-xs">Rate</th>
              <th className="border border-border/50 p-1 text-xs">Amount</th>
              <th className="border border-border/50 p-1 text-xs">Qty</th>
              <th className="border border-border/50 p-1 text-xs">Rate</th>
              <th className="border border-border/50 p-1 text-xs">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const prevSummary = {
                qty: item.prevMonth.batches.reduce((sum, b) => sum + b.qty, 0),
                rate: calculateFIFORate(item.prevMonth.batches),
                amount: item.prevMonth.batches.reduce((sum, b) => sum + b.qty * b.rate, 0)
              };
              const recSummary = {
                qty: item.receivedThisMonth.batches.reduce((sum, b) => sum + b.qty, 0),
                rate: calculateFIFORate(item.receivedThisMonth.batches),
                amount: item.receivedThisMonth.batches.reduce((sum, b) => sum + b.qty * b.rate, 0)
              };
              const totalReceived = calculateTotalReceived(item);
              const expenditureData = calculateExpenditureBatches(item);
              const balanceData = calculateBalanceNextMonth(item);

              return (
                <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                  <td className="border border-border/50 p-2 text-center text-sm font-semibold">{index + 1}</td>
                  <td className="border border-border/50 p-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItemName(item.id, e.target.value)}
                      className="font-semibold"
                    />
                  </td>
                  <td className="border border-border/50 p-2">
                    <Select value={item.unit} onValueChange={(value) => updateUnit(item.id, value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="Ltr">Ltr</SelectItem>
                        <SelectItem value="PCS">PCS</SelectItem>
                        <SelectItem value="Pkt">Pkt</SelectItem>
                        <SelectItem value="Bag">Bag</SelectItem>
                        <SelectItem value="Btl">Btl</SelectItem>
                        <SelectItem value="Tin">Tin</SelectItem>
                        <SelectItem value="Grms">Grms</SelectItem>
                        <SelectItem value="Nos">Nos</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="Unit">Unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  
                  {/* Previous Month */}
                  <td className="border border-border/50 p-2 bg-red-50/50 dark:bg-red-950/20">
                    <div className="font-semibold text-sm">{prevSummary.qty.toFixed(2)} {item.unit}</div>
                    {renderBatches(item.prevMonth.batches, 'qty', item.unit)}
                    <Input
                      type="number"
                      placeholder="Qty"
                      className="mt-2 h-8 text-xs"
                      value={batchInputs[`${item.id}-prevMonth`]?.qty || ''}
                      onChange={(e) => setBatchInputs({
                        ...batchInputs,
                        [`${item.id}-prevMonth`]: { ...batchInputs[`${item.id}-prevMonth`], qty: e.target.value }
                      })}
                      step="0.01"
                    />
                  </td>
                  <td className="border border-border/50 p-2 bg-red-50/50 dark:bg-red-950/20">
                    <div className="font-semibold text-sm">₹{prevSummary.rate.toFixed(2)}</div>
                    {renderBatches(item.prevMonth.batches, 'rate')}
                    <Input
                      type="number"
                      placeholder="Rate"
                      className="mt-2 h-8 text-xs"
                      value={batchInputs[`${item.id}-prevMonth`]?.rate || ''}
                      onChange={(e) => setBatchInputs({
                        ...batchInputs,
                        [`${item.id}-prevMonth`]: { ...batchInputs[`${item.id}-prevMonth`], rate: e.target.value }
                      })}
                      step="0.01"
                    />
                  </td>
                  <td className="border border-border/50 p-2 bg-red-50/50 dark:bg-red-950/20">
                    <div className="font-semibold text-sm">₹{prevSummary.amount.toFixed(2)}</div>
                    {renderBatches(item.prevMonth.batches, 'amount', '', item.id, 'prevMonth')}
                    <Button
                      size="sm"
                      className="mt-2 h-8 text-xs"
                      onClick={() => addBatch(item.id, 'prevMonth')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Batch
                    </Button>
                  </td>

                  {/* Received This Month */}
                  <td className="border border-border/50 p-2 bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="font-semibold text-sm">{recSummary.qty.toFixed(2)} {item.unit}</div>
                    {renderBatches(item.receivedThisMonth.batches, 'qty', item.unit)}
                    <Input
                      type="number"
                      placeholder="Qty"
                      className="mt-2 h-8 text-xs"
                      value={batchInputs[`${item.id}-receivedThisMonth`]?.qty || ''}
                      onChange={(e) => setBatchInputs({
                        ...batchInputs,
                        [`${item.id}-receivedThisMonth`]: { ...batchInputs[`${item.id}-receivedThisMonth`], qty: e.target.value }
                      })}
                      step="0.01"
                    />
                  </td>
                  <td className="border border-border/50 p-2 bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="font-semibold text-sm">₹{recSummary.rate.toFixed(2)}</div>
                    {renderBatches(item.receivedThisMonth.batches, 'rate')}
                    <Input
                      type="number"
                      placeholder="Rate"
                      className="mt-2 h-8 text-xs"
                      value={batchInputs[`${item.id}-receivedThisMonth`]?.rate || ''}
                      onChange={(e) => setBatchInputs({
                        ...batchInputs,
                        [`${item.id}-receivedThisMonth`]: { ...batchInputs[`${item.id}-receivedThisMonth`], rate: e.target.value }
                      })}
                      step="0.01"
                    />
                  </td>
                  <td className="border border-border/50 p-2 bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="font-semibold text-sm">₹{recSummary.amount.toFixed(2)}</div>
                    {renderBatches(item.receivedThisMonth.batches, 'amount', '', item.id, 'receivedThisMonth')}
                    <Button
                      size="sm"
                      className="mt-2 h-8 text-xs"
                      onClick={() => addBatch(item.id, 'receivedThisMonth')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Batch
                    </Button>
                  </td>

                  {/* Total Received */}
                  <td className="border border-border/50 p-2 bg-purple-50/50 dark:bg-purple-950/20">
                    <div className="font-semibold text-sm">{totalReceived.qty.toFixed(2)} {item.unit}</div>
                  </td>
                  <td className="border border-border/50 p-2 bg-purple-50/50 dark:bg-purple-950/20">
                    <div className="font-semibold text-sm">₹{totalReceived.rate.toFixed(2)}</div>
                  </td>
                  <td className="border border-border/50 p-2 bg-purple-50/50 dark:bg-purple-950/20">
                    <div className="font-semibold text-sm">₹{totalReceived.amount.toFixed(2)}</div>
                  </td>

                  {/* Expenditure */}
                  <td className="border border-border/50 p-2 bg-red-50/50 dark:bg-red-950/20">
                    <div className="font-semibold text-sm">{item.expenditureThisMonth.qty.toFixed(2)} {item.unit}</div>
                    <Input
                      type="number"
                      placeholder="Enter Qty"
                      className="mt-2"
                      value={item.expenditureThisMonth.qty || ''}
                      onChange={(e) => updateExpenditure(item.id, e.target.value)}
                      step="0.01"
                    />
                  </td>
                  <td className="border border-border/50 p-2 bg-red-50/50 dark:bg-red-950/20">
                    <div className="font-semibold text-sm">₹{expenditureData.rate.toFixed(2)}</div>
                  </td>
                  <td className="border border-border/50 p-2 bg-red-50/50 dark:bg-red-950/20">
                    <div className="font-semibold text-sm">₹{expenditureData.amount.toFixed(2)}</div>
                  </td>

                  {/* Balance */}
                  <td className="border border-border/50 p-2 bg-green-50/50 dark:bg-green-950/20">
                    <div className="font-semibold text-sm">{balanceData.qty.toFixed(2)} {item.unit}</div>
                  </td>
                  <td className="border border-border/50 p-2 bg-green-50/50 dark:bg-green-950/20">
                    <div className="font-semibold text-sm">₹{balanceData.rate.toFixed(2)}</div>
                  </td>
                  <td className="border border-border/50 p-2 bg-green-50/50 dark:bg-green-950/20">
                    <div className="font-semibold text-sm">₹{balanceData.amount.toFixed(2)}</div>
                  </td>

                  <td className="border border-border/50 p-2 text-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold">
              <td colSpan={3} className="border border-border/50 p-3 text-center text-sm">GRAND TOTALS</td>
              <td className="border border-border/50 p-3 text-sm">{summary.prevMonthTotal.qty.toFixed(2)}</td>
              <td className="border border-border/50 p-3"></td>
              <td className="border border-border/50 p-3 text-sm">₹{summary.prevMonthTotal.amount.toFixed(2)}</td>
              <td className="border border-border/50 p-3 text-sm">{summary.receivedThisMonthTotal.qty.toFixed(2)}</td>
              <td className="border border-border/50 p-3"></td>
              <td className="border border-border/50 p-3 text-sm">₹{summary.receivedThisMonthTotal.amount.toFixed(2)}</td>
              <td className="border border-border/50 p-3 text-sm">{summary.totalReceivedTotal.qty.toFixed(2)}</td>
              <td className="border border-border/50 p-3"></td>
              <td className="border border-border/50 p-3 text-sm">₹{summary.totalReceivedTotal.amount.toFixed(2)}</td>
              <td className="border border-border/50 p-3 text-sm">{summary.totalExpenditureTotal.qty.toFixed(2)}</td>
              <td className="border border-border/50 p-3"></td>
              <td className="border border-border/50 p-3 text-sm">₹{summary.totalExpenditureTotal.amount.toFixed(2)}</td>
              <td className="border border-border/50 p-3 text-sm">{summary.balanceNextMonthTotal.qty.toFixed(2)}</td>
              <td className="border border-border/50 p-3"></td>
              <td className="border border-border/50 p-3 text-sm">₹{summary.balanceNextMonthTotal.amount.toFixed(2)}</td>
              <td className="border border-border/50 p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
