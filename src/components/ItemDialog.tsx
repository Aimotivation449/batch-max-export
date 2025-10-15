import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { InventoryItem, Batch } from '@/types/inventory';
import { Plus, Trash2 } from 'lucide-react';

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSave: (item: InventoryItem) => void;
}

export function ItemDialog({ open, onOpenChange, item, onSave }: ItemDialogProps) {
  const [formData, setFormData] = useState<InventoryItem>({
    id: 0,
    name: '',
    unit: 'KG',
    prevMonth: { batches: [] },
    receivedThisMonth: { batches: [] },
    expenditureThisMonth: { qty: 0 }
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        id: Date.now(),
        name: '',
        unit: 'KG',
        prevMonth: { batches: [] },
        receivedThisMonth: { batches: [] },
        expenditureThisMonth: { qty: 0 }
      });
    }
  }, [item, open]);

  const addBatch = (type: 'prevMonth' | 'receivedThisMonth') => {
    const newBatch: Batch = {
      id: Date.now(),
      qty: 0,
      rate: 0
    };
    
    setFormData(prev => ({
      ...prev,
      [type]: {
        batches: [...prev[type].batches, newBatch]
      }
    }));
  };

  const updateBatch = (type: 'prevMonth' | 'receivedThisMonth', index: number, field: 'qty' | 'rate', value: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        batches: prev[type].batches.map((batch, i) => 
          i === index ? { ...batch, [field]: value } : batch
        )
      }
    }));
  };

  const removeBatch = (type: 'prevMonth' | 'receivedThisMonth', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        batches: prev[type].batches.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-primary bg-clip-text text-transparent">
            {item ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Basmati Rice"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., KG, L"
              />
            </div>
          </div>

          {/* Previous Month Batches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Previous Month Batches</Label>
              <Button
                type="button"
                size="sm"
                onClick={() => addBatch('prevMonth')}
                className="gradient-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Batch
              </Button>
            </div>
            {formData.prevMonth.batches.map((batch, index) => (
              <div key={batch.id} className="grid grid-cols-3 gap-3 p-3 glass-panel rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={batch.qty}
                    onChange={(e) => updateBatch('prevMonth', index, 'qty', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rate (₹)</Label>
                  <Input
                    type="number"
                    value={batch.rate}
                    onChange={(e) => updateBatch('prevMonth', index, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeBatch('prevMonth', index)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Received This Month Batches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Received This Month Batches</Label>
              <Button
                type="button"
                size="sm"
                onClick={() => addBatch('receivedThisMonth')}
                className="gradient-secondary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Batch
              </Button>
            </div>
            {formData.receivedThisMonth.batches.map((batch, index) => (
              <div key={batch.id} className="grid grid-cols-3 gap-3 p-3 glass-panel rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={batch.qty}
                    onChange={(e) => updateBatch('receivedThisMonth', index, 'qty', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rate (₹)</Label>
                  <Input
                    type="number"
                    value={batch.rate}
                    onChange={(e) => updateBatch('receivedThisMonth', index, 'rate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeBatch('receivedThisMonth', index)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Expenditure */}
          <div className="space-y-2">
            <Label htmlFor="expenditure">Expenditure This Month (Quantity)</Label>
            <Input
              id="expenditure"
              type="number"
              value={formData.expenditureThisMonth.qty}
              onChange={(e) => setFormData({
                ...formData,
                expenditureThisMonth: { qty: parseFloat(e.target.value) || 0 }
              })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gradient-primary">
            Save Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
