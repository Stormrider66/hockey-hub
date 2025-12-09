import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, Filter, AlertTriangle, Eye, Trash2 } from 'lucide-react';
import { 
  useGetRulesQuery, 
  useUpdateRuleMutation, 
  useDeleteRuleMutation,
  ModerationRule,
  RuleType,
  RuleAction,
  RuleSeverity
} from '@/store/api/moderationApi';
import { toast } from 'react-hot-toast';

export const ModerationRules: React.FC = () => {
  const { data, isLoading, refetch } = useGetRulesQuery({});
  const [updateRule] = useUpdateRuleMutation();
  const [deleteRule] = useDeleteRuleMutation();

  const rules = data?.data || [];

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await updateRule({
        ruleId,
        updates: { isActive }
      }).unwrap();
      toast.success(`Rule ${isActive ? 'enabled' : 'disabled'}`);
      refetch();
    } catch (error) {
      toast.error('Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      await deleteRule(ruleId).unwrap();
      toast.success('Rule deleted');
      refetch();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const getRuleTypeIcon = (type: RuleType) => {
    switch (type) {
      case RuleType.KEYWORD_FILTER:
        return <Filter className="h-4 w-4" />;
      case RuleType.PATTERN_MATCH:
        return <Eye className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: RuleSeverity) => {
    switch (severity) {
      case RuleSeverity.LOW:
        return 'bg-blue-100 text-blue-800';
      case RuleSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case RuleSeverity.HIGH:
        return 'bg-orange-100 text-orange-800';
      case RuleSeverity.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: RuleAction) => {
    switch (action) {
      case RuleAction.FLAG_FOR_REVIEW:
        return 'bg-blue-100 text-blue-800';
      case RuleAction.AUTO_DELETE:
        return 'bg-red-100 text-red-800';
      case RuleAction.AUTO_MUTE:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-12">
        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Moderation Rules
        </h3>
        <p className="text-gray-600">
          Create rules to automatically moderate content.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <Card key={rule.id} className={`${rule.isActive ? 'border-green-200' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getRuleTypeIcon(rule.ruleType)}
                <div>
                  <CardTitle className="text-base">{rule.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getSeverityColor(rule.severity)}>
                      {rule.severity}
                    </Badge>
                    <Badge className={getActionColor(rule.action)}>
                      {rule.action.replace('_', ' ')}
                    </Badge>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Active</span>
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <p className="text-sm text-gray-700 mb-3">
              {rule.description}
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium">
                  {rule.ruleType.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Priority:</span>
                <span className="ml-2 font-medium">{rule.priority}</span>
              </div>
            </div>
            
            {rule.criteria && (
              <div className="mt-3 p-3 bg-gray-50 rounded border">
                <h5 className="text-sm font-medium mb-2">Criteria:</h5>
                <div className="text-sm text-gray-700">
                  {rule.criteria.keywords && (
                    <div>
                      <span className="font-medium">Keywords:</span>
                      <span className="ml-2">{rule.criteria.keywords.join(', ')}</span>
                    </div>
                  )}
                  {rule.criteria.maxLength && (
                    <div>
                      <span className="font-medium">Max Length:</span>
                      <span className="ml-2">{rule.criteria.maxLength} characters</span>
                    </div>
                  )}
                  {rule.criteria.blockedDomains && (
                    <div>
                      <span className="font-medium">Blocked Domains:</span>
                      <span className="ml-2">{rule.criteria.blockedDomains.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {rule.statistics && (
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                <span>Triggered: {rule.statistics.triggeredCount || 0} times</span>
                {rule.statistics.lastTriggered && (
                  <span>
                    Last: {new Date(rule.statistics.lastTriggered).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};