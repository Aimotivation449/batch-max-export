import { useState, useEffect } from 'react';
import { SummaryData } from '@/types/inventory';
import { Calculator, Users } from 'lucide-react';

interface RationSectionProps {
  summary: SummaryData;
}

export function RationSection({ summary }: RationSectionProps) {
  const [rationData, setRationData] = useState({
    freshRation: 0,
    casualDiet: 0,
    riPerson: 0,
    baraKhana: 0
  });

  const [attendanceData, setAttendanceData] = useState({
    totalAttendance: 450,
    lessCasualAttendance: 0,
    lessRiAttendance: 0,
    netAttendance: 450,
    totalDaysMonth: 30,
    rmaPerMonth: 5000,
    perDayDietAmount: 0,
    recoveryFromJawans: 0,
    totalRationExpenditure: 0,
    messProfit: 0
  });

  // Calculate dry ration consumed (from inventory expenditure)
  const dryRationConsumed = summary.totalExpenditureTotal.amount;
  
  // Calculate total ration consumed
  const totalRationConsumed = dryRationConsumed + rationData.freshRation;
  
  // Calculate net amount after deductions
  const netAmount = totalRationConsumed - rationData.casualDiet - rationData.riPerson - rationData.baraKhana;

  // Update ration data fresh ration to match editable summary
  useEffect(() => {
    const loadFreshRation = () => {
      const stored = localStorage.getItem('editable-summary');
      if (stored) {
        const editableSummary = JSON.parse(stored);
        setRationData(prev => ({
          ...prev,
          freshRation: editableSummary.expendituresMonth || 0
        }));
      }
    };

    loadFreshRation();

    // Listen for storage changes
    window.addEventListener('storage', loadFreshRation);
    
    // Custom event for same-tab updates
    const handleStorageUpdate = () => loadFreshRation();
    window.addEventListener('editable-summary-updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', loadFreshRation);
      window.removeEventListener('editable-summary-updated', handleStorageUpdate);
    };
  }, []);

  // Calculate attendance-related values
  useEffect(() => {
    const netAtt = attendanceData.totalAttendance - attendanceData.lessCasualAttendance - attendanceData.lessRiAttendance;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const perDay = daysInMonth > 0 ? attendanceData.rmaPerMonth / daysInMonth : 0;
    const profit = attendanceData.recoveryFromJawans - netAmount;

    setAttendanceData(prev => ({
      ...prev,
      netAttendance: netAtt,
      totalDaysMonth: daysInMonth,
      perDayDietAmount: parseFloat(perDay.toFixed(2)),
      totalRationExpenditure: netAmount,
      messProfit: profit
    }));
  }, [
    attendanceData.totalAttendance,
    attendanceData.lessCasualAttendance,
    attendanceData.lessRiAttendance,
    attendanceData.rmaPerMonth,
    attendanceData.recoveryFromJawans,
    netAmount
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ration Consumption Section */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 gradient-success bg-clip-text text-transparent">
          <Calculator className="w-5 h-5" />
          Ration Consumption Calculation
        </h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <span className="font-semibold text-sm">1. DRY RATION CONSUMED Rs:</span>
            <span className="text-right font-bold">₹{dryRationConsumed.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <span className="font-semibold text-sm">2. FRESH RATION CONSUMED Rs:</span>
            <input
              type="number"
              value={rationData.freshRation}
              readOnly
              className="text-right px-3 py-1 rounded border-2 border-border bg-muted cursor-not-allowed font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-2 border-purple-400">
            <span className="font-bold">TOTAL RATION CONSUMED Rs:</span>
            <span className="text-right font-bold text-lg">₹{totalRationConsumed.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <span className="font-semibold text-sm">1. LESS CASUAL DIET AMOUNT Rs:</span>
            <input
              type="number"
              value={rationData.casualDiet}
              onChange={(e) => setRationData({ ...rationData, casualDiet: parseFloat(e.target.value) || 0 })}
              className="text-right px-3 py-1 rounded border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <span className="font-semibold text-sm">2. LESS RI PERSON AMOUNT Rs:</span>
            <input
              type="number"
              value={rationData.riPerson}
              onChange={(e) => setRationData({ ...rationData, riPerson: parseFloat(e.target.value) || 0 })}
              className="text-right px-3 py-1 rounded border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <span className="font-semibold text-sm">3. LESS BARA KHANA AMOUNT Rs:</span>
            <input
              type="number"
              value={rationData.baraKhana}
              onChange={(e) => setRationData({ ...rationData, baraKhana: parseFloat(e.target.value) || 0 })}
              className="text-right px-3 py-1 rounded border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-500">
            <span className="font-bold">NET AMOUNT Rs:</span>
            <span className="text-right font-bold text-lg text-green-600 dark:text-green-400">₹{netAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Attendance & Diet Calculation Section */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 gradient-primary bg-clip-text text-transparent">
          <Users className="w-5 h-5" />
          Attendance & Diet Calculation
        </h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="total-attendance" className="font-medium text-sm">Total attendance:</label>
            <input
              type="number"
              id="total-attendance"
              value={attendanceData.totalAttendance}
              onChange={(e) => setAttendanceData({ ...attendanceData, totalAttendance: parseInt(e.target.value) || 0 })}
              className="px-4 py-2 rounded-lg border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="less-casual" className="font-medium text-sm">LESS CASUAL ATTENDENCE:</label>
            <input
              type="number"
              id="less-casual"
              value={attendanceData.lessCasualAttendance}
              onChange={(e) => setAttendanceData({ ...attendanceData, lessCasualAttendance: parseInt(e.target.value) || 0 })}
              className="px-4 py-2 rounded-lg border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="less-ri" className="font-medium text-sm">LESS RI ATTENDENCE:</label>
            <input
              type="number"
              id="less-ri"
              value={attendanceData.lessRiAttendance}
              onChange={(e) => setAttendanceData({ ...attendanceData, lessRiAttendance: parseInt(e.target.value) || 0 })}
              className="px-4 py-2 rounded-lg border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="net-attendance" className="font-medium text-sm">NET ATTENDENCE:</label>
            <input
              type="number"
              id="net-attendance"
              value={attendanceData.netAttendance}
              readOnly
              className="px-4 py-2 rounded-lg border-2 border-border bg-muted cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="total-days" className="font-medium text-sm">TOTAL DAYS IN THIS MONTH:</label>
            <input
              type="number"
              id="total-days"
              value={attendanceData.totalDaysMonth}
              readOnly
              className="px-4 py-2 rounded-lg border-2 border-border bg-muted cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="rma" className="font-medium text-sm">RMA PER MONTH Rs.=</label>
            <input
              type="number"
              id="rma"
              value={attendanceData.rmaPerMonth}
              onChange={(e) => setAttendanceData({ ...attendanceData, rmaPerMonth: parseFloat(e.target.value) || 0 })}
              className="px-4 py-2 rounded-lg border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="per-day" className="font-medium text-sm">PER DAY DIET-AMOUNT Rs.=</label>
            <input
              type="number"
              id="per-day"
              value={attendanceData.perDayDietAmount}
              readOnly
              className="px-4 py-2 rounded-lg border-2 border-border bg-muted cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="recovery" className="font-medium text-sm">RECOVERY FROM JAWAN'S Rs.=</label>
            <input
              type="number"
              id="recovery"
              value={attendanceData.recoveryFromJawans}
              onChange={(e) => setAttendanceData({ ...attendanceData, recoveryFromJawans: parseFloat(e.target.value) || 0 })}
              className="px-4 py-2 rounded-lg border-2 border-border bg-white focus:ring-2 focus:ring-primary outline-none"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="total-exp" className="font-medium text-sm">TOTAL RATION EXPENDITURED/MONTH Rs.=</label>
            <input
              type="number"
              id="total-exp"
              value={attendanceData.totalRationExpenditure}
              readOnly
              className="px-4 py-2 rounded-lg border-2 border-border bg-muted cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <label htmlFor="profit" className="font-medium text-sm">MESS PROFIT Rs.=</label>
            <input
              type="number"
              id="profit"
              value={attendanceData.messProfit}
              readOnly
              className="px-4 py-2 rounded-lg border-2 border-border bg-muted cursor-not-allowed font-bold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
