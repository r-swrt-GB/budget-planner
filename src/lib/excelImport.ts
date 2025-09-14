import * as XLSX from 'xlsx';

export interface ImportedBudgetData {
  incomeItems: Array<{
    item_name: string;
    date: string | null;
    full_amount: number;
    notes: string | null;
  }>;
  deductionItems: Array<{
    item_name: string;
    date: string | null;
    full_amount: number;
    notes: string | null;
  }>;
  expenseItems: Array<{
    item_name: string;
    date: string | null;
    full_amount: number;
    amount_used: number | null;
    notes: string | null;
  }>;
}

export function parseExcelFile(file: File): Promise<ImportedBudgetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const result: ImportedBudgetData = {
          incomeItems: [],
          deductionItems: [],
          expenseItems: []
        };


        const parseDate = (dateValue: any): string | null => {
          if (!dateValue || dateValue === 'N/A') return null;
          

          if (typeof dateValue === 'string') {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
            return null;
          }
          

          if (typeof dateValue === 'number') {
            const excelDate = XLSX.SSF.parse_date_code(dateValue);
            if (excelDate) {
              const date = new Date(excelDate.y, excelDate.m - 1, excelDate.d);
              return date.toISOString().split('T')[0];
            }
          }
          
          return null;
        };


        const parseAmount = (amountValue: any): number => {
          if (typeof amountValue === 'number') return amountValue;
          if (typeof amountValue === 'string') {
            const cleanAmount = amountValue.replace(/[R$,\s]/g, '');
            const parsed = parseFloat(cleanAmount);
            return isNaN(parsed) ? 0 : parsed;
          }
          return 0;
        };


        if (workbook.SheetNames.includes('Income Items')) {
          const incomeSheet = workbook.Sheets['Income Items'];
          const incomeData = XLSX.utils.sheet_to_json(incomeSheet, { header: 1 }) as any[][];
          
          // Find the header row (should contain 'Item Name', 'Date', 'Amount', 'Notes')
          let headerRowIndex = -1;
          for (let i = 0; i < incomeData.length; i++) {
            const row = incomeData[i];
            if (row && row.includes('Item Name') && row.includes('Amount')) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex !== -1) {
            for (let i = headerRowIndex + 1; i < incomeData.length; i++) {
              const row = incomeData[i];
              if (row && row[0] && row[0] !== 'TOTAL' && typeof row[0] === 'string') {
                result.incomeItems.push({
                  item_name: String(row[0] || '').trim(),
                  date: parseDate(row[1]),
                  full_amount: parseAmount(row[2]),
                  notes: row[3] && String(row[3]).trim() ? String(row[3]).trim() : null
                });
              }
            }
          }
        }

        // Parse Deductions sheet
        if (workbook.SheetNames.includes('Deductions')) {
          const deductionSheet = workbook.Sheets['Deductions'];
          const deductionData = XLSX.utils.sheet_to_json(deductionSheet, { header: 1 }) as any[][];
          
          let headerRowIndex = -1;
          for (let i = 0; i < deductionData.length; i++) {
            const row = deductionData[i];
            if (row && row.includes('Item Name') && row.includes('Amount')) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex !== -1) {
            for (let i = headerRowIndex + 1; i < deductionData.length; i++) {
              const row = deductionData[i];
              if (row && row[0] && row[0] !== 'TOTAL' && typeof row[0] === 'string') {
                result.deductionItems.push({
                  item_name: String(row[0] || '').trim(),
                  date: parseDate(row[1]),
                  full_amount: parseAmount(row[2]),
                  notes: row[3] && String(row[3]).trim() ? String(row[3]).trim() : null
                });
              }
            }
          }
        }

        // Parse Expenses sheet
        if (workbook.SheetNames.includes('Expenses')) {
          const expenseSheet = workbook.Sheets['Expenses'];
          const expenseData = XLSX.utils.sheet_to_json(expenseSheet, { header: 1 }) as any[][];
          
          let headerRowIndex = -1;
          for (let i = 0; i < expenseData.length; i++) {
            const row = expenseData[i];
            if (row && row.includes('Item Name') && row.includes('Full Amount')) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex !== -1) {
            for (let i = headerRowIndex + 1; i < expenseData.length; i++) {
              const row = expenseData[i];
              if (row && row[0] && row[0] !== 'TOTAL' && typeof row[0] === 'string') {
                result.expenseItems.push({
                  item_name: String(row[0] || '').trim(),
                  date: parseDate(row[1]),
                  full_amount: parseAmount(row[2]),
                  amount_used: row[3] ? parseAmount(row[3]) : null,
                  notes: row[5] && String(row[5]).trim() ? String(row[5]).trim() : null // Notes is in column 6 (index 5) for expenses
                });
              }
            }
          }
        }

        resolve(result);
      } catch (error) {
        console.error('Excel parsing error:', error);
        reject(new Error('Failed to parse Excel file. Please ensure it\'s a valid budget export file.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the file.'));
    };

    reader.readAsBinaryString(file);
  });
}
