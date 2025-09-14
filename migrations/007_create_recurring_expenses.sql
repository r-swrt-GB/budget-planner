-- ===================================
-- Recurring Expenses Table
-- ===================================
-- Create table for user-specific recurring expense items
-- These will be templates that users can use when creating budgets

CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    description VARCHAR(255) NOT NULL,
    full_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_id ON public.recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_created_at ON public.recurring_expenses(created_at);

-- Enable Row Level Security
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own recurring expenses
CREATE POLICY "Users can view their own recurring expenses" ON public.recurring_expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring expenses" ON public.recurring_expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses" ON public.recurring_expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses" ON public.recurring_expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at (reuse existing function)
CREATE TRIGGER update_recurring_expenses_updated_at 
    BEFORE UPDATE ON public.recurring_expenses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default recurring expenses for all existing users
-- Using the most common expense items from the application
INSERT INTO public.recurring_expenses (user_id, description, full_amount)
SELECT 
    id as user_id,
    unnest(ARRAY[
        'Medical',
        'Car insurance',
        'Phone insurance',
        'Rent',
        'Gym',
        'Electricity',
        'Petrol',
        'Data / Call minutes / Wifi',
        'Food, meat vegetables fruits',
        'Eating out',
        'Toiletries & Cleaning agents'
    ]) as description,
    0 as full_amount
FROM public.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.recurring_expenses 
    WHERE recurring_expenses.user_id = users.id
);

-- Add comment to table
COMMENT ON TABLE public.recurring_expenses IS 'User-specific recurring expense templates for budget creation';
COMMENT ON COLUMN public.recurring_expenses.description IS 'Description of the recurring expense item';
COMMENT ON COLUMN public.recurring_expenses.full_amount IS 'Default full amount budgeted for this expense item';
