-- Fix foreign key constraint issue by ensuring user exists in public.users
-- This migration handles existing users and improves the user creation trigger

-- First, let's insert any existing auth users into public.users table
INSERT INTO public.users (id, email, name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'name', 
            NEW.raw_user_meta_data->>'full_name',
            NEW.email
        )
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(
            NEW.raw_user_meta_data->>'name', 
            NEW.raw_user_meta_data->>'full_name',
            NEW.email
        ),
        updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create trigger for updates to sync changes
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
