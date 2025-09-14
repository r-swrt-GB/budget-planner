import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { BudgetWithItems, Category } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ArrowLeft, Edit } from 'lucide-react';
import { format } from 'date-fns';

export function ViewBudget() {
  const { id } = useParams<{ id: string }>();
  const [budget, setBudget] = useState<BudgetWithItems | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
        .select('*');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getCategoryDisplay = (categoryId: string | null) => {
    if (!categoryId) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
          <div className="w-2 h-2 rounded-full mr-1 bg-gray-400"></div>
          General
        </span>
      );
    }
    
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
          <div className="w-2 h-2 rounded-full mr-1 bg-gray-400"></div>
          Unknown
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
        <div 
          className="w-2 h-2 rounded-full mr-1" 
          style={{ backgroundColor: category.color }}
        ></div>
        {category.label}
      </span>
    );
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
    } catch (error) {
      console.error('Error fetching budget:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{budget.month_year}</h1>
            <p className="text-gray-600">
              Created on {format(new Date(budget.created_at), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/budgets/${budget.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Budget
        </Button>
      </div>

      <div className="space-y-6">
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
                  R{budget.primary_income.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-green-600">Income - Deductions</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600">
                  R{budget.total_expenses.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-red-600">Sum of Amount Used</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${budget.savings >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`text-lg font-semibold ${budget.savings >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  Savings
                </h3>
                <p className={`text-2xl font-bold ${budget.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {budget.savings >= 0 ? '+' : ''}R{Math.abs(budget.savings).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-sm ${budget.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Primary Income - Expenses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Items */}
        <Card>
          <CardHeader>
            <CardTitle>Income Items</CardTitle>
          </CardHeader>
          <CardContent>
            {budget.income_items.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No income items recorded</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Item</th>
                      <th className="text-left py-2">Category</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.income_items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">{item.item_name}</td>
                        <td className="py-2">
                          {getCategoryDisplay(item.category_id)}
                        </td>
                        <td className="py-2">
                          {item.date ? format(new Date(item.date), 'MMM dd, yyyy') : '-'}
                        </td>
                        <td className="py-2 font-medium text-green-600">
                          R{item.full_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 text-gray-600">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="py-2">Total Income</td>
                      <td className="py-2"></td>
                      <td className="py-2"></td>
                      <td className="py-2 text-green-600">
                        R{budget.income_items.reduce((sum, item) => sum + item.full_amount, 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deduction Items */}
        <Card>
          <CardHeader>
            <CardTitle>Deduction Items</CardTitle>
          </CardHeader>
          <CardContent>
            {budget.deduction_items.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No deduction items recorded</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Item</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.deduction_items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">{item.item_name}</td>
                        <td className="py-2">
                          {item.date ? format(new Date(item.date), 'MMM dd, yyyy') : '-'}
                        </td>
                        <td className="py-2 font-medium text-red-600">
                          R{item.full_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 text-gray-600">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="py-2">Total Deductions</td>
                      <td className="py-2"></td>
                      <td className="py-2 text-red-600">
                        R{budget.deduction_items.reduce((sum, item) => sum + item.full_amount, 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Items */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Items</CardTitle>
          </CardHeader>
          <CardContent>
            {budget.expense_items.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expense items recorded</p>
            ) : (
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
                    </tr>
                  </thead>
                  <tbody>
                    {budget.expense_items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">{item.item_name}</td>
                        <td className="py-2">
                          {getCategoryDisplay(item.category_id)}
                        </td>
                        <td className="py-2">
                          {item.date ? format(new Date(item.date), 'MMM dd, yyyy') : '-'}
                        </td>
                        <td className="py-2 font-medium">
                          R{item.full_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 font-medium text-red-600">
                          R{(item.amount_used || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 text-gray-600">{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="py-2">Total Expenses</td>
                      <td className="py-2"></td>
                      <td className="py-2"></td>
                      <td className="py-2"></td>
                      <td className="py-2 text-red-600">
                        R{budget.expense_items.reduce((sum, item) => sum + (item.amount_used || 0), 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}