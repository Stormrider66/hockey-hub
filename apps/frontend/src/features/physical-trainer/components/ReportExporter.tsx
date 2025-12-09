'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText, 
  FilePieChart,
  CalendarIcon,
  Filter,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { ExportOptions, exportTestData } from '../utils/dataExportImport';

interface ReportExporterProps {
  data: any[];
  dataType: 'test' | 'analytics' | 'medical' | 'performance';
  onExport?: (options: ExportOptions) => Promise<void>;
  includeCharts?: boolean;
  chartData?: any;
  className?: string;
}

export const ReportExporter: React.FC<ReportExporterProps> = ({
  data,
  dataType,
  onExport,
  includeCharts = false,
  chartData,
  className
}) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    includeMetadata: true,
    dateRange: undefined,
    filters: {}
  });
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Extract available fields from data
  const availableFields = data.length > 0 ? Object.keys(data[0]) : [];

  const handleExport = async (format: ExportOptions['format']) => {
    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        ...exportOptions,
        format,
        dateRange: dateRange.from && dateRange.to ? {
          start: dateRange.from,
          end: dateRange.to
        } : undefined
      };

      if (onExport) {
        await onExport(options);
      } else {
        // Use default export function
        await exportTestData(data, { ...options, testType: dataType });
      }

      toast.success(t('physicalTrainer:export.success'));
      setShowExportDialog(false);
    } catch (error) {
      toast.error(t('physicalTrainer:export.error'));
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = (format: ExportOptions['format']) => {
    handleExport(format);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json':
        return <FileJson className="h-4 w-4" />;
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'pdf':
        return <FilePieChart className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Download className="h-4 w-4 mr-2" />
            {t('physicalTrainer:export.button')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t('physicalTrainer:export.quickExport')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleQuickExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t('physicalTrainer:export.formats.excel')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('csv')}>
            <FileText className="h-4 w-4 mr-2" />
            {t('physicalTrainer:export.formats.csv')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('json')}>
            <FileJson className="h-4 w-4 mr-2" />
            {t('physicalTrainer:export.formats.json')}
          </DropdownMenuItem>
          {includeCharts && (
            <DropdownMenuItem onClick={() => handleQuickExport('pdf')}>
              <FilePieChart className="h-4 w-4 mr-2" />
              {t('physicalTrainer:export.formats.pdf')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
            <Filter className="h-4 w-4 mr-2" />
            {t('physicalTrainer:export.advancedExport')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('physicalTrainer:export.advancedTitle')}</DialogTitle>
            <DialogDescription>
              {t('physicalTrainer:export.advancedDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>{t('physicalTrainer:export.format')}</Label>
              <RadioGroup 
                value={exportOptions.format} 
                onValueChange={(value) => setExportOptions({
                  ...exportOptions,
                  format: value as ExportOptions['format']
                })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excel" id="excel" />
                  <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4" />
                    {t('physicalTrainer:export.formats.excel')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    {t('physicalTrainer:export.formats.csv')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                    <FileJson className="h-4 w-4" />
                    {t('physicalTrainer:export.formats.json')}
                  </Label>
                </div>
                {includeCharts && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                      <FilePieChart className="h-4 w-4" />
                      {t('physicalTrainer:export.formats.pdf')}
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>{t('physicalTrainer:export.dateRange')}</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal flex-1",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : t('physicalTrainer:export.startDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal flex-1",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : t('physicalTrainer:export.endDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Field Selection (for CSV/Excel) */}
            {(exportOptions.format === 'csv' || exportOptions.format === 'excel') && (
              <div className="space-y-2">
                <Label>{t('physicalTrainer:export.selectFields')}</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {availableFields.map((field) => (
                    <div key={field} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={field}
                        checked={selectedFields.length === 0 || selectedFields.includes(field)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFields([...selectedFields, field]);
                          } else {
                            setSelectedFields(selectedFields.filter(f => f !== field));
                          }
                        }}
                      />
                      <Label htmlFor={field} className="text-sm cursor-pointer">
                        {field}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Include Metadata */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metadata"
                checked={exportOptions.includeMetadata}
                onCheckedChange={(checked) => setExportOptions({
                  ...exportOptions,
                  includeMetadata: checked as boolean
                })}
              />
              <Label htmlFor="metadata" className="cursor-pointer">
                {t('physicalTrainer:export.includeMetadata')}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button 
              onClick={() => handleExport(exportOptions.format)}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('physicalTrainer:export.exporting')}
                </>
              ) : (
                <>
                  {getFormatIcon(exportOptions.format)}
                  <span className="ml-2">{t('physicalTrainer:export.button')}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};