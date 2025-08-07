import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { 
  Globe, 
  Languages, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Edit,
  Trash2,
  Check,
  X,
  Clock,
  User
} from 'lucide-react';
import axios from 'axios';

const LocalizationManagement = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [content, setContent] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    language: '',
    type: '',
    category: '',
    key: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'content':
          const contentResponse = await axios.get('/api/admin/localized-content');
          setContent(contentResponse.data.data.content);
          break;
        case 'languages':
          const languagesResponse = await axios.get('/api/admin/language-settings');
          setLanguages(languagesResponse.data.data.languages);
          break;
        case 'translations':
          const translationsResponse = await axios.get('/api/admin/translations');
          setTranslations(translationsResponse.data.data.translations);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', text: 'Pending' },
      translated: { color: 'bg-blue-500', text: 'Translated' },
      reviewed: { color: 'bg-purple-500', text: 'Reviewed' },
      approved: { color: 'bg-green-500', text: 'Approved' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-500', text: status };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getContentTypeBadge = (type) => {
    const typeConfig = {
      ui_text: { color: 'bg-blue-500', text: 'UI Text' },
      notification: { color: 'bg-green-500', text: 'Notification' },
      email: { color: 'bg-purple-500', text: 'Email' },
      sms: { color: 'bg-orange-500', text: 'SMS' },
      help: { color: 'bg-indigo-500', text: 'Help' }
    };
    
    const config = typeConfig[type] || { color: 'bg-gray-500', text: type };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Localization Management</h1>
          <p className="text-gray-400 mt-2">
            Manage multi-language content, language settings, and translation workflow
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button className="flex items-center space-x-2 bg-primary hover:bg-primary-dark">
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-background-secondary border border-border">
          <TabsTrigger 
            value="content" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Content Management
          </TabsTrigger>
          <TabsTrigger 
            value="languages" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Languages className="w-4 h-4 mr-2" />
            Language Settings
          </TabsTrigger>
          <TabsTrigger 
            value="translations" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Globe className="w-4 h-4 mr-2" />
            Translation Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <ContentManagementTab 
            content={content} 
            loading={loading}
            filters={filters}
            onFilterChange={handleFilterChange}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          <LanguageSettingsTab 
            languages={languages} 
            loading={loading}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="translations" className="space-y-6">
          <TranslationManagementTab 
            translations={translations} 
            loading={loading}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Content Management Tab Component
const ContentManagementTab = ({ content, loading, filters, onFilterChange, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const filteredContent = content.filter(item => {
    if (filters.language && !item[`content_${filters.language}`]) return false;
    if (filters.type && item.content_type !== filters.type) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.key && !item.content_key.toLowerCase().includes(filters.key.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="language-filter" className="text-gray-300">Language</Label>
              <Select value={filters.language} onValueChange={(value) => onFilterChange('language', value)}>
                <SelectTrigger className="bg-background-tertiary border-border text-white">
                  <SelectValue placeholder="All languages" />
                </SelectTrigger>
                <SelectContent className="bg-background-secondary border-border">
                  <SelectItem value="">All languages</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter" className="text-gray-300">Content Type</Label>
              <Select value={filters.type} onValueChange={(value) => onFilterChange('type', value)}>
                <SelectTrigger className="bg-background-tertiary border-border text-white">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="bg-background-secondary border-border">
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="ui_text">UI Text</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="help">Help</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category-filter" className="text-gray-300">Category</Label>
              <Input
                id="category-filter"
                placeholder="Filter by category"
                value={filters.category}
                onChange={(e) => onFilterChange('category', e.target.value)}
                className="bg-background-tertiary border-border text-white"
              />
            </div>
            <div>
              <Label htmlFor="key-filter" className="text-gray-300">Content Key</Label>
              <Input
                id="key-filter"
                placeholder="Search by key"
                value={filters.key}
                onChange={(e) => onFilterChange('key', e.target.value)}
                className="bg-background-tertiary border-border text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card className="bg-background-secondary border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Localized Content</CardTitle>
            <CardDescription className="text-gray-400">
              Manage multi-language content for the admin interface
            </CardDescription>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-primary hover:bg-primary-dark"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContent.map((item) => (
                <div key={item.id} className="p-4 bg-background-tertiary rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-white">{item.content_key}</h3>
                        {getContentTypeBadge(item.content_type)}
                        {item.category && (
                          <Badge variant="outline" className="text-gray-300 border-gray-600">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Arabic:</span>
                          <p className="text-white mt-1">{item.content_ar || 'Not set'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">English:</span>
                          <p className="text-white mt-1">{item.content_en || 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                        className="border-border text-gray-300 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Language Settings Tab Component
const LanguageSettingsTab = ({ languages, loading, onRefresh }) => {
  return (
    <div className="space-y-6">
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="text-white">Language Settings</CardTitle>
          <CardDescription className="text-gray-400">
            Configure language availability and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {languages.map((language) => (
                <div key={language.language_code} className="p-4 bg-background-tertiary rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-white">{language.language_name}</h3>
                        <span className="text-gray-400">({language.native_name})</span>
                        {language.is_default && (
                          <Badge className="bg-primary text-white">Default</Badge>
                        )}
                        {language.is_enabled ? (
                          <Badge className="bg-green-500 text-white">Enabled</Badge>
                        ) : (
                          <Badge className="bg-red-500 text-white">Disabled</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Display Order:</span>
                          <p className="text-white">{language.display_order}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Admin Interface:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <Switch 
                              checked={language.admin_interface_enabled}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className="text-white">
                              {language.admin_interface_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Mobile App:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <Switch 
                              checked={language.mobile_app_enabled}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className="text-white">
                              {language.mobile_app_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-gray-300 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Translation Management Tab Component
const TranslationManagementTab = ({ translations, loading, onRefresh }) => {
  return (
    <div className="space-y-6">
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="text-white">Translation Management</CardTitle>
          <CardDescription className="text-gray-400">
            Manage translation workflow and review process
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {translations.map((translation) => (
                <div key={translation.id} className="p-4 bg-background-tertiary rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-white">{translation.content_key}</h3>
                        {getStatusBadge(translation.translation_status)}
                        <Badge variant="outline" className="text-gray-300 border-gray-600">
                          {translation.source_language} → {translation.target_language}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Original Text:</span>
                          <p className="text-white mt-1">{translation.original_text}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Translated Text:</span>
                          <p className="text-white mt-1">{translation.translated_text || 'Not translated yet'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-400">
                        {translation.translator_name && (
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>Translator: {translation.translator_name}</span>
                          </div>
                        )}
                        {translation.reviewer_name && (
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>Reviewer: {translation.reviewer_name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Created: {new Date(translation.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {translation.translation_status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-gray-300 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocalizationManagement; 