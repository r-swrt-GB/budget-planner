import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Budget, BudgetWithItems } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { BudgetCard } from '../components/Dashboard/BudgetCard';
import { ExcelImportModal } from '../components/Dashboard/ExcelImportModal';
import { Button } from '../components/ui/Button';
import { Dropdown } from '../components/ui/Dropdown';
import { Plus, FileText, Upload, ChevronDown } from 'lucide-react';
import { exportBudgetToExcel } from '../lib/excelExport';
import { parseExcelFile } from '../lib/excelImport';

export function Dashboard() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
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

  const handleDownload = async (id: string) => {
    try {
      // Fetch the full budget data with all items
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', id)
        .single();

      if (budgetError) throw budgetError;

      // Fetch income items
      const { data: incomeItems, error: incomeError } = await supabase
        .from('income_items')
        .select('*')
        .eq('budget_id', id);

      if (incomeError) throw incomeError;

      // Fetch deduction items
      const { data: deductionItems, error: deductionError } = await supabase
        .from('deduction_items')
        .select('*')
        .eq('budget_id', id);

      if (deductionError) throw deductionError;

      // Fetch expense items
      const { data: expenseItems, error: expenseError } = await supabase
        .from('expense_items')
        .select('*')
        .eq('budget_id', id);

      if (expenseError) throw expenseError;

      // Create the full budget object with items
      const budgetWithItems: BudgetWithItems = {
        ...budgetData,
        income_items: incomeItems || [],
        deduction_items: deductionItems || [],
        expense_items: expenseItems || []
      };

      // Export to Excel
      exportBudgetToExcel(budgetWithItems);
    } catch (error) {
      console.error('Error downloading budget:', error);
      alert('Failed to download budget. Please try again.');
    }
  };

  const handleExcelImport = async (file: File) => {
    try {
      const importedData = await parseExcelFile(file);
      
      // Navigate to create budget page with imported data
      navigate('/budgets/create', { 
        state: { 
          importedData,
          skipRecurring: true 
        } 
      });
    } catch (error) {
      console.error('Error importing Excel file:', error);
      alert(error instanceof Error ? error.message : 'Failed to import Excel file. Please try again.');
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
        <Dropdown
          trigger={
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          }
          items={[
            {
              label: 'Create Manually',
              onClick: () => navigate('/budgets/create'),
              icon: <FileText className="h-4 w-4" />
            },
            {
              label: 'Import from Excel',
              onClick: () => setShowImportModal(true),
              icon: <Upload className="h-4 w-4" />
            }
          ]}
        />
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
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleExcelImport}
        userId={user?.id}
      />
    </div>
  );
}