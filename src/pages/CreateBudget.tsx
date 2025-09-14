import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ArrowLeft, Plus, Trash2, Calculator, Loader2 } from 'lucide-react';
import { ImportedBudgetData } from '../lib/excelImport';

interface IncomeItem {
  item_name: string;
  date: string;
  full_amount: number;
  notes: string;
}

interface DeductionItem {
  item_name: string;
  date: string;
  full_amount: number;
  notes: string;
}

interface ExpenseItem {
  item_name: string;
  date: string;
  full_amount: number;
  amount_used: number;
  notes: string;
}

const getCurrentMonthFirstDay = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

const getCurrentMonthYear = () => {
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  return `${month} - ${year}`;
};

// Fallback expense items for users without recurring templates
const defaultExpenseItems: ExpenseItem[] = [
  { item_name: 'Groceries', date: getCurrentMonthFirstDay(), full_amount: 2500, amount_used: 0, notes: '' },
  { item_name: 'Utilities', date: getCurrentMonthFirstDay(), full_amount: 1500, amount_used: 0, notes: '' },
  { item_name: 'Transport/Fuel', date: getCurrentMonthFirstDay(), full_amount: 1200, amount_used: 0, notes: '' },
  { item_name: 'Medical/Healthcare', date: getCurrentMonthFirstDay(), full_amount: 800, amount_used: 0, notes: '' },
  { item_name: 'Entertainment', date: getCurrentMonthFirstDay(), full_amount: 600, amount_used: 0, notes: '' },
];

export function CreateBudget() {
  const [monthYear, setMonthYear] = useState(getCurrentMonthYear());
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>([]);
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [budgetExistsWarning, setBudgetExistsWarning] = useState(false);
  const [calculatorModal, setCalculatorModal] = useState<{
    isOpen: boolean;
    itemIndex: number;
    addAmount: string;
  }>({
    isOpen: false,
    itemIndex: -1,
    addAmount: '',
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we have imported data
  const importedData = location.state?.importedData as ImportedBudgetData | undefined;
  const skipRecurring = location.state?.skipRecurring as boolean;

  // Load recurring templates or imported data on component mount
  useEffect(() => {
    if (user) {
      if (importedData && skipRecurring) {
        loadImportedData();
      } else {
        loadRecurringTemplates();
      }
    }
  }, [user, importedData, skipRecurring]);

  // Check for existing budget when month/year changes
  useEffect(() => {
    if (user && monthYear) {
      checkBudgetExists(monthYear);
    }
  }, [user, monthYear]);

  const loadImportedData = () => {
    if (!importedData) return;
    
    setTemplatesLoading(true);
    
    try {
      const defaultDate = getCurrentMonthFirstDay();
      
      // Convert imported income items
      const importedIncomeItems: IncomeItem[] = importedData.incomeItems.map(item => ({
        item_name: item.item_name,
        date: item.date || defaultDate,
        full_amount: item.full_amount,
        notes: item.notes || ''
      }));
      
      // Convert imported deduction items
      const importedDeductionItems: DeductionItem[] = importedData.deductionItems.map(item => ({
        item_name: item.item_name,
        date: item.date || defaultDate,
        full_amount: item.full_amount,
        notes: item.notes || ''
      }));
      
      // Convert imported expense items
      const importedExpenseItems: ExpenseItem[] = importedData.expenseItems.map(item => ({
        item_name: item.item_name,
        date: item.date || defaultDate,
        full_amount: item.full_amount,
        amount_used: item.amount_used || 0,
        notes: item.notes || ''
      }));
      
      setIncomeItems(importedIncomeItems.length > 0 ? importedIncomeItems : [
        { item_name: 'Salary', date: defaultDate, full_amount: 0, notes: '' }
      ]);
      
      setDeductionItems(importedDeductionItems.length > 0 ? importedDeductionItems : [
        { item_name: 'Tax', date: defaultDate, full_amount: 0, notes: '' },
        { item_name: 'U.I.F', date: defaultDate, full_amount: 0, notes: '' }
      ]);
      
      setExpenseItems(importedExpenseItems.length > 0 ? importedExpenseItems : defaultExpenseItems);
      
    } catch (error) {
      console.error('Error loading imported data:', error);
      // Fall back to default items on error
      const defaultDate = getCurrentMonthFirstDay();
      setIncomeItems([{ item_name: 'Salary', date: defaultDate, full_amount: 0, notes: '' }]);
      setDeductionItems([
        { item_name: 'Tax', date: defaultDate, full_amount: 0, notes: '' },
        { item_name: 'U.I.F', date: defaultDate, full_amount: 0, notes: '' }
      ]);
      setExpenseItems(defaultExpenseItems);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadRecurringTemplates = async () => {
    if (!user) return;
    
    setTemplatesLoading(true);
    try {
      // Load recurring incomes
      const { data: recurringIncomes } = await supabase
        .from('recurring_incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Load recurring deductions
      const { data: recurringDeductions } = await supabase
        .from('recurring_deductions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Load recurring expenses
      const { data: recurringExpenses } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Convert recurring templates to form items
      const defaultDate = getCurrentMonthFirstDay();
      
      // Set income items from templates or use fallback
      const incomeTemplates: IncomeItem[] = (recurringIncomes || [])
        .filter(item => item.description.trim())
        .map(item => ({
          item_name: item.description,
          date: defaultDate,
          full_amount: item.amount,
          notes: ''
        }));
      
      setIncomeItems(incomeTemplates.length > 0 ? incomeTemplates : [
        { item_name: 'Salary', date: defaultDate, full_amount: 0, notes: '' }
      ]);

      // Set deduction items from templates or use fallback
      const deductionTemplates: DeductionItem[] = (recurringDeductions || [])
        .filter(item => item.description.trim())
        .map(item => ({
          item_name: item.description,
          date: defaultDate,
          full_amount: item.amount,
          notes: ''
        }));
      
      setDeductionItems(deductionTemplates.length > 0 ? deductionTemplates : [
        { item_name: 'Tax', date: defaultDate, full_amount: 0, notes: '' },
        { item_name: 'U.I.F', date: defaultDate, full_amount: 0, notes: '' }
      ]);

      // Set expense items from templates or use fallback
      const expenseTemplates: ExpenseItem[] = (recurringExpenses || [])
        .filter(item => item.description.trim())
        .map(item => ({
          item_name: item.description,
          date: defaultDate,
          full_amount: item.full_amount, 
          amount_used: 0,
          notes: ''
        }));
      
      setExpenseItems(expenseTemplates.length > 0 ? expenseTemplates : defaultExpenseItems);

    } catch (error) {
      console.error('Error loading recurring templates:', error);
      const defaultDate = getCurrentMonthFirstDay();
      setIncomeItems([{ item_name: 'Salary', date: defaultDate, full_amount: 0, notes: '' }]);
      setDeductionItems([
        { item_name: 'Tax', date: defaultDate, full_amount: 0, notes: '' },
        { item_name: 'U.I.F', date: defaultDate, full_amount: 0, notes: '' }
      ]);
      setExpenseItems(defaultExpenseItems);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const totalIncome = incomeItems.reduce((sum, item) => sum + (item.full_amount || 0), 0);
  const totalDeductions = deductionItems.reduce((sum, item) => sum + (item.full_amount || 0), 0);
  const primaryIncome = totalIncome - totalDeductions;
  const totalExpenses = expenseItems.reduce((sum, item) => sum + (item.amount_used || 0), 0);
  const savings = primaryIncome - totalExpenses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Check if a budget for this month/year already exists
      const { data: existingBudget, error: checkError } = await supabase
        .from('budgets')
        .select('id, month_year')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for existing budget:', checkError);
        throw new Error('Failed to check for existing budgets');
      }

      if (existingBudget) {
        alert(`A budget with this name already exists. Please choose a different name for this budget.`);
        return;
      }

      // Create budget
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          month_year: monthYear,
          primary_income: primaryIncome,
          total_expenses: totalExpenses,
          savings: savings,
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      // Insert income items
      const incomeData = incomeItems
        .filter(item => item.item_name.trim())
        .map(item => ({
          budget_id: budget.id,
          item_name: item.item_name,
          date: item.date || null,
          full_amount: item.full_amount || 0,
          notes: item.notes || null,
        }));

      if (incomeData.length > 0) {
        const { error: incomeError } = await supabase
          .from('income_items')
          .insert(incomeData);
        if (incomeError) throw incomeError;
      }

      // Insert deduction items
      const deductionData = deductionItems
        .filter(item => item.item_name.trim())
        .map(item => ({
          budget_id: budget.id,
          item_name: item.item_name,
          date: item.date || null,
          full_amount: item.full_amount || 0,
          notes: item.notes || null,
        }));

      if (deductionData.length > 0) {
        const { error: deductionError } = await supabase
          .from('deduction_items')
          .insert(deductionData);
        if (deductionError) throw deductionError;
      }

      // Insert expense items
      const expenseData = expenseItems
        .filter(item => item.item_name.trim())
        .map(item => ({
          budget_id: budget.id,
          item_name: item.item_name,
          date: item.date || null,
          full_amount: item.full_amount || 0,
          amount_used: item.amount_used || 0,
          notes: item.notes || null,
        }));

      if (expenseData.length > 0) {
        const { error: expenseError } = await supabase
          .from('expense_items')
          .insert(expenseData);
        if (expenseError) throw expenseError;
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating budget:', error);
      
      // Handle specific database constraint errors
      if (error?.code === '23505' && error?.message?.includes('budgets_user_id_month_year_key')) {
        alert(`A budget for "${monthYear}" already exists. Please choose a different month/year or edit the existing budget.`);
      } else if (error?.message) {
        alert(`Failed to create budget: ${error.message}`);
      } else {
        alert('Failed to create budget. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkBudgetExists = async (checkMonthYear: string) => {
    if (!user || !checkMonthYear) return;
    
    try {
      const { data: existingBudget, error } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .eq('month_year', checkMonthYear)
        .maybeSingle();

      if (error) {
        console.error('Error checking budget existence:', error);
        return;
      }

      setBudgetExistsWarning(!!existingBudget);
    } catch (error) {
      console.error('Error checking budget existence:', error);
    }
  };

  const addIncomeItem = () => {
    setIncomeItems([...incomeItems, { item_name: '', date: getCurrentMonthFirstDay(), full_amount: 0, notes: '' }]);
  };

  const removeIncomeItem = (index: number) => {
    setIncomeItems(incomeItems.filter((_, i) => i !== index));
  };

  const updateIncomeItem = (index: number, field: keyof IncomeItem, value: string | number) => {
    const updated = [...incomeItems];
    updated[index] = { ...updated[index], [field]: value };
    setIncomeItems(updated);
  };

  const addDeductionItem = () => {
    setDeductionItems([...deductionItems, { item_name: '', date: getCurrentMonthFirstDay(), full_amount: 0, notes: '' }]);
  };

  const removeDeductionItem = (index: number) => {
    setDeductionItems(deductionItems.filter((_, i) => i !== index));
  };

  const updateDeductionItem = (index: number, field: keyof DeductionItem, value: string | number) => {
    const updated = [...deductionItems];
    updated[index] = { ...updated[index], [field]: value };
    setDeductionItems(updated);
  };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { item_name: '', date: getCurrentMonthFirstDay(), full_amount: 0, amount_used: 0, notes: '' }]);
  };

  const removeExpenseItem = (index: number) => {
    setExpenseItems(expenseItems.filter((_, i) => i !== index));
  };

  const updateExpenseItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    const updated = [...expenseItems];
    updated[index] = { ...updated[index], [field]: value };
    setExpenseItems(updated);
  };

  const openCalculator = (index: number) => {
    setCalculatorModal({
      isOpen: true,
      itemIndex: index,
      addAmount: '',
    });
  };

  const closeCalculator = () => {
    setCalculatorModal({
      isOpen: false,
      itemIndex: -1,
      addAmount: '',
    });
  };

  const addToExpenseAmount = () => {
    const { itemIndex, addAmount } = calculatorModal;
    const amountToAdd = parseFloat(addAmount) || 0;
    
    if (itemIndex >= 0 && amountToAdd > 0) {
      const updated = [...expenseItems];
      updated[itemIndex] = {
        ...updated[itemIndex],
        amount_used: (updated[itemIndex].amount_used || 0) + amountToAdd,
      };
      setExpenseItems(updated);
    }
    
    closeCalculator();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
       <div className="flex items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Budget
            {importedData && skipRecurring && (
              <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Imported from Excel
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            {importedData && skipRecurring 
              ? 'Review and modify the imported budget data before creating your budget'
              : 'Set up your monthly budget with income, deductions, and expenses'
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {templatesLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  {importedData && skipRecurring 
                    ? 'Loading imported budget data...' 
                    : 'Loading your recurring templates...'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {importedData && skipRecurring
                    ? 'Processing your Excel file and preparing the budget form'
                    : 'This will populate your budget with your saved income, deduction, and expense items'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Budget Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month/Year
                    </label>
                    <Input
                      type="text"
                      value={monthYear}
                      onChange={(e) => setMonthYear(e.target.value)}
                      placeholder="e.g., January - 2026"
                      required
                    />
                    {budgetExistsWarning && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-800">
                              A budget for "{monthYear}" already exists. Please choose a different month/year or edit the existing budget from the dashboard.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* Income Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Income Items</CardTitle>
              <Button type="button" onClick={addIncomeItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Notes</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 pr-2">
                        <Input
                          value={item.item_name}
                          onChange={(e) => updateIncomeItem(index, 'item_name', e.target.value)}
                          placeholder="Income source"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateIncomeItem(index, 'date', e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.full_amount}
                          onChange={(e) => updateIncomeItem(index, 'full_amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          value={item.notes}
                          onChange={(e) => updateIncomeItem(index, 'notes', e.target.value)}
                          placeholder="Notes"
                        />
                      </td>
                      <td className="py-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeIncomeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <span className="text-lg font-semibold text-green-600">
                Total Income: R{totalIncome.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Deduction Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Deduction Items</CardTitle>
              <Button type="button" onClick={addDeductionItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Deduction
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Notes</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deductionItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 pr-2">
                        <Input
                          value={item.item_name}
                          onChange={(e) => updateDeductionItem(index, 'item_name', e.target.value)}
                          placeholder="Deduction type"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateDeductionItem(index, 'date', e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.full_amount}
                          onChange={(e) => updateDeductionItem(index, 'full_amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          value={item.notes}
                          onChange={(e) => updateDeductionItem(index, 'notes', e.target.value)}
                          placeholder="Notes"
                        />
                      </td>
                      <td className="py-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDeductionItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <span className="text-lg font-semibold text-red-600">
                Total Deductions: R{totalDeductions.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Expense Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Expense Items</CardTitle>
              <Button type="button" onClick={addExpenseItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Full Amount</th>
                    <th className="text-left py-2">Amount Used</th>
                    <th className="text-left py-2">Notes</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 pr-2">
                        <Input
                          value={item.item_name}
                          onChange={(e) => updateExpenseItem(index, 'item_name', e.target.value)}
                          placeholder="Expense type"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="date"
                          value={item.date}
                          onChange={(e) => updateExpenseItem(index, 'date', e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.full_amount}
                          onChange={(e) => updateExpenseItem(index, 'full_amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amount_used === 0 ? '' : item.amount_used}
                            onChange={(e) => updateExpenseItem(index, 'amount_used', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openCalculator(index)}
                            className="p-2 h-8 w-8"
                          >
                            <Calculator className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          value={item.notes}
                          onChange={(e) => updateExpenseItem(index, 'notes', e.target.value)}
                          placeholder="Notes"
                        />
                      </td>
                      <td className="py-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeExpenseItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <span className="text-lg font-semibold text-red-600">
                Total Expenses: R{totalExpenses.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">Primary Income</h3>
                <p className="text-2xl font-bold text-green-600">
                  R{primaryIncome.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-green-600">Income - Deductions</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600">
                  R{totalExpenses.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-red-600">Sum of Amount Used</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${savings >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`text-lg font-semibold ${savings >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  Savings
                </h3>
                <p className={`text-2xl font-bold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {savings >= 0 ? '+' : ''}R{Math.abs(savings).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-sm ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Primary Income - Expenses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !monthYear.trim() || budgetExistsWarning}>
            {loading ? 'Creating...' : 'Create Budget'}
          </Button>
        </div>
        </>
        )}
      </form>

      {/* Calculator Modal */}
      {calculatorModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add to Amount Used
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Current amount: R{(expenseItems[calculatorModal.itemIndex]?.amount_used || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to add:
              </label>
              <Input
                type="number"
                step="0.01"
                value={calculatorModal.addAmount}
                onChange={(e) => setCalculatorModal(prev => ({ ...prev, addAmount: e.target.value }))}
                placeholder="0.00"
                className="w-full"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeCalculator}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={addToExpenseAmount}
                disabled={!calculatorModal.addAmount || parseFloat(calculatorModal.addAmount) <= 0}
              >
                Add Amount
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}