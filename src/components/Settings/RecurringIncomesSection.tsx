import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DollarSign, Plus, Trash2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RecurringIncome } from '../../types';

interface RecurringIncomesSectionProps {
  userId: string;
}

export function RecurringIncomesSection({ userId }: RecurringIncomesSectionProps) {
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>([]);
  const [originalIncomes, setOriginalIncomes] = useState<RecurringIncome[]>([]);
  const [loadingIncomes, setLoadingIncomes] = useState(true);
  const [savingIncomes, setSavingIncomes] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (userId) {
      loadRecurringIncomes();
    }
  }, [userId]);

  useEffect(() => {
    // Check if there are changes by comparing current state with original
    const changesDetected = JSON.stringify(recurringIncomes) !== JSON.stringify(originalIncomes);
    setHasChanges(changesDetected);
  }, [recurringIncomes, originalIncomes]);

  const loadRecurringIncomes = async () => {
    setLoadingIncomes(true);
    try {
      const { data, error } = await supabase
        .from('recurring_incomes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const incomes = data || [];
      setRecurringIncomes(incomes);
      setOriginalIncomes(JSON.parse(JSON.stringify(incomes))); // Deep copy
    } catch (error) {
      console.error('Error loading recurring incomes:', error);
      setMessage({ type: 'error', text: 'Failed to load recurring incomes' });
    } finally {
      setLoadingIncomes(false);
    }
  };

  const addRecurringIncome = () => {
    const newIncome: RecurringIncome = {
      id: `temp-${Date.now()}`, // Temporary ID for new items
      user_id: userId,
      description: '',
      amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setRecurringIncomes([...recurringIncomes, newIncome]);
  };

  const updateRecurringIncome = (id: string, field: keyof RecurringIncome, value: string | number) => {
    setRecurringIncomes(recurringIncomes.map(income => 
      income.id === id ? { ...income, [field]: value } : income
    ));
  };

  const removeRecurringIncome = (id: string) => {
    setRecurringIncomes(recurringIncomes.filter(income => income.id !== id));
  };

  const saveAllChanges = async () => {
    setSavingIncomes(true);
    setMessage(null);

    try {
      // Separate new items (temp IDs) from existing items
      const newItems = recurringIncomes.filter(income => income.id.startsWith('temp-'));
      const existingItems = recurringIncomes.filter(income => !income.id.startsWith('temp-'));
      
      // Find items that were deleted
      const deletedItems = originalIncomes.filter(
        original => !existingItems.some(current => current.id === original.id)
      );

      // Delete removed items
      for (const item of deletedItems) {
        const { error } = await supabase
          .from('recurring_incomes')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
      }

      // Insert new items
      if (newItems.length > 0) {
        const insertData = newItems
          .filter(item => item.description.trim()) // Only insert items with descriptions
          .map(item => ({
            user_id: userId,
            description: item.description,
            amount: item.amount
          }));

        if (insertData.length > 0) {
          const { error } = await supabase
            .from('recurring_incomes')
            .insert(insertData);
          if (error) throw error;
        }
      }

      // Update existing items
      for (const item of existingItems) {
        const original = originalIncomes.find(orig => orig.id === item.id);
        if (original && (
          original.description !== item.description || 
          original.amount !== item.amount
        )) {
          const { error } = await supabase
            .from('recurring_incomes')
            .update({
              description: item.description,
              amount: item.amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          if (error) throw error;
        }
      }

      // Reload data to get fresh state with real IDs
      await loadRecurringIncomes();
      
      setMessage({ type: 'success', text: 'Recurring incomes saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);

    } catch (error) {
      console.error('Error saving recurring incomes:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save recurring incomes. Please try again.' 
      });
    } finally {
      setSavingIncomes(false);
    }
  };

  const discardChanges = () => {
    setRecurringIncomes(JSON.parse(JSON.stringify(originalIncomes)));
    setMessage(null);
  };

  return (
    <Card className="p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-gray-600" />
              Recurring Incomes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your recurring income sources for easier budget creation
            </p>
          </div>
          <Button
            onClick={addRecurringIncome}
            size="sm"
            variant="outline"
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Income
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

        {loadingIncomes ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading income items...</p>
          </div>
        ) : recurringIncomes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recurring incomes yet</p>
            <p className="text-sm">Add your income sources to use them in budget creation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-gray-700">Description</th>
                  <th className="text-left py-2 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recurringIncomes.map((income) => (
                  <tr key={income.id} className="border-b">
                    <td className="py-3 pr-4">
                      <Input
                        value={income.description}
                        onChange={(e) => updateRecurringIncome(income.id, 'description', e.target.value)}
                        placeholder="Income description"
                        className="max-w-sm"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">R</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={income.amount}
                          onChange={(e) => updateRecurringIncome(income.id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="max-w-32"
                        />
                      </div>
                    </td>
                    <td className="py-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeRecurringIncome(income.id)}
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
                disabled={savingIncomes}
              >
                Discard Changes
              </Button>
              <Button
                onClick={saveAllChanges}
                disabled={savingIncomes}
                size="sm"
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingIncomes ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
