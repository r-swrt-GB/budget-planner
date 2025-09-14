import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Minus, Plus, Trash2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RecurringDeduction } from '../../types';

interface RecurringDeductionsSectionProps {
  userId: string;
}

export function RecurringDeductionsSection({ userId }: RecurringDeductionsSectionProps) {
  const [recurringDeductions, setRecurringDeductions] = useState<RecurringDeduction[]>([]);
  const [originalDeductions, setOriginalDeductions] = useState<RecurringDeduction[]>([]);
  const [loadingDeductions, setLoadingDeductions] = useState(true);
  const [savingDeductions, setSavingDeductions] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (userId) {
      loadRecurringDeductions();
    }
  }, [userId]);

  useEffect(() => {
    // Check if there are changes by comparing current state with original
    const changesDetected = JSON.stringify(recurringDeductions) !== JSON.stringify(originalDeductions);
    setHasChanges(changesDetected);
  }, [recurringDeductions, originalDeductions]);

  const loadRecurringDeductions = async () => {
    setLoadingDeductions(true);
    try {
      const { data, error } = await supabase
        .from('recurring_deductions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const deductions = data || [];
      setRecurringDeductions(deductions);
      setOriginalDeductions(JSON.parse(JSON.stringify(deductions))); // Deep copy
    } catch (error) {
      console.error('Error loading recurring deductions:', error);
      setMessage({ type: 'error', text: 'Failed to load recurring deductions' });
    } finally {
      setLoadingDeductions(false);
    }
  };

  const addRecurringDeduction = () => {
    const newDeduction: RecurringDeduction = {
      id: `temp-${Date.now()}`, // Temporary ID for new items
      user_id: userId,
      description: '',
      amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setRecurringDeductions([...recurringDeductions, newDeduction]);
  };

  const updateRecurringDeduction = (id: string, field: keyof RecurringDeduction, value: string | number) => {
    setRecurringDeductions(recurringDeductions.map(deduction => 
      deduction.id === id ? { ...deduction, [field]: value } : deduction
    ));
  };

  const removeRecurringDeduction = (id: string) => {
    setRecurringDeductions(recurringDeductions.filter(deduction => deduction.id !== id));
  };

  const saveAllChanges = async () => {
    setSavingDeductions(true);
    setMessage(null);

    try {
      // Separate new items (temp IDs) from existing items
      const newItems = recurringDeductions.filter(deduction => deduction.id.startsWith('temp-'));
      const existingItems = recurringDeductions.filter(deduction => !deduction.id.startsWith('temp-'));
      
      // Find items that were deleted
      const deletedItems = originalDeductions.filter(
        original => !existingItems.some(current => current.id === original.id)
      );

      // Delete removed items
      for (const item of deletedItems) {
        const { error } = await supabase
          .from('recurring_deductions')
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
            .from('recurring_deductions')
            .insert(insertData);
          if (error) throw error;
        }
      }

      // Update existing items
      for (const item of existingItems) {
        const original = originalDeductions.find(orig => orig.id === item.id);
        if (original && (
          original.description !== item.description || 
          original.amount !== item.amount
        )) {
          const { error } = await supabase
            .from('recurring_deductions')
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
      await loadRecurringDeductions();
      
      setMessage({ type: 'success', text: 'Recurring deductions saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);

    } catch (error) {
      console.error('Error saving recurring deductions:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save recurring deductions. Please try again.' 
      });
    } finally {
      setSavingDeductions(false);
    }
  };

  const discardChanges = () => {
    setRecurringDeductions(JSON.parse(JSON.stringify(originalDeductions)));
    setMessage(null);
  };

  return (
    <Card className="p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Minus className="h-5 w-5 mr-2 text-gray-600" />
              Recurring Deductions
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your recurring deduction items for easier budget creation
            </p>
          </div>
          <Button
            onClick={addRecurringDeduction}
            size="sm"
            variant="outline"
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Deduction
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

        {loadingDeductions ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading deduction items...</p>
          </div>
        ) : recurringDeductions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Minus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recurring deductions yet</p>
            <p className="text-sm">Add your deduction items to use them in budget creation</p>
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
                {recurringDeductions.map((deduction) => (
                  <tr key={deduction.id} className="border-b">
                    <td className="py-3 pr-4">
                      <Input
                        value={deduction.description}
                        onChange={(e) => updateRecurringDeduction(deduction.id, 'description', e.target.value)}
                        placeholder="Deduction description"
                        className="max-w-sm"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-1">R</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={deduction.amount}
                          onChange={(e) => updateRecurringDeduction(deduction.id, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="max-w-32"
                        />
                      </div>
                    </td>
                    <td className="py-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeRecurringDeduction(deduction.id)}
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
                disabled={savingDeductions}
              >
                Discard Changes
              </Button>
              <Button
                onClick={saveAllChanges}
                disabled={savingDeductions}
                size="sm"
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingDeductions ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
