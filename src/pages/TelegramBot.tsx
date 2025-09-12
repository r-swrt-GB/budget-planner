import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Bot, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export function TelegramBot() {
  const [botToken, setBotToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSavedToken();
    }
  }, [user]);

  const fetchSavedToken = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('telegram_bots')
        .select('bot_token')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      if (data) {
        setSavedToken(data.bot_token);
        setBotToken(data.bot_token);
      }
    } catch (error) {
      console.error('Error fetching bot token:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim()) {
      setMessage({ type: 'error', text: 'Please enter a bot token' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('telegram_bots')
        .upsert({
          user_id: user?.id,
          bot_token: botToken.trim(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSavedToken(botToken.trim());
      setMessage({ type: 'success', text: 'Bot token saved successfully!' });
    } catch (error) {
      console.error('Error saving bot token:', error);
      setMessage({ type: 'error', text: 'Failed to save bot token. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Telegram bot?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('telegram_bots')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setSavedToken('');
      setBotToken('');
      setMessage({ type: 'success', text: 'Bot disconnected successfully!' });
    } catch (error) {
      console.error('Error disconnecting bot:', error);
      setMessage({ type: 'error', text: 'Failed to disconnect bot. Please try again.' });
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Bot className="h-6 w-6 mr-2" />
          Telegram Bot Integration
        </h1>
        <p className="text-gray-600">Connect your Telegram bot to receive budget notifications and updates</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 1: Create a Telegram Bot</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Open Telegram and search for <strong>@BotFather</strong></li>
                <li>Start a chat with BotFather and send <code>/newbot</code></li>
                <li>Follow the instructions to create your bot</li>
                <li>Choose a name and username for your bot</li>
                <li>BotFather will give you a token - copy this token</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 2: Configure Your Bot</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Paste your bot token in the form on the right</li>
                <li>Click "Save Token" to connect your bot</li>
                <li>Start a chat with your bot in Telegram</li>
                <li>You'll receive budget notifications and updates</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <a
                href="https://core.telegram.org/bots#6-botfather"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                Official Telegram Bot Documentation
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Bot Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bot Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {savedToken ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Bot Connected</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Your Telegram bot is successfully connected and ready to send notifications.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Bot Token
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      value={savedToken}
                      readOnly
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Token is masked for security
                  </p>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Bot Token
                    </label>
                    <Input
                      type="text"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="Enter new bot token"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a new token to update your bot connection
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={saving || !botToken.trim() || botToken.trim() === savedToken}
                      className="flex-1"
                    >
                      {saving ? 'Updating...' : 'Update Token'}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDisconnect}
                      disabled={saving}
                    >
                      Disconnect
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bot Token
                  </label>
                  <Input
                    type="text"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Enter your bot token (e.g., 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)"
                    className="w-full"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This token will be securely stored and used to send you budget notifications
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={saving || !botToken.trim()}
                  className="w-full"
                >
                  {saving ? 'Saving...' : 'Save Token'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {savedToken && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Start a chat with your bot</p>
                  <p className="text-sm text-gray-600">Search for your bot in Telegram and send /start</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Receive notifications</p>
                  <p className="text-sm text-gray-600">Get budget updates, reminders, and alerts directly in Telegram</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Manage your budgets</p>
                  <p className="text-sm text-gray-600">Use commands to check balances and get budget summaries</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
