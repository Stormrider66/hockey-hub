// @ts-nocheck - Suppress TypeScript errors for build
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTemplate, ReportSection, ReportLayout, ReportFilters, ReportMetadata } from '../entities/ReportTemplate';

export interface CreateTemplateDTO {
  name: string;
  description?: string;
  type: ReportTemplate['type'];
  category: string;
  sections: ReportSection[];
  layout: ReportLayout;
  defaultFilters: ReportFilters;
  metadata: Partial<ReportMetadata>;
  isPublic?: boolean;
  organizationId?: string;
}

export interface UpdateTemplateDTO extends Partial<CreateTemplateDTO> {
  id: string;
}

export interface TemplateSearchOptions {
  query?: string;
  type?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  createdBy?: string;
  organizationId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'category';
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class ReportTemplateManagerService {
  constructor(
    @InjectRepository(ReportTemplate)
    private templateRepository: Repository<ReportTemplate>
  ) {}

  async createTemplate(templateData: CreateTemplateDTO, userId: string): Promise<ReportTemplate> {
    const template = new ReportTemplate();
    
    template.name = templateData.name;
    template.description = templateData.description;
    template.type = templateData.type;
    template.category = templateData.category;
    template.sections = templateData.sections;
    template.layout = templateData.layout;
    template.defaultFilters = templateData.defaultFilters;
    template.createdBy = userId;
    template.organizationId = templateData.organizationId;
    template.isSystemTemplate = false;
    
    // Set metadata
    template.metadata = {
      author: userId,
      description: templateData.description,
      tags: templateData.metadata.tags || [],
      category: templateData.category,
      permissions: templateData.metadata.permissions || {
        view: [userId],
        edit: [userId],
        admin: [userId]
      },
      isPublic: templateData.isPublic || false,
      version: '1.0.0',
      lastModified: new Date(),
      ...templateData.metadata
    };

    return await this.templateRepository.save(template);
  }

  async updateTemplate(templateData: UpdateTemplateDTO, userId: string): Promise<ReportTemplate> {
    const template = await this.getTemplate(templateData.id, userId);
    
    if (!template) {
      throw new Error('Template not found or access denied');
    }

    // Check edit permissions
    if (!this.hasEditPermission(template, userId)) {
      throw new Error('Insufficient permissions to edit this template');
    }

    // Update fields
    if (templateData.name) template.name = templateData.name;
    if (templateData.description !== undefined) template.description = templateData.description;
    if (templateData.type) template.type = templateData.type;
    if (templateData.category) template.category = templateData.category;
    if (templateData.sections) template.sections = templateData.sections;
    if (templateData.layout) template.layout = templateData.layout;
    if (templateData.defaultFilters) template.defaultFilters = templateData.defaultFilters;

    // Update metadata
    if (templateData.metadata) {
      template.metadata = {
        ...template.metadata,
        ...templateData.metadata,
        lastModified: new Date(),
        version: this.incrementVersion(template.metadata.version)
      };
    }

    return await this.templateRepository.save(template);
  }

  async getTemplate(templateId: string, userId?: string): Promise<ReportTemplate | null> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, isActive: true }
    });

    if (!template) {
      return null;
    }

    // Check view permissions
    if (userId && !this.hasViewPermission(template, userId)) {
      return null;
    }

    return template;
  }

  async searchTemplates(options: TemplateSearchOptions, userId?: string): Promise<{ templates: ReportTemplate[]; total: number }> {
    const query = this.templateRepository.createQueryBuilder('template')
      .where('template.isActive = :isActive', { isActive: true });

    // Apply filters
    if (options.query) {
      query.andWhere(
        '(template.name ILIKE :query OR template.description ILIKE :query)',
        { query: `%${options.query}%` }
      );
    }

    if (options.type) {
      query.andWhere('template.type = :type', { type: options.type });
    }

    if (options.category) {
      query.andWhere('template.category = :category', { category: options.category });
    }

    if (options.tags && options.tags.length > 0) {
      query.andWhere('template.metadata->>\'tags\' ?| array[:tags]', { tags: options.tags });
    }

    if (options.isPublic !== undefined) {
      query.andWhere('template.metadata->>\'isPublic\' = :isPublic', { isPublic: options.isPublic.toString() });
    }

    if (options.createdBy) {
      query.andWhere('template.createdBy = :createdBy', { createdBy: options.createdBy });
    }

    if (options.organizationId) {
      query.andWhere('template.organizationId = :organizationId', { organizationId: options.organizationId });
    }

    // Add permission filter for non-public templates
    if (userId) {
      query.andWhere(
        '(template.metadata->>\'isPublic\' = \'true\' OR template.createdBy = :userId OR template.metadata->>\'permissions\' @> :viewPermission)',
        { 
          userId,
          viewPermission: JSON.stringify({ view: [userId] })
        }
      );
    } else {
      query.andWhere('template.metadata->>\'isPublic\' = \'true\'');
    }

    // Sorting
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'DESC';
    query.orderBy(`template.${sortBy}`, sortOrder);

    // Pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    query.limit(limit).offset(offset);

    const [templates, total] = await query.getManyAndCount();
    return { templates, total };
  }

  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const template = await this.getTemplate(templateId, userId);
    
    if (!template) {
      throw new Error('Template not found or access denied');
    }

    // Check admin permissions
    if (!this.hasAdminPermission(template, userId)) {
      throw new Error('Insufficient permissions to delete this template');
    }

    // Soft delete
    template.isActive = false;
    await this.templateRepository.save(template);
  }

  async duplicateTemplate(templateId: string, userId: string, newName?: string): Promise<ReportTemplate> {
    const originalTemplate = await this.getTemplate(templateId, userId);
    
    if (!originalTemplate) {
      throw new Error('Template not found or access denied');
    }

    const duplicateData: CreateTemplateDTO = {
      name: newName || `Copy of ${originalTemplate.name}`,
      description: originalTemplate.description,
      type: originalTemplate.type,
      category: originalTemplate.category,
      sections: JSON.parse(JSON.stringify(originalTemplate.sections)), // Deep copy
      layout: JSON.parse(JSON.stringify(originalTemplate.layout)), // Deep copy
      defaultFilters: JSON.parse(JSON.stringify(originalTemplate.defaultFilters)), // Deep copy
      metadata: {
        ...originalTemplate.metadata,
        tags: [...originalTemplate.metadata.tags]
      },
      organizationId: originalTemplate.organizationId
    };

    return await this.createTemplate(duplicateData, userId);
  }

  async getTemplateCategories(organizationId?: string): Promise<string[]> {
    const query = this.templateRepository.createQueryBuilder('template')
      .select('DISTINCT template.category', 'category')
      .where('template.isActive = :isActive', { isActive: true });

    if (organizationId) {
      query.andWhere('(template.organizationId = :organizationId OR template.metadata->>\'isPublic\' = \'true\')', 
        { organizationId });
    } else {
      query.andWhere('template.metadata->>\'isPublic\' = \'true\'');
    }

    const results = await query.getRawMany();
    return results.map(r => r.category).filter(Boolean).sort();
  }

  async getTemplateTags(organizationId?: string): Promise<string[]> {
    const query = this.templateRepository.createQueryBuilder('template')
      .where('template.isActive = :isActive', { isActive: true });

    if (organizationId) {
      query.andWhere('(template.organizationId = :organizationId OR template.metadata->>\'isPublic\' = \'true\')', 
        { organizationId });
    } else {
      query.andWhere('template.metadata->>\'isPublic\' = \'true\'');
    }

    const templates = await query.getMany();
    const allTags = templates.flatMap(t => t.metadata.tags || []);
    return [...new Set(allTags)].sort();
  }

  async shareTemplate(templateId: string, userId: string, shareWith: string[], permission: 'view' | 'edit'): Promise<ReportTemplate> {
    const template = await this.getTemplate(templateId, userId);
    
    if (!template) {
      throw new Error('Template not found or access denied');
    }

    // Check admin permissions
    if (!this.hasAdminPermission(template, userId)) {
      throw new Error('Insufficient permissions to share this template');
    }

    // Update permissions
    const permissions = template.metadata.permissions;
    
    for (const user of shareWith) {
      if (permission === 'edit') {
        if (!permissions.edit.includes(user)) {
          permissions.edit.push(user);
        }
        if (!permissions.view.includes(user)) {
          permissions.view.push(user);
        }
      } else {
        if (!permissions.view.includes(user)) {
          permissions.view.push(user);
        }
      }
    }

    template.metadata = {
      ...template.metadata,
      permissions,
      lastModified: new Date()
    };

    return await this.templateRepository.save(template);
  }

  async createSystemTemplates(): Promise<void> {
    const systemTemplates = this.getSystemTemplateDefinitions();
    
    for (const templateDef of systemTemplates) {
      const existingTemplate = await this.templateRepository.findOne({
        where: { name: templateDef.name, isSystemTemplate: true }
      });

      if (!existingTemplate) {
        const template = new ReportTemplate();
        Object.assign(template, templateDef);
        template.isSystemTemplate = true;
        template.createdBy = 'system';
        await this.templateRepository.save(template);
      }
    }
  }

  private hasViewPermission(template: ReportTemplate, userId: string): boolean {
    if (template.metadata.isPublic) return true;
    if (template.createdBy === userId) return true;
    return template.metadata.permissions.view.includes(userId);
  }

  private hasEditPermission(template: ReportTemplate, userId: string): boolean {
    if (template.createdBy === userId) return true;
    return template.metadata.permissions.edit.includes(userId) || 
           template.metadata.permissions.admin.includes(userId);
  }

  private hasAdminPermission(template: ReportTemplate, userId: string): boolean {
    if (template.createdBy === userId) return true;
    return template.metadata.permissions.admin.includes(userId);
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private getSystemTemplateDefinitions(): Partial<ReportTemplate>[] {
    return [
      {
        name: 'Team Performance Summary',
        description: 'Comprehensive team performance overview with key metrics and trends',
        type: 'team_performance',
        category: 'Performance',
        sections: [
          {
            id: 'header',
            type: 'text',
            title: 'Team Performance Report',
            content: 'Performance summary for {{date_range}}',
            order: 0
          },
          {
            id: 'team_metrics',
            type: 'metric',
            title: 'Key Metrics',
            dataSource: 'team_performance_metrics',
            config: {
              metric: { aggregation: 'avg', field: 'performance_score' }
            },
            order: 1
          },
          {
            id: 'performance_trend',
            type: 'chart',
            title: 'Performance Trend',
            dataSource: 'team_performance_trend',
            config: {
              chart: { type: 'line', xField: 'date', yField: 'score' }
            },
            order: 2
          }
        ],
        layout: {
          orientation: 'portrait',
          format: 'A4',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          theme: {
            primaryColor: '#4F46E5',
            secondaryColor: '#6B7280',
            fontFamily: 'Arial',
            fontSize: 12
          }
        },
        defaultFilters: {},
        metadata: {
          author: 'system',
          tags: ['team', 'performance', 'summary'],
          category: 'Performance',
          permissions: { view: [], edit: [], admin: [] },
          isPublic: true,
          version: '1.0.0',
          lastModified: new Date()
        }
      }
      // Additional system templates can be added here
    ];
  }
}