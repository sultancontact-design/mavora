'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Settings as SettingsIcon,
  Save,
  Shield,
  Bell,
  CreditCard,
  Globe,
  MessageSquare,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

// Types
interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  category: string | null;
  updated_at: string;
}

interface SettingsGroup {
  category: string;
  settings: PlatformSetting[];
}

export default function SettingsPanel() {
  const { t, locale } = useTranslation();
  
  // State
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Edited values
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  
  // Active tab
  const [activeTab, setActiveTab] = useState('general');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/settings');
      
      if (!res.ok) throw new Error('Failed to fetch settings');

      const data = await res.json();
      const settingsData = data.data || [];
      setSettings(settingsData);
      
      // Initialize edited values
      const initialValues: Record<string, string> = {};
      for (const s of settingsData) {
        initialValues[s.key] = s.value;
      }
      setEditedValues(initialValues);
    } catch (err) {
      console.error('Fetch settings error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSetting = async (key: string) => {
    try {
      setSaving(true);
      setSuccessMessage(null);

      const res = await fetch(`/api/admin/settings/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: editedValues[key],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save setting');
      }

      setSuccessMessage(`Setting "${key}" saved successfully`);
      fetchSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Save setting error:', err);
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setSuccessMessage(null);

      // Find all changed values
      const changes = Object.entries(editedValues)
        .filter(([key, value]) => {
          const original = settings.find(s => s.key === key);
          return original && original.value !== value;
        })
        .map(([key, value]) => ({ key, value }));

      if (changes.length === 0) {
        setSuccessMessage('No changes to save');
        return;
      }

      // Save each change
      for (const change of changes) {
        const res = await fetch(`/api/admin/settings/${change.key}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: change.value }),
        });

        if (!res.ok) {
          throw new Error(`Failed to save ${change.key}`);
        }
      }

      setSuccessMessage(`${changes.length} setting(s) saved successfully`);
      fetchSettings();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Save all error:', err);
      alert(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Group settings by category
  const getSettingsByCategory = (category: string): PlatformSetting[] => {
    return settings.filter(s => s.category === category || 
      (category === 'general' && !s.category));
  };

  const renderSettingInput = (setting: PlatformSetting) => {
    const currentValue = editedValues[setting.key] ?? setting.value;
    const isChanged = currentValue !== setting.value;

    switch (setting.value_type) {
      case 'boolean':
        return (
          <Switch
            checked={currentValue === 'true'}
            onCheckedChange={(checked) => handleValueChange(setting.key, checked.toString())}
          />
        );
      
      case 'number':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => handleValueChange(setting.key, e.target.value)}
              className="max-w-[200px]"
            />
            {isChanged && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveSetting(setting.key)}
                disabled={saving}
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      
      case 'json':
        return (
          <div className="space-y-2">
            <Textarea
              value={currentValue}
              onChange={(e) => handleValueChange(setting.key, e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            {isChanged && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveSetting(setting.key)}
                disabled={saving}
              >
                <Save className={`h-3 w-3 ${locale === 'ar' ? 'ml-1 mr-0' : 'mr-1 ml-0'}`} />
                Save
              </Button>
            )}
          </div>
        );
      
      case 'string':
      default:
        if (setting.key.includes('description') || setting.key.includes('terms')) {
          return (
            <div className="space-y-2">
              <Textarea
                value={currentValue}
                onChange={(e) => handleValueChange(setting.key, e.target.value)}
                rows={4}
              />
              {isChanged && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveSetting(setting.key)}
                  disabled={saving}
                >
                  <Save className={`h-3 w-3 ${locale === 'ar' ? 'ml-1 mr-0' : 'mr-1 ml-0'}`} />
                  Save
                </Button>
              )}
            </div>
          );
        }
        
        return (
          <div className="flex items-center gap-2">
            <Input
              value={currentValue}
              onChange={(e) => handleValueChange(setting.key, e.target.value)}
              className="max-w-md"
            />
            {isChanged && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveSetting(setting.key)}
                disabled={saving}
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
    }
  };

  const getSettingLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-6 w-6 text-gray-600" />
              <CardTitle className="text-lg font-medium">Platform Settings</CardTitle>
              <Badge variant="outline">{settings.length} settings</Badge>
            </div>
            
            <Button onClick={handleSaveAll} disabled={saving}>
              {saving ? (
                <Loader2 className={`h-4 w-4 ${locale === 'ar' ? 'ml-2 mr-0' : 'mr-2 ml-0'} animate-spin`} />
              ) : (
                <Save className={`h-4 w-4 ${locale === 'ar' ? 'ml-2 mr-0' : 'mr-2 ml-0'}`} />
              )}
              Save All Changes
            </Button>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <Check className="h-4 w-4" />
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              {error}
              <Button variant="link" size="sm" onClick={fetchSettings}>
                Retry
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {loading ? (
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : settings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <SettingsIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('admin.no_settings')}</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="general" className="gap-2">
                  <Globe className="h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="payments" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Content
                </TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">General Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {getSettingsByCategory('general').map((setting) => (
                      <div key={setting.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b last:border-0">
                        <div className="flex-1 max-w-md">
                          <label className="font-medium text-gray-900 dark:text-white">
                            {getSettingLabel(setting.key)}
                          </label>
                          {setting.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 sm:mt-0">
                          {renderSettingInput(setting)}
                        </div>
                      </div>
                    ))}
                    {getSettingsByCategory('general').length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No general settings configured
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {getSettingsByCategory('security').map((setting) => (
                      <div key={setting.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b last:border-0">
                        <div className="flex-1 max-w-md">
                          <label className="font-medium text-gray-900 dark:text-white">
                            {getSettingLabel(setting.key)}
                          </label>
                          {setting.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 sm:mt-0">
                          {renderSettingInput(setting)}
                        </div>
                      </div>
                    ))}
                    
                    {/* Default security settings if none exist */}
                    {getSettingsByCategory('security').length === 0 && (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b">
                          <div className="flex-1 max-w-md">
                            <label className="font-medium text-gray-900 dark:text-white">
                              Banned Words
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Comma-separated list of banned words
                            </p>
                          </div>
                          <div className="mt-2 sm:mt-0">
                            <Textarea
                              placeholder="spam, scam, fake..."
                              className="max-w-md"
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b">
                          <div className="flex-1 max-w-md">
                            <label className="font-medium text-gray-900 dark:text-white">
                              Require Email Verification
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              New users must verify their email
                            </p>
                          </div>
                          <div className="mt-2 sm:mt-0">
                            <Switch defaultChecked />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 max-w-md">
                            <label className="font-medium text-gray-900 dark:text-white">
                              Max Login Attempts
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Before account lockout
                            </p>
                          </div>
                          <div className="mt-2 sm:mt-0">
                            <Input type="number" defaultValue="5" className="w-[100px]" />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payment Settings */}
              <TabsContent value="payments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Payment Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {getSettingsByCategory('payments').map((setting) => (
                      <div key={setting.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b last:border-0">
                        <div className="flex-1 max-w-md">
                          <label className="font-medium text-gray-900 dark:text-white">
                            {getSettingLabel(setting.key)}
                          </label>
                          {setting.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 sm:mt-0">
                          {renderSettingInput(setting)}
                        </div>
                      </div>
                    ))}
                    {getSettingsByCategory('payments').length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No payment settings configured
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notification Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {getSettingsByCategory('notifications').map((setting) => (
                      <div key={setting.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b last:border-0">
                        <div className="flex-1 max-w-md">
                          <label className="font-medium text-gray-900 dark:text-white">
                            {getSettingLabel(setting.key)}
                          </label>
                          {setting.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 sm:mt-0">
                          {renderSettingInput(setting)}
                        </div>
                      </div>
                    ))}
                    {getSettingsByCategory('notifications').length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No notification settings configured
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Settings */}
              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Content Moderation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {getSettingsByCategory('content').map((setting) => (
                      <div key={setting.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b last:border-0">
                        <div className="flex-1 max-w-md">
                          <label className="font-medium text-gray-900 dark:text-white">
                            {getSettingLabel(setting.key)}
                          </label>
                          {setting.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {setting.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 sm:mt-0">
                          {renderSettingInput(setting)}
                        </div>
                      </div>
                    ))}
                    {getSettingsByCategory('content').length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No content moderation settings configured
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
