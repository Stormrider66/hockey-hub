"use client";

import React from "react";
import { useTranslation } from "@hockey-hub/translations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Example component showing how to use translations in PlayerDashboard
 * This demonstrates the pattern for implementing i18n across the application
 */
export function PlayerDashboardI18nExample() {
  const { t } = useTranslation(['player', 'common']);

  return (
    <div className="space-y-6">
      {/* Example of using translations */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('player:dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('player:dashboard.subtitle')}</p>
      </div>

      {/* Today's Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('player:dashboard.todaySchedule')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{t('common:time.time')}</span>
              <span>{t('common:labels.location')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wellness Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('player:wellness.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('player:wellness.subtitle')}
          </p>
          <Button>
            {t('player:wellness.submit')}
          </Button>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>{t('player:performance.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('player:performance.metrics.goals')}
              </p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('player:performance.metrics.assists')}
              </p>
              <p className="text-2xl font-bold">18</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Actions */}
      <div className="flex gap-4">
        <Button>{t('common:actions.save')}</Button>
        <Button variant="outline">{t('common:actions.cancel')}</Button>
        <Button variant="secondary">{t('common:actions.viewAll')}</Button>
      </div>
    </div>
  );
}