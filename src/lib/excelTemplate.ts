import * as XLSX from 'xlsx';
import { supabase } from './supabase';

interface RecurringIncome {
  id: string;
  description: string;
  amount: number;
}

interface RecurringDeduction {
  id: string;
  description: string;
  amount: number;
}

interface RecurringExpense {
  id: string;
  description: string;
  full_amount: number;
}

export async function downloadTemplateExcel(userId: string): Promise<void> {
  try {
    // Fetch user's recurring items
    const [incomeResult, deductionResult, expenseResult] = await Promise.all([
      supabase
        .from('recurring_incomes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      supabase
        .from('recurring_deductions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
    ]);

    const recurringIncomes = incomeResult.data || [];
    const recurringDeductions = deductionResult.data || [];
    const recurringExpenses = expenseResult.data || [];

    generateTemplate(recurringIncomes, recurringDeductions, recurringExpenses);
  } catch (error) {
    console.error('Error fetching recurring items:', error);
    generateTemplate([], [], []);
  }
}

function generateTemplate(
  recurringIncomes: RecurringIncome[],
  recurringDeductions: RecurringDeduction[],
  recurringExpenses: RecurringExpense[]
): void {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Create sample data for each sheet
  const currentDate = new Date().toLocaleDateString();

  // Income Items sheet with user's recurring data or fallback
  const incomeItems = recurringIncomes.length > 0 
    ? recurringIncomes.filter(item => item.description.trim()).map(item => [
        item.description,
        currentDate,
        item.amount,
        ''
      ])
    : [['Sample Income', currentDate, 1000, 'Sample Income Description (Optional)']];

  const incomeData = [
    ['Income Items - Template'],
    [''],
    ['Item Name', 'Date', 'Amount', 'Notes'],
    ...incomeItems,
    [''],
    ['TOTAL', '', incomeItems.reduce((sum, item) => sum + (typeof item[2] === 'number' ? item[2] : 0), 0), '']
  ];

  const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
  incomeSheet['!cols'] = [
    { width: 25 },
    { width: 15 },
    { width: 15 },
    { width: 30 }
  ];

  // Format currency columns
  const incomeRange = XLSX.utils.decode_range(incomeSheet['!ref'] || 'A1');
  for (let row = 0; row <= incomeRange.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 }); 
    const cell = incomeSheet[cellAddress];
    if (cell && typeof cell.v === 'number') {
      cell.z = '"R"#,##0.00';
    }
  }

  XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Income Items');

  const deductionItems = recurringDeductions.length > 0
    ? recurringDeductions.filter(item => item.description.trim()).map(item => [
        item.description,
        currentDate,
        item.amount,
        ''
      ])
    : [['Sample Deduction', currentDate, 500, 'Sample Deduction Description (Optional)']];

  const deductionData = [
    ['Deduction Items - Template'],
    [''],
    ['Item Name', 'Date', 'Amount', 'Notes'],
    ...deductionItems,
    [''],
    ['TOTAL', '', deductionItems.reduce((sum, item) => sum + (typeof item[2] === 'number' ? item[2] : 0), 0), '']
  ];

  const deductionSheet = XLSX.utils.aoa_to_sheet(deductionData);
  deductionSheet['!cols'] = [
    { width: 25 },
    { width: 15 },
    { width: 15 },
    { width: 30 }
  ];

  // Format currency columns
  const deductionRange = XLSX.utils.decode_range(deductionSheet['!ref'] || 'A1');
  for (let row = 0; row <= deductionRange.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 }); 
    const cell = deductionSheet[cellAddress];
    if (cell && typeof cell.v === 'number') {
      cell.z = '"R"#,##0.00';
    }
  }

  XLSX.utils.book_append_sheet(workbook, deductionSheet, 'Deductions');

  const expenseItems = recurringExpenses.length > 0
    ? recurringExpenses.filter(item => item.description.trim()).map(item => [
        item.description,
        currentDate,
        item.full_amount,
        0,
        item.full_amount, 
        ''
      ])
    : [['Sample Expense', currentDate, 1000, 0, 1000, 'Sample Expense Description (Optional)']];

  const expenseData = [
    ['Expense Items - Template'],
    [''],
    ['Item Name', 'Date', 'Full Amount', 'Amount Used', 'Remaining', 'Notes'],
    ...expenseItems,
    [''],
    ['TOTAL', '', 
      expenseItems.reduce((sum, item) => sum + (typeof item[2] === 'number' ? item[2] : 0), 0),
      expenseItems.reduce((sum, item) => sum + (typeof item[3] === 'number' ? item[3] : 0), 0),
      expenseItems.reduce((sum, item) => sum + (typeof item[4] === 'number' ? item[4] : 0), 0),
      ''
    ]
  ];

  const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
  expenseSheet['!cols'] = [
    { width: 25 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 30 }
  ];

  const expenseRange = XLSX.utils.decode_range(expenseSheet['!ref'] || 'A1');
  for (let row = 0; row <= expenseRange.e.r; row++) {
    for (let col = 2; col <= 4; col++) { 
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = expenseSheet[cellAddress];
      if (cell && typeof cell.v === 'number') {
        cell.z = '"R"#,##0.00';
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Expenses');

  // Calculate totals for summary
  const totalIncome = incomeItems.reduce((sum, item) => sum + (typeof item[2] === 'number' ? item[2] : 0), 0);
  const totalDeductions = deductionItems.reduce((sum, item) => sum + (typeof item[2] === 'number' ? item[2] : 0), 0);
  const totalExpenses = expenseItems.reduce((sum, item) => sum + (typeof item[2] === 'number' ? item[2] : 0), 0);
  const netIncome = totalIncome - totalDeductions;
  const expectedSavings = netIncome - totalExpenses;

  // Create summary sheet
  const summaryData = [
    ['Budget Template Summary'],
    [''],
    [recurringIncomes.length > 0 || recurringDeductions.length > 0 || recurringExpenses.length > 0 
      ? 'This template contains your saved recurring budget items'
      : 'This is a template file for importing budget data'],
    [''],
    ['Instructions:'],
    ['1. Review and modify the data in the Income Items, Deductions, and Expenses sheets'],
    ['2. Keep the column headers exactly as they are'],
    ['3. Use the same date format and currency format'],
    ['4. Save the file and import it using the budget planner'],
    [''],
    ['Sheet Descriptions:'],
    ['• Income Items: Your recurring income sources'],
    ['• Deductions: Your recurring deductions (taxes, etc.)'],
    ['• Expenses: Your recurring expenses with budgeted amounts'],
    [''],
    ['Current Totals:'],
    ['Total Income', totalIncome],
    ['Total Deductions', totalDeductions],
    ['Net Income', netIncome],
    ['Total Expenses', totalExpenses],
    ['Expected Savings', expectedSavings]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { width: 30 },
    { width: 15 }
  ];

  // Format currency cells in summary
  const summaryRange = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1');
  for (let row = 0; row <= summaryRange.e.r; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 1 }); 
    const cell = summarySheet[cellAddress];
    if (cell && typeof cell.v === 'number') {
      cell.z = '"R"#,##0.00';
    }
  }

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const filename = `Budget_Template_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
