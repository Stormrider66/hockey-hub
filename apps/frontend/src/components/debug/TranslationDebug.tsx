"use client";

import { useTranslation } from '@hockey-hub/translations';
import { useEffect, useState } from 'react';

export function TranslationDebug() {
  const { t, i18n, ready } = useTranslation('common');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    setDebugInfo({
      ready,
      language: i18n.language,
      languages: i18n.languages,
      hasLoadedNamespaces: i18n.hasLoadedNamespace('common'),
      options: i18n.options,
      loadPath: (i18n.options as any)?.backend?.loadPath,
      resourcesLoaded: Object.keys(i18n.store?.data || {}),
      commonTranslations: i18n.store?.data?.[i18n.language]?.common
    });
  }, [i18n, ready]);

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-md text-xs">
      <h3 className="font-bold mb-2">i18n Debug</h3>
      <pre className="overflow-auto max-h-60">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      <div className="mt-2 border-t pt-2">
        <p>Test translation: {t('navigation.dashboard', 'FALLBACK')}</p>
      </div>
    </div>
  );
}