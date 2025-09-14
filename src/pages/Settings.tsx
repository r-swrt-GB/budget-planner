import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Mail, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Settings() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update name when user data becomes available
  useEffect(() => {
    if (user?.user_metadata?.name) {
      setName(user.user_metadata.name);
    }
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user || !name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid name' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: name.trim() }
      });

      if (authError) {
        throw authError;
      }

      // Update the public users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          name: name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) {
        throw dbError;
      }

      // Refresh user data to get the updated information
      await refreshUser();

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save settings. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {/* General Settings Section */}
      <Card className="p-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2 text-gray-600" />
            General Settings
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Update your personal information and account details
          </p>
        </div>

        <div className="space-y-6">
          {/* Success/Error Messages */}
          {message && (
            <div className={`p-4 rounded-md flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (message) setMessage(null);
              }}
              placeholder="Enter your full name"
              className="max-w-md"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="max-w-md bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email address cannot be changed for security reasons.
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading || !name.trim() || name.trim() === user?.user_metadata?.name}
              className="flex items-center"
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Future sections can be added here */}
      {/* For example: Notification Settings, Privacy Settings, etc. */}
    </div>
  );
}
