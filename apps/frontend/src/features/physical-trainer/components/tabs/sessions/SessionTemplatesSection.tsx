'use client';

import React from 'react';
import SessionTemplates from '../../SessionTemplates';
import type { SessionTemplate } from '../../../types';

interface SessionTemplatesSectionProps {
  templates: SessionTemplate[];
  onCreateTemplate: () => void;
  onEditTemplate: (template: SessionTemplate) => void;
  onCreateFromTemplate?: (templateId: string) => void;
}

export const SessionTemplatesSection = React.memo(function SessionTemplatesSection({
  templates,
  onCreateTemplate,
  onEditTemplate,
  onCreateFromTemplate
}: SessionTemplatesSectionProps) {
  return (
    <SessionTemplates
      templates={templates}
      onCreateTemplate={onCreateTemplate}
      onEditTemplate={onEditTemplate}
      onCreateFromTemplate={onCreateFromTemplate}
    />
  );
});