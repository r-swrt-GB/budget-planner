import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Budget } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { BudgetCard } from '../components/Dashboard/BudgetCard';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';

export function Dashboard() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchBudgets();
    }
  }, [user]);

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBudgets(budgets.filter(budget => budget.id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Dashboard</h1>
          <p className="text-gray-600">Manage your monthly budgets and track your finances</p>
        </div>
        <Button onClick={() => navigate('/budgets/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Plus className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first budget to start tracking your income and expenses
          </p>
          <Button onClick={() => navigate('/budgets/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onView={(id) => navigate(`/budgets/${id}`)}
              onEdit={(id) => navigate(`/budgets/${id}/edit`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}