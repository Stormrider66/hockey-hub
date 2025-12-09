import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { usePaginationPreferences } from '@/hooks/usePaginationPreferences';
import { Settings, Save } from 'lucide-react';
import type { PaginationPreferences } from '@/types/pagination.types';

interface PaginationPreferencesProps {
  contextKey?: string;
  onSave?: (preferences: PaginationPreferences) => void;
  className?: string;
}

export function PaginationPreferencesComponent({
  contextKey,
  onSave,
  className,
}: PaginationPreferencesProps) {
  const [preferences, updatePreferences] = usePaginationPreferences(contextKey);
  const [localPrefs, setLocalPrefs] = React.useState(preferences);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleChange = (updates: Partial<PaginationPreferences>) => {
    setLocalPrefs(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updatePreferences(localPrefs);
    setHasChanges(false);
    onSave?.(localPrefs);
  };

  const handleReset = () => {
    const defaults: PaginationPreferences = {
      defaultPageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
      style: 'numbers',
      showItemCount: true,
      rememberPageSize: true,
    };
    setLocalPrefs(defaults);
    setHasChanges(true);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Pagination Preferences
        </CardTitle>
        <CardDescription>
          Configure how lists and tables display data across the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pagination Style */}
        <div className="space-y-3">
          <Label htmlFor="pagination-style">Pagination Style</Label>
          <RadioGroup
            id="pagination-style"
            value={localPrefs.style}
            onValueChange={(value) => handleChange({ style: value as any })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="numbers" id="style-numbers" />
              <Label htmlFor="style-numbers" className="font-normal cursor-pointer">
                Page numbers - Traditional pagination with page numbers
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="infinite" id="style-infinite" />
              <Label htmlFor="style-infinite" className="font-normal cursor-pointer">
                Infinite scroll - Automatically load more as you scroll
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="loadMore" id="style-load-more" />
              <Label htmlFor="style-load-more" className="font-normal cursor-pointer">
                Load more button - Manual loading with a button
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Default Page Size */}
        <div className="space-y-2">
          <Label htmlFor="default-page-size">Default Page Size</Label>
          <Select
            value={localPrefs.defaultPageSize.toString()}
            onValueChange={(value) => handleChange({ defaultPageSize: parseInt(value) })}
          >
            <SelectTrigger id="default-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 items per page</SelectItem>
              <SelectItem value="20">20 items per page</SelectItem>
              <SelectItem value="50">50 items per page</SelectItem>
              <SelectItem value="100">100 items per page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page Size Options */}
        <div className="space-y-2">
          <Label>Available Page Size Options</Label>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 30, 40, 50, 100].map((size) => (
              <Button
                key={size}
                variant={localPrefs.pageSizeOptions.includes(size) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newOptions = localPrefs.pageSizeOptions.includes(size)
                    ? localPrefs.pageSizeOptions.filter(s => s !== size)
                    : [...localPrefs.pageSizeOptions, size].sort((a, b) => a - b);
                  handleChange({ pageSizeOptions: newOptions });
                }}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>

        {/* Toggle Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-item-count">Show Item Count</Label>
              <p className="text-sm text-muted-foreground">
                Display "Showing X-Y of Z items" information
              </p>
            </div>
            <Switch
              id="show-item-count"
              checked={localPrefs.showItemCount}
              onCheckedChange={(checked) => handleChange({ showItemCount: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="remember-page-size">Remember Page Size</Label>
              <p className="text-sm text-muted-foreground">
                Save your page size preference for each view
              </p>
            </div>
            <Switch
              id="remember-page-size"
              checked={localPrefs.rememberPageSize}
              onCheckedChange={(checked) => handleChange({ rememberPageSize: checked })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple toggle for pagination style in-context
export function PaginationStyleToggle({
  value,
  onChange,
  className,
}: {
  value: PaginationPreferences['style'];
  onChange: (style: PaginationPreferences['style']) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange as any}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="numbers">Page Numbers</SelectItem>
        <SelectItem value="infinite">Infinite Scroll</SelectItem>
        <SelectItem value="loadMore">Load More</SelectItem>
      </SelectContent>
    </Select>
  );
}