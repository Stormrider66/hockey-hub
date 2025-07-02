'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  count?: number;
  until?: Date;
  byWeekday?: number[]; // 0 = Sunday, 1 = Monday, etc.
  byMonthDay?: number;
  byMonth?: number;
  exceptions?: Date[];
}

interface RecurrenceSettingsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  recurrenceRule?: RecurrenceRule;
  onRecurrenceChange: (rule: RecurrenceRule | undefined) => void;
  startDate: Date;
}

const WEEKDAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export default function RecurrenceSettings({
  enabled,
  onEnabledChange,
  recurrenceRule,
  onRecurrenceChange,
  startDate,
}: RecurrenceSettingsProps) {
  const handleFrequencyChange = (frequency: RecurrenceRule['frequency']) => {
    const newRule: RecurrenceRule = {
      frequency,
      interval: 1,
      byWeekday: frequency === 'weekly' ? [startDate.getDay()] : undefined,
      byMonthDay: frequency === 'monthly' ? startDate.getDate() : undefined,
    };
    onRecurrenceChange(newRule);
  };

  const handleIntervalChange = (interval: string) => {
    const num = parseInt(interval, 10);
    if (!isNaN(num) && num > 0 && recurrenceRule) {
      onRecurrenceChange({ ...recurrenceRule, interval: num });
    }
  };

  const handleEndTypeChange = (type: 'never' | 'count' | 'until') => {
    if (!recurrenceRule) return;

    const newRule = { ...recurrenceRule };
    switch (type) {
      case 'never':
        delete newRule.count;
        delete newRule.until;
        break;
      case 'count':
        newRule.count = 10; // Default count
        delete newRule.until;
        break;
      case 'until':
        delete newRule.count;
        newRule.until = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from start
        break;
    }
    onRecurrenceChange(newRule);
  };

  const toggleWeekday = (weekday: number) => {
    if (!recurrenceRule || recurrenceRule.frequency !== 'weekly') return;

    const currentWeekdays = recurrenceRule.byWeekday || [];
    const newWeekdays = currentWeekdays.includes(weekday)
      ? currentWeekdays.filter(d => d !== weekday)
      : [...currentWeekdays, weekday].sort();

    if (newWeekdays.length === 0) return; // Must have at least one weekday

    onRecurrenceChange({ ...recurrenceRule, byWeekday: newWeekdays });
  };

  const addException = (date: Date) => {
    if (!recurrenceRule) return;
    const exceptions = recurrenceRule.exceptions || [];
    onRecurrenceChange({
      ...recurrenceRule,
      exceptions: [...exceptions, date],
    });
  };

  const removeException = (date: Date) => {
    if (!recurrenceRule || !recurrenceRule.exceptions) return;
    onRecurrenceChange({
      ...recurrenceRule,
      exceptions: recurrenceRule.exceptions.filter(
        d => d.getTime() !== date.getTime()
      ),
    });
  };

  const getEndType = (): 'never' | 'count' | 'until' => {
    if (!recurrenceRule) return 'never';
    if (recurrenceRule.count) return 'count';
    if (recurrenceRule.until) return 'until';
    return 'never';
  };

  const getFrequencyLabel = (frequency: RecurrenceRule['frequency']) => {
    const interval = recurrenceRule?.interval || 1;
    if (interval === 1) {
      switch (frequency) {
        case 'daily': return 'day';
        case 'weekly': return 'week';
        case 'monthly': return 'month';
        case 'yearly': return 'year';
      }
    }
    switch (frequency) {
      case 'daily': return 'days';
      case 'weekly': return 'weeks';
      case 'monthly': return 'months';
      case 'yearly': return 'years';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="recurring"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
        <Label htmlFor="recurring">Make this a recurring event</Label>
      </div>

      {enabled && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            {/* Frequency and Interval */}
            <div className="flex items-center gap-2">
              <Label>Repeat every</Label>
              <Input
                type="number"
                min="1"
                value={recurrenceRule?.interval || 1}
                onChange={(e) => handleIntervalChange(e.target.value)}
                className="w-16"
              />
              <Select
                value={recurrenceRule?.frequency || 'weekly'}
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">
                    {getFrequencyLabel('daily')}
                  </SelectItem>
                  <SelectItem value="weekly">
                    {getFrequencyLabel('weekly')}
                  </SelectItem>
                  <SelectItem value="monthly">
                    {getFrequencyLabel('monthly')}
                  </SelectItem>
                  <SelectItem value="yearly">
                    {getFrequencyLabel('yearly')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weekly: Day selection */}
            {recurrenceRule?.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <div className="flex gap-1">
                  {WEEKDAYS.map(({ value, label }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={
                        recurrenceRule.byWeekday?.includes(value)
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      className="w-12"
                      onClick={() => toggleWeekday(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* End condition */}
            <div className="space-y-2">
              <Label>End</Label>
              <Select
                value={getEndType()}
                onValueChange={(value: 'never' | 'count' | 'until') =>
                  handleEndTypeChange(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="count">After occurrences</SelectItem>
                  <SelectItem value="until">On date</SelectItem>
                </SelectContent>
              </Select>

              {recurrenceRule?.count !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    min="1"
                    value={recurrenceRule.count}
                    onChange={(e) => {
                      const count = parseInt(e.target.value, 10);
                      if (!isNaN(count) && count > 0) {
                        onRecurrenceChange({ ...recurrenceRule, count });
                      }
                    }}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    occurrences
                  </span>
                </div>
              )}

              {recurrenceRule?.until && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal mt-2',
                        !recurrenceRule.until && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(recurrenceRule.until, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={recurrenceRule.until}
                      onSelect={(date) => {
                        if (date) {
                          onRecurrenceChange({ ...recurrenceRule, until: date });
                        }
                      }}
                      initialFocus
                      disabled={(date) => date < startDate}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Exceptions */}
            {recurrenceRule && (
              <div className="space-y-2">
                <Label>Exceptions</Label>
                {recurrenceRule.exceptions && recurrenceRule.exceptions.length > 0 ? (
                  <div className="space-y-1">
                    {recurrenceRule.exceptions.map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <span className="text-sm">{format(date, 'PPP')}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeException(date)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No exceptions added
                  </p>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="p-3 bg-muted rounded">
              <p className="text-sm font-medium">Summary</p>
              <p className="text-sm text-muted-foreground mt-1">
                {getSummaryText(recurrenceRule, startDate)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getSummaryText(rule: RecurrenceRule | undefined, startDate: Date): string {
  if (!rule) return 'No recurrence';

  let summary = `Every ${rule.interval > 1 ? rule.interval + ' ' : ''}`;

  switch (rule.frequency) {
    case 'daily':
      summary += rule.interval === 1 ? 'day' : 'days';
      break;
    case 'weekly':
      summary += rule.interval === 1 ? 'week' : 'weeks';
      if (rule.byWeekday) {
        const days = rule.byWeekday
          .map(d => WEEKDAYS.find(w => w.value === d)?.label)
          .filter(Boolean)
          .join(', ');
        summary += ` on ${days}`;
      }
      break;
    case 'monthly':
      summary += rule.interval === 1 ? 'month' : 'months';
      if (rule.byMonthDay) {
        summary += ` on the ${rule.byMonthDay}${getOrdinalSuffix(rule.byMonthDay)}`;
      }
      break;
    case 'yearly':
      summary += rule.interval === 1 ? 'year' : 'years';
      break;
  }

  if (rule.count) {
    summary += `, ${rule.count} times`;
  } else if (rule.until) {
    summary += `, until ${format(rule.until, 'PPP')}`;
  }

  return summary;
}

function getOrdinalSuffix(day: number): string {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}