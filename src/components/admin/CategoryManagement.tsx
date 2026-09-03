'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
  X,
  GripVertical,
} from 'lucide-react';

// Types
interface Category {
  id: string;
  parent_id: string | null;
  name_en: string;
  name_ar: string;
  name_fr: string;
  slug: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
}

interface CategoryTreeItem extends Category {
  level: number;
  children?: CategoryTreeItem[];
}

export default function CategoryManagement() {
  const { t, locale } = useTranslation();
  
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    name_fr: '',
    parent_id: '' as string | null,
    icon_name: '',
    is_active: true,
  });

  // Expanded categories for tree view
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/categories');
      
      if (!res.ok) throw new Error('Failed to fetch categories');

      const data = await res.json();
      setCategories(data.data || []);
      
      // Build tree with levels
      const tree = buildTreeWithLevels(data.tree || [], 0);
      setCategoryTree(tree);
    } catch (err) {
      console.error('Fetch categories error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCreateEdit = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.name_ar.trim() || !formData.name_en.trim()) {
        alert('Name in Arabic and English is required');
        return;
      }

      const payload = {
        ...formData,
        parent_id: formData.parent_id || null,
      };

      let res;
      if (editingCategory) {
        // Update existing category
        res = await fetch('/api/admin/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates: [{ id: editingCategory.id, ...payload }],
          }),
        });
      } else {
        // Create new category
        res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save category');
      }

      // Reset form and refresh
      setShowForm(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error('Save category error:', err);
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      // Note: You might want to implement a proper delete endpoint
      // For now, we'll just deactivate it
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [{ id: categoryId, is_active: false }],
        }),
      });

      if (!res.ok) throw new Error('Failed to delete category');

      fetchCategories();
    } catch (err) {
      console.error('Delete category error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name_en: category.name_en,
      name_ar: category.name_ar,
      name_fr: category.name_fr,
      parent_id: category.parent_id,
      icon_name: category.icon_name,
      is_active: category.is_active,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ar: '',
      name_fr: '',
      parent_id: null,
      icon_name: '',
      is_active: true,
    });
  };

  const getCategoryName = (category: Category) => {
    switch (locale) {
      case 'ar': return category.name_ar;
      case 'fr': return category.name_fr;
      default: return category.name_en;
    }
  };

  // Get flat list of categories for parent selector (excluding current editing)
  const getParentOptions = () => {
    const options = [{ value: '', label: 'None (Root Category)' }];
    
    const addOptions = (cats: Category[], level = 0) => {
      for (const cat of cats) {
        if (cat.id !== editingCategory?.id) {
          options.push({
            value: cat.id,
            label: '─'.repeat(level) + ' ' + getCategoryName(cat),
          });
        }
        if (cat.children) {
          addOptions(cat.children, level + 1);
        }
      }
    };
    
    addOptions(categories.filter(c => !c.parent_id));
    return options;
  };

  // Render tree item
  const renderTreeItem = (item: CategoryTreeItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedCategories.has(item.id);

    return (
      <div key={item.id}>
        <div 
          className={`flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            item.level > 0 ? `pr-${4 + item.level * 4}` : ''
          }`}
          style={{ paddingLeft: `${item.level * 24 + 12}px` }}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={() => toggleExpanded(item.id)}
            className="p-1 hover:bg-gray-200 dark:hover-gray-700 rounded"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <span className="w-4" />
            )}
          </button>

          {/* Icon/Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {item.icon_name && (
              <span className="text-xl">{item.icon_name}</span>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {getCategoryName(item)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Slug: {item.slug}
              </p>
            </div>
          </div>

          {/* Status */}
          <Badge variant={item.is_active ? 'default' : 'secondary'}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Badge>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEdit(item)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            {!hasChildren && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{getCategoryName(item)}&quot;? 
                      This will deactivate the category.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(item.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderTreeItem(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FolderTree className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-lg font-medium">Category Management</CardTitle>
              <Badge variant="outline">{categories.length} total</Badge>
            </div>
            
            <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingCategory(null); resetForm(); } }}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingCategory(null); }}>
                  <Plus className={`h-4 w-4 ${locale === 'ar' ? 'ml-2 mr-0' : 'mr-2 ml-0'}`} />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name (Arabic) *</label>
                    <Input
                      placeholder="اسم التصنيف"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name (English) *</label>
                    <Input
                      placeholder="Category Name"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name (French)</label>
                    <Input
                      placeholder="Nom de catégorie"
                      value={formData.name_fr}
                      onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Parent Category</label>
                    <Select 
                      value={formData.parent_id || ''} 
                      onValueChange={(v) => setFormData({ ...formData, parent_id: v || null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getParentOptions().map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Icon (emoji)</label>
                    <Input
                      placeholder="🚗 or 🏠"
                      value={formData.icon_name}
                      onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Active</label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => { setShowForm(false); setEditingCategory(null); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEdit} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className={`h-4 w-4 ${locale === 'ar' ? 'ml-2 mr-0' : 'mr-2 ml-0'}`} />
                    )}
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchCategories}>
                Retry
              </Button>
            </div>
          ) : categoryTree.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No categories found</p>
              <p className="text-sm mt-2">Create your first category to get started</p>
            </div>
          ) : (
            /* Tree View */
            <div className="border rounded-lg divide-y">
              {categoryTree.map(item => renderTreeItem(item))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper to build tree with levels
function buildTreeWithLevels(categories: Category[], level: number): CategoryTreeItem[] {
  return categories.map(cat => ({
    ...cat,
    level,
    children: cat.children ? buildTreeWithLevels(cat.children as Category[], level + 1) : undefined,
  }));
}
