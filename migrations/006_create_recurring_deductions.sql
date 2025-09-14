-- ===================================
-- Recurring Deductions Table
-- ===================================
-- Create table for user-specific recurring deduction items
-- These will be templates that users can use when creating budgets

CREATE TABLE IF NOT EXISTS public.recurring_deductions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_deductions_user_id ON public.recurring_deductions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_deductions_created_at ON public.recurring_deductions(created_at);

-- Enable Row Level Security
ALTER TABLE public.recurring_deductions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own recurring deductions
CREATE POLICY "Users can view their own recurring deductions" ON public.recurring_deductions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring deductions" ON public.recurring_deductions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring deductions" ON public.recurring_deductions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring deductions" ON public.recurring_deductions
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at (reuse existing function)
CREATE TRIGGER update_recurring_deductions_updated_at 
    BEFORE UPDATE ON public.recurring_deductions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default recurring deductions for all existing users
INSERT INTO public.recurring_deductions (user_id, description, amount)
SELECT 
    id as user_id,
    unnest(ARRAY['Tax', 'U.I.F']) as description,
    0 as amount
FROM public.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.recurring_deductions 
    WHERE recurring_deductions.user_id = users.id
);

-- Add comment to table
COMMENT ON TABLE public.recurring_deductions IS 'User-specific recurring deduction templates for budget creation';
COMMENT ON COLUMN public.recurring_deductions.description IS 'Description of the recurring deduction item';
COMMENT ON COLUMN public.recurring_deductions.amount IS 'Default amount for this deduction item';
