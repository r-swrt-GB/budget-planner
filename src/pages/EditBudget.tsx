import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { BudgetWithItems, Category } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ArrowLeft, Plus, Trash2, Calculator } from 'lucide-react';

interface IncomeItem {
  id?: string;
  item_name: string;
  date: string;
  full_amount: number;
  notes: string;
  category_id: string | null;
}

interface DeductionItem {
  id?: string;
  item_name: string;
  date: string;
  full_amount: number;
  notes: string;
}

interface ExpenseItem {
  id?: string;
  item_name: string;
  date: string;
  full_amount: number;
  amount_used: number;
  notes: string;
  category_id: string | null;
}

export function EditBudget() {
  const { id } = useParams<{ id: string }>();
  const [budget, setBudget] = useState<BudgetWithItems | null>(null);
  const [monthYear, setMonthYear] = useState('');
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>([]);
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (id && user) {
      fetchBudget();
      fetchCategories();
    }
  }, [id, user]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('label', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBudget = async () => {
    try {
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (budgetError) throw budgetError;

      const [incomeResult, deductionResult, expenseResult] = await Promise.all([
        supabase.from('income_items').select('*').eq('budget_id', id),
        supabase.from('deduction_items').select('*').eq('budget_id', id),
        supabase.from('expense_items').select('*').eq('budget_id', id),
      ]);

      if (incomeResult.error) throw incomeResult.error;
      if (deductionResult.error) throw deductionResult.error;
      if (expenseResult.error) throw expenseResult.error;

      const budgetWithItems: BudgetWithItems = {
        ...budgetData,
        income_items: incomeResult.data || [],
        deduction_items: deductionResult.data || [],
        expense_items: expenseResult.data || [],
      };

      setBudget(budgetWithItems);
      setMonthYear(budgetData.month_year);
      setIncomeItems(incomeResult.data?.map(item => ({
        id: item.id,
        item_name: item.item_name,
        date: item.date || '',
        full_amount: item.full_amount,
        notes: item.notes || '',
        category_id: item.category_id,
      })) || []);
      setDeductionItems(deductionResult.data?.map(item => ({
        id: item.id,
        item_name: item.item_name,
        date: item.date || '',
        full_amount: item.full_amount,
        notes: item.notes || '',
      })) || []);
      setExpenseItems(expenseResult.data?.map(item => ({
        id: item.id,
        item_name: item.item_name,
        date: item.date || '',
        full_amount: item.full_amount,
        amount_used: item.amount_used || 0,
        notes: item.notes || '',
        category_id: item.category_id,
      })) || []);
    } catch (error) {
      console.error('Error fetching budget:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = incomeItems.reduce((sum, item) => sum + (item.full_amount || 0), 0);
  const totalDeductions = deductionItems.reduce((sum, item) => sum + (item.full_amount || 0), 0);
  const primaryIncome = totalIncome - totalDeductions;
  const totalExpenses = expenseItems.reduce((sum, item) => sum + (item.amount_used || 0), 0);
  const savings = primaryIncome - totalExpenses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !budget) return;

    setSaving(true);
    try {
      // Update budget
      const { error: budgetError } = await supabase
        .from('budgets')
        .update({
          month_year: monthYear,
          primary_income: primaryIncome,
          total_expenses: totalExpenses,
          savings: savings,
        })
        .eq('id', budget.id);

      if (budgetError) throw budgetError;

      // Delete existing items
      await Promise.all([
        supabase.from('income_items').delete().eq('budget_id', budget.id),
        supabase.from('deduction_items').delete().eq('budget_id', budget.id),
        supabase.from('expense_items').delete().eq('budget_id', budget.id),
      ]);

      // Insert updated items
      const incomeData = incomeItems
        .filter(item => item.item_name.trim())
        .map(item => ({
          budget_id: budget.id,
          item_name: item.item_name,
          date: item.date || null,
          full_amount: item.full_amount || 0,
          notes: item.notes || null,
          category_id: item.category_id,
        }));

      const deductionData = deductionItems
        .filter(item => item.item_name.trim())
        .map(item => ({
          budget_id: budget.id,
          item_name: item.item_name,
          date: item.date || null,
          full_amount: item.full_amount || 0,
          notes: item.notes || null,
        }));

      const expenseData = expenseItems
        .filter(item => item.item_name.trim())
        .map(item => ({
          budget_id: budget.id,
          item_name: item.item_name,
          date: item.date || null,
          full_amount: item.full_amount || 0,
          amount_used: item.amount_used || 0,
          notes: item.notes || null,
          category_id: item.category_id,
        }));

      await Promise.all([
        incomeData.length > 0 ? supabase.from('income_items').insert(incomeData) : Promise.resolve(),
        deductionData.length > 0 ? supabase.from('deduction_items').insert(deductionData) : Promise.resolve(),
        expenseData.length > 0 ? supabase.from('expense_items').insert(expenseData) : Promise.resolve(),
      ]);

      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating budget:', error);
    } finally {
      setSaving(false);
    }
  };

  const addIncomeItem = () => {
    setIncomeItems([...incomeItems, { item_name: '', date: '', full_amount: 0, notes: '', category_id: null }]);
  };

  const removeIncomeItem = (index: number) => {
    setIncomeItems(incomeItems.filter((_, i) => i !== index));
  };

  const updateIncomeItem = (index: number, field: keyof IncomeItem, value: string | number | null) => {
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
    setExpenseItems([...expenseItems, { item_name: '', date: '', full_amount: 0, amount_used: 0, notes: '', category_id: null }]);
  };

  const removeExpenseItem = (index: number) => {
    setExpenseItems(expenseItems.filter((_, i) => i !== index));
  };

  const updateExpenseItem = (index: number, field: keyof ExpenseItem, value: string | number | null) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Budget not found</h2>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Edit Budget</h1>
          <p className="text-gray-600">Update your monthly budget details</p>
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
                    <th className="text-left py-2">Category</th>
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
                        <select
                          value={item.category_id || ''}
                          onChange={(e) => updateIncomeItem(index, 'category_id', e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                          <option value="">Select category</option>
                          {categories
                            .filter(cat => cat.type === 'income')
                            .map(category => (
                              <option key={category.id} value={category.id}>
                                {category.label}
                              </option>
                            ))}
                        </select>
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
                    <th className="text-left py-2">Category</th>
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
                        <select
                          value={item.category_id || ''}
                          onChange={(e) => updateExpenseItem(index, 'category_id', e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                          <option value="">Select category</option>
                          {categories
                            .filter(cat => cat.type === 'expense')
                            .map(category => (
                              <option key={category.id} value={category.id}>
                                {category.label}
                              </option>
                            ))}
                        </select>
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
                            value={item.amount_used}
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
          <Button type="submit" disabled={saving || !monthYear.trim()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
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