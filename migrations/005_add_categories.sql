-- ===================================
-- Add Categories Table
-- ===================================

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    label VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6b7280', -- Hex color code
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure unique category names per user per type
    UNIQUE(user_id, label, type)
);

-- Add category_id columns to existing tables
ALTER TABLE public.income_items 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.expense_items 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_income_items_category_id ON public.income_items(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_category_id ON public.expense_items(category_id);

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories policies - users can only see their own categories
CREATE POLICY "Users can view own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default "General" categories for existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM public.users LOOP
        -- Insert default income category
        INSERT INTO public.categories (user_id, label, color, type)
        VALUES (user_record.id, 'General', '#6b7280', 'income')
        ON CONFLICT (user_id, label, type) DO NOTHING;
        
        -- Insert default expense category
        INSERT INTO public.categories (user_id, label, color, type)
        VALUES (user_record.id, 'General', '#6b7280', 'expense')
        ON CONFLICT (user_id, label, type) DO NOTHING;
    END LOOP;
END $$;

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default income category
    INSERT INTO public.categories (user_id, label, color, type)
    VALUES (NEW.id, 'General', '#6b7280', 'income');
    
    -- Create default expense category
    INSERT INTO public.categories (user_id, label, color, type)
    VALUES (NEW.id, 'General', '#6b7280', 'expense');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create default categories for new users
CREATE TRIGGER on_user_created_categories
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.create_default_categories();
