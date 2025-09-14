import * as XLSX from 'xlsx';
import { BudgetWithItems } from '../types';

export function exportBudgetToExcel(budget: BudgetWithItems): void {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Create budget summary sheet
  const summaryData = [
    ['Budget Summary', ''],
    ['Month/Year', budget.month_year],
    ['Created', new Date(budget.created_at).toLocaleDateString()],
    ['', ''],
    ['Financial Overview', ''],
    ['Primary Income', `R${budget.primary_income.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`],
    ['Total Expenses', `R${budget.total_expenses.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`],
    ['Savings', `R${budget.savings.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths for summary sheet
  summarySheet['!cols'] = [
    { width: 20 },
    { width: 25 }
  ];

  // Add summary sheet to workbook
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Create detailed breakdown sheet
  const detailedData = [];
  let currentRow = 0;

  // Add title
  detailedData.push([`Budget Breakdown - ${budget.month_year}`]);
  detailedData.push(['']);
  currentRow += 2;

  // Income section
  detailedData.push(['INCOME ITEMS']);
  detailedData.push(['Item Name', 'Date', 'Amount', 'Notes']);
  
  let incomeTotal = 0;
  if (budget.income_items && budget.income_items.length > 0) {
    budget.income_items.forEach(item => {
      detailedData.push([
        item.item_name,
        item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
        item.full_amount,
        item.notes || ''
      ]);
      incomeTotal += item.full_amount;
    });
  } else {
    detailedData.push(['No income items']);
  }
  
  detailedData.push(['', '', '', '']);
  detailedData.push(['TOTAL INCOME', '', incomeTotal, '']);
  detailedData.push(['']);

  // Deductions section
  detailedData.push(['DEDUCTION ITEMS']);
  detailedData.push(['Item Name', 'Date', 'Amount', 'Notes']);
  
  let deductionTotal = 0;
  if (budget.deduction_items && budget.deduction_items.length > 0) {
    budget.deduction_items.forEach(item => {
      detailedData.push([
        item.item_name,
        item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
        item.full_amount,
        item.notes || ''
      ]);
      deductionTotal += item.full_amount;
    });
  } else {
    detailedData.push(['No deduction items']);
  }
  
  detailedData.push(['', '', '', '']);
  detailedData.push(['TOTAL DEDUCTIONS', '', deductionTotal, '']);
  detailedData.push(['']);

  // Expenses section
  detailedData.push(['EXPENSE ITEMS']);
  detailedData.push(['Item Name', 'Date', 'Full Amount', 'Amount Used', 'Notes']);
  
  let expenseTotal = 0;
  let expenseUsedTotal = 0;
  if (budget.expense_items && budget.expense_items.length > 0) {
    budget.expense_items.forEach(item => {
      detailedData.push([
        item.item_name,
        item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
        item.full_amount,
        item.amount_used || 0,
        item.notes || ''
      ]);
      expenseTotal += item.full_amount;
      expenseUsedTotal += item.amount_used || 0;
    });
  } else {
    detailedData.push(['No expense items']);
  }
  
  detailedData.push(['', '', '', '', '']);
  detailedData.push(['TOTAL EXPENSES', '', expenseTotal, expenseUsedTotal, '']);
  detailedData.push(['']);

  // Financial summary
  detailedData.push(['FINANCIAL SUMMARY']);
  detailedData.push(['Primary Income', budget.primary_income]);
  detailedData.push(['Additional Income', incomeTotal]);
  detailedData.push(['Total Income', budget.primary_income + incomeTotal]);
  detailedData.push(['Total Deductions', deductionTotal]);
  detailedData.push(['Total Expenses', expenseTotal]);
  detailedData.push(['Net Income (after deductions)', budget.primary_income + incomeTotal - deductionTotal]);
  detailedData.push(['Remaining after expenses', budget.primary_income + incomeTotal - deductionTotal - expenseTotal]);
  detailedData.push(['Savings', budget.savings]);

  const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);

  // Apply formatting to the detailed sheet
  const range = XLSX.utils.decode_range(detailedSheet['!ref'] || 'A1');
  
  // Set column widths
  detailedSheet['!cols'] = [
    { width: 25 }, // Item Name
    { width: 15 }, // Date
    { width: 15 }, // Amount/Full Amount
    { width: 15 }, // Amount Used
    { width: 30 }  // Notes
  ];

  // Format currency cells
  for (let row = 0; row <= range.e.r; row++) {
    for (let col = 2; col <= 3; col++) { // Columns C and D (amounts)
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = detailedSheet[cellAddress];
      
      if (cell && typeof cell.v === 'number') {
        cell.z = '"R"#,##0.00'; // South African Rand format
      }
    }
  }

  // Add the detailed sheet to workbook
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Breakdown');

  // Create income items sheet (if there are income items)
  if (budget.income_items && budget.income_items.length > 0) {
    const incomeData = [
      ['Income Items - ' + budget.month_year],
      [''],
      ['Item Name', 'Date', 'Amount', 'Notes'],
      ...budget.income_items.map(item => [
        item.item_name,
        item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
        item.full_amount,
        item.notes || ''
      ]),
      [''],
      ['TOTAL', '', incomeTotal, '']
    ];

    const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
    
    // Set column widths and format currency
    incomeSheet['!cols'] = [
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 30 }
    ];

    // Format currency column
    const incomeRange = XLSX.utils.decode_range(incomeSheet['!ref'] || 'A1');
    for (let row = 0; row <= incomeRange.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 }); // Column C
      const cell = incomeSheet[cellAddress];
      if (cell && typeof cell.v === 'number') {
        cell.z = '"R"#,##0.00';
      }
    }

    XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Income Items');
  }

  // Create deduction items sheet (if there are deduction items)
  if (budget.deduction_items && budget.deduction_items.length > 0) {
    const deductionData = [
      ['Deduction Items - ' + budget.month_year],
      [''],
      ['Item Name', 'Date', 'Amount', 'Notes'],
      ...budget.deduction_items.map(item => [
        item.item_name,
        item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
        item.full_amount,
        item.notes || ''
      ]),
      [''],
      ['TOTAL', '', deductionTotal, '']
    ];

    const deductionSheet = XLSX.utils.aoa_to_sheet(deductionData);
    
    // Set column widths and format currency
    deductionSheet['!cols'] = [
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 30 }
    ];

    // Format currency column
    const deductionRange = XLSX.utils.decode_range(deductionSheet['!ref'] || 'A1');
    for (let row = 0; row <= deductionRange.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 }); // Column C
      const cell = deductionSheet[cellAddress];
      if (cell && typeof cell.v === 'number') {
        cell.z = '"R"#,##0.00';
      }
    }

    XLSX.utils.book_append_sheet(workbook, deductionSheet, 'Deductions');
  }

  // Create expense items sheet (if there are expense items)
  if (budget.expense_items && budget.expense_items.length > 0) {
    const expenseData = [
      ['Expense Items - ' + budget.month_year],
      [''],
      ['Item Name', 'Date', 'Full Amount', 'Amount Used', 'Remaining', 'Notes'],
      ...budget.expense_items.map(item => [
        item.item_name,
        item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
        item.full_amount,
        item.amount_used || 0,
        item.full_amount - (item.amount_used || 0),
        item.notes || ''
      ]),
      [''],
      ['TOTAL', '', expenseTotal, expenseUsedTotal, expenseTotal - expenseUsedTotal, '']
    ];

    const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
    
    // Set column widths and format currency
    expenseSheet['!cols'] = [
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 30 }
    ];

    // Format currency columns (C, D, E)
    const expenseRange = XLSX.utils.decode_range(expenseSheet['!ref'] || 'A1');
    for (let row = 0; row <= expenseRange.e.r; row++) {
      for (let col = 2; col <= 4; col++) { // Columns C, D, E
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = expenseSheet[cellAddress];
        if (cell && typeof cell.v === 'number') {
          cell.z = '"R"#,##0.00';
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Expenses');
  }

  // Generate filename
  const filename = `Budget_${budget.month_year.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename);
}
