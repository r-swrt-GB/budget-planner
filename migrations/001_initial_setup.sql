-- ===================================
-- Budget Management App - Initial Setup
-- ===================================

-- Enable Row Level Security globally
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
DO $$ BEGIN
    CREATE TYPE budget_item_type AS ENUM ('income', 'deduction', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===================================
-- USERS TABLE
-- ===================================
-- Note: Supabase automatically creates auth.users table
-- We'll create a public.users table that references it

CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ===================================
-- BUDGETS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    primary_income DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    total_expenses DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    savings DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure one budget per user per month
    UNIQUE(user_id, month_year)
);

-- ===================================
-- INCOME ITEMS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS public.income_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    date DATE,
    full_amount DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ===================================
-- DEDUCTION ITEMS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS public.deduction_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    date DATE,
    full_amount DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ===================================
-- EXPENSE ITEMS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS public.expense_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    date DATE,
    full_amount DECIMAL(12, 2) NOT NULL,
    amount_used DECIMAL(12, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure amount_used doesn't exceed full_amount
    CONSTRAINT check_amount_used CHECK (amount_used IS NULL OR amount_used <= full_amount)
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON public.budgets(month_year);
CREATE INDEX IF NOT EXISTS idx_income_items_budget_id ON public.income_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_deduction_items_budget_id ON public.deduction_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_budget_id ON public.expense_items(budget_id);

-- ===================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deduction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Budget policies
CREATE POLICY "Users can view own budgets" ON public.budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets" ON public.budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON public.budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON public.budgets
    FOR DELETE USING (auth.uid() = user_id);

-- Income items policies
CREATE POLICY "Users can view own income items" ON public.income_items
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = income_items.budget_id
        )
    );

CREATE POLICY "Users can create income items for own budgets" ON public.income_items
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = income_items.budget_id
        )
    );

CREATE POLICY "Users can update own income items" ON public.income_items
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = income_items.budget_id
        )
    );

CREATE POLICY "Users can delete own income items" ON public.income_items
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = income_items.budget_id
        )
    );

-- Deduction items policies (similar pattern)
CREATE POLICY "Users can view own deduction items" ON public.deduction_items
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = deduction_items.budget_id
        )
    );

CREATE POLICY "Users can create deduction items for own budgets" ON public.deduction_items
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = deduction_items.budget_id
        )
    );

CREATE POLICY "Users can update own deduction items" ON public.deduction_items
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = deduction_items.budget_id
        )
    );

CREATE POLICY "Users can delete own deduction items" ON public.deduction_items
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = deduction_items.budget_id
        )
    );

-- Expense items policies (similar pattern)
CREATE POLICY "Users can view own expense items" ON public.expense_items
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = expense_items.budget_id
        )
    );

CREATE POLICY "Users can create expense items for own budgets" ON public.expense_items
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = expense_items.budget_id
        )
    );

CREATE POLICY "Users can update own expense items" ON public.expense_items
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = expense_items.budget_id
        )
    );

CREATE POLICY "Users can delete own expense items" ON public.expense_items
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM public.budgets WHERE id = expense_items.budget_id
        )
    );

-- ===================================
-- FUNCTIONS AND TRIGGERS
-- ===================================

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_items_updated_at BEFORE UPDATE ON public.income_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deduction_items_updated_at BEFORE UPDATE ON public.deduction_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_items_updated_at BEFORE UPDATE ON public.expense_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================================
-- SAMPLE DATA (OPTIONAL)
-- ===================================
-- Uncomment the following to insert sample data for testing

/*
-- Insert a sample user (you would get this ID from auth.users after registration)
INSERT INTO public.users (id, email, name) VALUES
    ('12345678-1234-1234-1234-123456789012', 'test@example.com', 'Test User');

-- Insert a sample budget
INSERT INTO public.budgets (user_id, month_year, primary_income, total_expenses, savings) VALUES
    ('12345678-1234-1234-1234-123456789012', '2024-01', 5000.00, 3500.00, 1500.00);

-- Get the budget ID for sample items
-- INSERT INTO public.income_items (budget_id, item_name, date, full_amount, notes) VALUES
--     ((SELECT id FROM public.budgets WHERE month_year = '2024-01'), 'Salary', '2024-01-01', 5000.00, 'Monthly salary');
*/
