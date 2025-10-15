import { useState, useEffect } from 'react';
import { InventoryItem } from '@/types/inventory';
import { InventoryTable } from '@/components/InventoryTable';
import { ItemDialog } from '@/components/ItemDialog';
import { SummarySection } from '@/components/SummarySection';
import { RationSection } from '@/components/RationSection';
import { exportToExcel, exportToPDF, calculateSummary } from '@/utils/exportUtils';
import { Plus, FileDown, FileSpreadsheet, Calendar, Package, Upload } from 'lucide-react';
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
  },
  {
    id: 4,
    name: 'Mineral Water',
    unit: 'L',
    prevMonth: { 
      batches: [
        { id: 1, qty: 200, rate: 0.5 }
      ]
    },
    receivedThisMonth: { 
      batches: [
        { id: 2, qty: 300, rate: 0.55 }
      ] 
    },
    expenditureThisMonth: { qty: 350 }
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
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-width mx-auto space-y-6">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-4 glass-panel px-8 md:px-12 py-6 rounded-3xl">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full gradient-primary flex items-center justify-center shadow-lg animate-float">
              <Package className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl md:text-4xl font-bold gradient-primary bg-clip-text text-transparent">
                Advanced FIFO Inventory
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Professional Inventory Management with Enhanced Reporting
              </p>
            </div>
          </div>
        </header>

        {/* Controls */}
        <div className="glass-panel rounded-2xl p-4 md:p-6">
          <div className="flex flex-wrap gap-3 md:gap-4 items-center justify-between">
            <div className="flex items-center gap-3 bg-white/80 p-3 md:p-4 rounded-xl shadow-sm border border-border min-w-[200px] md:min-w-[360px]">
              <Calendar className="w-5 h-5 text-primary" />
              <label htmlFor="month" className="font-semibold text-sm md:text-base">Select Month:</label>
              <input
                type="month"
                id="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="px-3 py-2 rounded-lg border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none text-sm md:text-base"
              />
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3">
              <button onClick={handleAddNew} className="btn-gradient-primary">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add New Item</span>
              </button>
              
              <button onClick={() => {}} className="btn-gradient-import">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import Excel</span>
              </button>
              
              <button onClick={handleExportExcel} className="btn-gradient-excel">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
              
              <button onClick={handleExportPDF} className="btn-gradient-pdf">
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {items.length > 0 ? (
          <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border">
            <InventoryTable items={items} onEdit={handleEdit} onDelete={handleDelete} summary={summary} />
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-6">Add your first inventory item to get started</p>
            <button onClick={handleAddNew} className="btn-gradient-primary">
              <Plus className="w-4 h-4" />
              Add First Item
            </button>
          </div>
        )}

        {/* Summary Section */}
        <SummarySection summary={summary} />

        {/* Ration & Attendance Section */}
        <RationSection summary={summary} />

        {/* Dialog */}
        <ItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={editingItem}
          onSave={handleSaveItem}
        />
      </div>
    </div>
  );
};

export default Index;
