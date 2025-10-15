import { useState, useEffect } from 'react';
import { InventoryItem } from '@/types/inventory';
import { InventoryTable } from '@/components/InventoryTable';
import { ItemDialog } from '@/components/ItemDialog';
import { Button } from '@/components/ui/button';
import { exportToExcel, exportToPDF, calculateSummary } from '@/utils/exportUtils';
import { Plus, FileDown, FileSpreadsheet, Calendar, Package } from 'lucide-react';
import { toast } from 'sonner';

const sampleItems: InventoryItem[] = [
  {
    id: 1,
    name: 'Basmati Rice',
    unit: 'KG',
    prevMonth: { 
      batches: [
        { id: 1, qty: 100, rate: 10 },
        { id: 2, qty: 50, rate: 12 },
        { id: 3, qty: 75, rate: 11 },
        { id: 4, qty: 60, rate: 10.5 },
        { id: 5, qty: 40, rate: 11.5 }
      ] 
    },
    receivedThisMonth: { 
      batches: [
        { id: 6, qty: 80, rate: 11 },
        { id: 7, qty: 90, rate: 11.2 },
        { id: 8, qty: 70, rate: 10.8 }
      ] 
    },
    expenditureThisMonth: { qty: 320 }
  },
  {
    id: 2,
    name: 'Olive Oil',
    unit: 'L',
    prevMonth: { 
      batches: [
        { id: 1, qty: 150, rate: 15 },
        { id: 2, qty: 100, rate: 15.5 }
      ] 
    },
    receivedThisMonth: { 
      batches: [
        { id: 3, qty: 100, rate: 16 },
        { id: 4, qty: 50, rate: 15.5 },
        { id: 5, qty: 75, rate: 16.2 }
      ] 
    },
    expenditureThisMonth: { qty: 280 }
  },
  {
    id: 3,
    name: 'Wheat Flour',
    unit: 'KG',
    prevMonth: { 
      batches: [
        { id: 1, qty: 75, rate: 8 },
        { id: 2, qty: 60, rate: 8.2 },
        { id: 3, qty: 50, rate: 7.8 }
      ] 
    },
    receivedThisMonth: { 
      batches: [
        { id: 4, qty: 125, rate: 8.5 }
      ] 
    },
    expenditureThisMonth: { qty: 210 }
  }
];

const Index = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('fifo-inventory');
    if (stored) {
      setItems(JSON.parse(stored));
    } else {
      setItems(sampleItems);
    }
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('fifo-inventory', JSON.stringify(items));
    }
  }, [items]);

  const handleSaveItem = (item: InventoryItem) => {
    if (editingItem) {
      setItems(items.map(i => i.id === item.id ? item : i));
      toast.success('Item updated successfully');
    } else {
      setItems([...items, item]);
      toast.success('Item added successfully');
    }
    setEditingItem(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(items.filter(i => i.id !== id));
      toast.success('Item deleted successfully');
    }
  };

  const handleExportExcel = () => {
    const monthName = new Date(currentMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    exportToExcel(items, monthName);
    toast.success('Excel exported successfully with maximum batch rows!');
  };

  const handleExportPDF = () => {
    const monthName = new Date(currentMonth).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    exportToPDF(items, monthName);
    toast.success('PDF exported successfully with maximum batch rows!');
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const summary = calculateSummary(items);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1900px] mx-auto space-y-6">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-4 glass-panel px-12 py-6 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
                Advanced FIFO Inventory
              </h1>
              <p className="text-muted-foreground">
                Professional Inventory Management with Enhanced Batch-Level Reporting
              </p>
            </div>
          </div>
        </header>

        {/* Controls */}
        <div className="glass-panel rounded-xl p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <label htmlFor="month" className="font-medium">Select Month:</label>
              <input
                type="month"
                id="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleAddNew} className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add New Item
              </Button>
              
              <Button onClick={handleExportExcel} variant="outline" className="border-success text-success hover:bg-success/10">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
              
              <Button onClick={handleExportPDF} variant="outline" className="border-accent text-accent hover:bg-accent/10">
                <FileDown className="w-4 h-4 mr-2" />
                Export to PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="glass-panel rounded-xl p-4 border-l-4 border-purple-500">
            <div className="text-sm text-muted-foreground mb-1">Previous Month Total</div>
            <div className="text-2xl font-bold">₹{summary.prevMonthTotal.amount.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{summary.prevMonthTotal.qty.toFixed(2)} units</div>
          </div>
          
          <div className="glass-panel rounded-xl p-4 border-l-4 border-pink-500">
            <div className="text-sm text-muted-foreground mb-1">Received This Month</div>
            <div className="text-2xl font-bold">₹{summary.receivedThisMonthTotal.amount.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{summary.receivedThisMonthTotal.qty.toFixed(2)} units</div>
          </div>
          
          <div className="glass-panel rounded-xl p-4 border-l-4 border-cyan-500">
            <div className="text-sm text-muted-foreground mb-1">Total Received</div>
            <div className="text-2xl font-bold">₹{summary.totalReceivedTotal.amount.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{summary.totalReceivedTotal.qty.toFixed(2)} units</div>
          </div>
          
          <div className="glass-panel rounded-xl p-4 border-l-4 border-orange-500">
            <div className="text-sm text-muted-foreground mb-1">Total Expenditure</div>
            <div className="text-2xl font-bold">₹{summary.totalExpenditureTotal.amount.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{summary.totalExpenditureTotal.qty.toFixed(2)} units</div>
          </div>
          
          <div className="glass-panel rounded-xl p-4 border-l-4 border-green-500">
            <div className="text-sm text-muted-foreground mb-1">Balance Next Month</div>
            <div className="text-2xl font-bold">₹{summary.balanceNextMonthTotal.amount.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{summary.balanceNextMonthTotal.qty.toFixed(2)} units</div>
          </div>
        </div>

        {/* Table */}
        {items.length > 0 ? (
          <InventoryTable items={items} onEdit={handleEdit} onDelete={handleDelete} />
        ) : (
          <div className="glass-panel rounded-xl p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-6">Add your first inventory item to get started</p>
            <Button onClick={handleAddNew} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </div>
        )}

        {/* Dialog */}
        <ItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={editingItem}
          onSave={handleSaveItem}
        />

        {/* Info Note */}
        <div className="glass-panel rounded-xl p-6 border-l-4 border-primary">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Export Feature Note
          </h3>
          <p className="text-sm text-muted-foreground">
            ✨ <strong>Batch-Level Export:</strong> When you export to Excel or PDF, the system will display the <strong>maximum number of batch rows</strong> for each item. 
            For example, if Previous Month has 5 batches and Received This Month has 3 batches, the export will show 5 rows for that item, 
            ensuring all batch details are visible with proper alignment across columns.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
