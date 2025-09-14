export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Category {
  id: string;
  user_id: string;
  label: string;
  color: string;
  type: 'income' | 'expense';
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month_year: string;
  primary_income: number;
  total_expenses: number;
  savings: number;
  created_at: string;
  updated_at: string;
}

export interface IncomeItem {
  id: string;
  budget_id: string;
  item_name: string;
  date: string | null;
  full_amount: number;
  notes: string | null;
  category_id: string | null;
}

export interface DeductionItem {
  id: string;
  budget_id: string;
  item_name: string;
  date: string | null;
  full_amount: number;
  notes: string | null;
}

export interface ExpenseItem {
  id: string;
  budget_id: string;
  item_name: string;
  date: string | null;
  full_amount: number;
  amount_used: number | null;
  notes: string | null;
  category_id: string | null;
}

export interface BudgetWithItems extends Budget {
  income_items: IncomeItem[];
  deduction_items: DeductionItem[];
  expense_items: ExpenseItem[];
}