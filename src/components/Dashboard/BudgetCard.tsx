import React from 'react';
import { Budget } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface BudgetCardProps {
  budget: Budget;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BudgetCard({ budget, onView, onEdit, onDelete }: BudgetCardProps) {
  const savingsColor = budget.savings >= 0 ? 'text-green-600' : 'text-red-600';
  const savingsIcon = budget.savings >= 0 ? '+' : '';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{budget.month_year}</CardTitle>
        <p className="text-sm text-gray-500">
          Created {format(new Date(budget.created_at), 'MMM dd, yyyy')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Primary Income:</span>
            <span className="font-medium text-green-600">
              R{budget.primary_income.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Expenses:</span>
            <span className="font-medium text-red-600">
              R{budget.total_expenses.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-sm font-medium">Savings:</span>
            <span className={`font-bold ${savingsColor}`}>
              {savingsIcon}R{Math.abs(budget.savings).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(budget.id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(budget.id)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(budget.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}