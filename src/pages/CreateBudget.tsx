import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

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

const defaultIncomeItems: IncomeItem[] = [
  { item_name: 'Gym money', date: '', full_amount: 0, notes: '' },
  { item_name: 'Pocket money', date: '', full_amount: 0, notes: '' },
  { item_name: 'Salary (RXXX)', date: '', full_amount: 0, notes: '' },
];

const defaultDeductionItems: DeductionItem[] = [
  { item_name: 'Tax (RXXX)', date: '', full_amount: 0, notes: '' },
  { item_name: 'U.I.F (RXXX)', date: '', full_amount: 0, notes: '' },
];

const defaultExpenseItems: ExpenseItem[] = [
  { item_name: 'Medical', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Car insurance', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Phone insurance', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Laptop insurance', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Allan Gray', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Investments', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Rent (R3 000)', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Gym (R750)', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Spending Money', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Electricity (R300)', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Petrol', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Data / Call minutes / Wifi', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Haircut', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Clothes + Home beautification', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Food, meat vegetables fruits Weetbix milk, etc.', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Eating out', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Flowers', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Toiletries & Cleaning agents', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Gifts', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Money withdrawn', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Car service', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Socializing/Pool', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Drink', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Golf', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Canva', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'AWS Hosting', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'ChatGPT', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'CoPilot', date: '', full_amount: 0, amount_used: 0, notes: '' },
  { item_name: 'Transaction charges', date: '', full_amount: 0, amount_used: 0, notes: '' },
];

export function CreateBudget() {
  const [monthYear, setMonthYear] = useState('');
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>(defaultIncomeItems);
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>(defaultDeductionItems);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>(defaultExpenseItems);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

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
    } catch (error) {
      console.error('Error creating budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const addIncomeItem = () => {
    setIncomeItems([...incomeItems, { item_name: '', date: '', full_amount: 0, notes: '' }]);
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
    setDeductionItems([...deductionItems, { item_name: '', date: '', full_amount: 0, notes: '' }]);
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
    setExpenseItems([...expenseItems, { item_name: '', date: '', full_amount: 0, amount_used: 0, notes: '' }]);
  };

  const removeExpenseItem = (index: number) => {
    setExpenseItems(expenseItems.filter((_, i) => i !== index));
  };

  const updateExpenseItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    const updated = [...expenseItems];
    updated[index] = { ...updated[index], [field]: value };
    setExpenseItems(updated);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Budget</h1>
          <p className="text-gray-600">Set up your monthly budget with income, deductions, and expenses</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                        <Input
                          type="number"
                          step="0.01"
                          value={item.amount_used}
                          onChange={(e) => updateExpenseItem(index, 'amount_used', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
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
          <Button type="submit" disabled={loading || !monthYear.trim()}>
            {loading ? 'Creating...' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </div>
  );
}