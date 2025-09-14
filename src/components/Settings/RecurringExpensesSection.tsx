import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CreditCard, Plus, Trash2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RecurringExpense } from '../../types';

interface RecurringExpensesSectionProps {
  userId: string;
}

export function RecurringExpensesSection({ userId }: RecurringExpensesSectionProps) {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [originalExpenses, setOriginalExpenses] = useState<RecurringExpense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [savingExpenses, setSavingExpenses] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (userId) {
      loadRecurringExpenses();
    }
  }, [userId]);

  useEffect(() => {
    // Check if there are changes by comparing current state with original
    const changesDetected = JSON.stringify(recurringExpenses) !== JSON.stringify(originalExpenses);
    setHasChanges(changesDetected);
  }, [recurringExpenses, originalExpenses]);

  const loadRecurringExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const expenses = data || [];
      setRecurringExpenses(expenses);
      setOriginalExpenses(JSON.parse(JSON.stringify(expenses))); // Deep copy
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
      setMessage({ type: 'error', text: 'Failed to load recurring expenses' });
    } finally {
      setLoadingExpenses(false);
    }
  };

  const addRecurringExpense = () => {
    const newExpense: RecurringExpense = {
      id: `temp-${Date.now()}`, 
      user_id: userId,
      description: '',
      full_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setRecurringExpenses([...recurringExpenses, newExpense]);
  };

  const updateRecurringExpense = (id: string, field: keyof RecurringExpense, value: string | number) => {
    setRecurringExpenses(recurringExpenses.map(expense => 
      expense.id === id ? { ...expense, [field]: value } : expense
    ));
  };

  const removeRecurringExpense = (id: string) => {
    setRecurringExpenses(recurringExpenses.filter(expense => expense.id !== id));
  };

  const saveAllChanges = async () => {
    setSavingExpenses(true);
    setMessage(null);

    try {

      const newItems = recurringExpenses.filter(expense => expense.id.startsWith('temp-'));
      const existingItems = recurringExpenses.filter(expense => !expense.id.startsWith('temp-'));
      

      const deletedItems = originalExpenses.filter(
        original => !existingItems.some(current => current.id === original.id)
      );


      for (const item of deletedItems) {
        const { error } = await supabase
          .from('recurring_expenses')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
      }

      // Insert new items
      if (newItems.length > 0) {
        const insertData = newItems
          .filter(item => item.description.trim()) 
          .map(item => ({
            user_id: userId,
            description: item.description,
            full_amount: item.full_amount
          }));

        if (insertData.length > 0) {
          const { error } = await supabase
            .from('recurring_expenses')
            .insert(insertData);
          if (error) throw error;
        }
      }


      for (const item of existingItems) {
        const original = originalExpenses.find(orig => orig.id === item.id);
        if (original && (
          original.description !== item.description || 
          original.full_amount !== item.full_amount
        )) {
          const { error } = await supabase
            .from('recurring_expenses')
            .update({
              description: item.description,
              full_amount: item.full_amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          if (error) throw error;
        }
      }

      await loadRecurringExpenses();
      
      setMessage({ type: 'success', text: 'Recurring expenses saved successfully!' });
      
      setTimeout(() => {
        setMessage(null);
      }, 3000);

    } catch (error) {
      console.error('Error saving recurring expenses:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save recurring expenses. Please try again.' 
      });
    } finally {
      setSavingExpenses(false);
    }
  };

  const discardChanges = () => {
    setRecurringExpenses(JSON.parse(JSON.stringify(originalExpenses)));
    setMessage(null);
  };

  return (
    <Card className="p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
              Recurring Expenses
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your recurring expense items for easier budget creation
            </p>
          </div>
          <Button
            onClick={addRecurringExpense}
            size="sm"
            variant="outline"
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Success/Error Messages */}
        {message && (
          <div className={`p-4 rounded-md flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {loadingExpenses ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading expense items...</p>
          </div>
        ) : recurringExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recurring expenses yet</p>
            <p className="text-sm">Add your expense items to use them in budget creation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-gray-700">Description</th>
                  <th className="text-left py-2 font-medium text-gray-700">Budget Amount</th>
                  <th className="text-left py-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recurringExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b">
                    <td className="py-3 pr-4">
                      <Input
                        value={expense.description}
                        onChange={(e) => updateRecurringExpense(expense.id, 'description', e.target.value)}
                        placeholder="Expense description"
                        className="max-w-sm"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">R</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={expense.full_amount}
                          onChange={(e) => updateRecurringExpense(expense.id, 'full_amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="max-w-32"
                        />
                      </div>
                    </td>
                    <td className="py-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeRecurringExpense(expense.id)}
                        className="flex items-center"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Save/Discard Actions */}
        {hasChanges && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              You have unsaved changes
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={discardChanges}
                disabled={savingExpenses}
              >
                Discard Changes
              </Button>
              <Button
                onClick={saveAllChanges}
                disabled={savingExpenses}
                size="sm"
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingExpenses ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
