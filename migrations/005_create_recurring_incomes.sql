-- ===================================
-- Recurring Incomes Table
-- ===================================
-- Create table for user-specific recurring income items
-- These will be templates that users can use when creating budgets

CREATE TABLE IF NOT EXISTS public.recurring_incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_incomes_user_id ON public.recurring_incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_incomes_created_at ON public.recurring_incomes(created_at);

-- Enable Row Level Security
ALTER TABLE public.recurring_incomes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own recurring incomes
CREATE POLICY "Users can view their own recurring incomes" ON public.recurring_incomes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring incomes" ON public.recurring_incomes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring incomes" ON public.recurring_incomes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring incomes" ON public.recurring_incomes
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_recurring_incomes_updated_at 
    BEFORE UPDATE ON public.recurring_incomes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default recurring income for all existing users
INSERT INTO public.recurring_incomes (user_id, description, amount)
SELECT 
    id as user_id,
    'Salary' as description,
    0 as amount
FROM public.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.recurring_incomes 
    WHERE recurring_incomes.user_id = users.id
);

-- Add comment to table
COMMENT ON TABLE public.recurring_incomes IS 'User-specific recurring income templates for budget creation';
COMMENT ON COLUMN public.recurring_incomes.description IS 'Description of the recurring income source';
COMMENT ON COLUMN public.recurring_incomes.amount IS 'Default amount for this income source';
