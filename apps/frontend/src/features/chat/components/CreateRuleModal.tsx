import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { 
  useCreateRuleMutation,
  RuleType,
  RuleAction,
  RuleSeverity,
  CreateRuleRequest
} from '@/store/api/moderationApi';
import { toast } from 'react-hot-toast';

interface CreateRuleModalProps {
  onClose: () => void;
}

export const CreateRuleModal: React.FC<CreateRuleModalProps> = ({ onClose }) => {
  const [createRule, { isLoading }] = useCreateRuleMutation();
  
  const [formData, setFormData] = useState<CreateRuleRequest>({
    name: '',
    description: '',
    ruleType: RuleType.KEYWORD_FILTER,
    action: RuleAction.FLAG_FOR_REVIEW,
    severity: RuleSeverity.MEDIUM,
    criteria: {},
    priority: 0
  });
  
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [patterns, setPatterns] = useState<string[]>([]);
  const [newPattern, setNewPattern] = useState('');
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build criteria based on rule type
    let criteria = {};
    
    switch (formData.ruleType) {
      case RuleType.KEYWORD_FILTER:
        criteria = { keywords };
        break;
      case RuleType.PATTERN_MATCH:
        criteria = { patterns };
        break;
      case RuleType.CONTENT_LENGTH:
        criteria = { maxLength: parseInt((e.target as any).maxLength?.value || '1000') };
        break;
      case RuleType.RATE_LIMIT:
        criteria = { maxMessagesPerMinute: parseInt((e.target as any).maxMessages?.value || '10') };
        break;
      case RuleType.LINK_FILTER:
        criteria = { blockedDomains };
        break;
    }
    
    try {
      await createRule({
        ...formData,
        criteria
      }).unwrap();
      
      toast.success('Moderation rule created successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to create rule');
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const addPattern = () => {
    if (newPattern.trim() && !patterns.includes(newPattern.trim())) {
      setPatterns([...patterns, newPattern.trim()]);
      setNewPattern('');
    }
  };

  const removePattern = (pattern: string) => {
    setPatterns(patterns.filter(p => p !== pattern));
  };

  const addDomain = () => {
    if (newDomain.trim() && !blockedDomains.includes(newDomain.trim())) {
      setBlockedDomains([...blockedDomains, newDomain.trim()]);
      setNewDomain('');
    }
  };

  const removeDomain = (domain: string) => {
    setBlockedDomains(blockedDomains.filter(d => d !== domain));
  };

  const renderCriteriaForm = () => {
    switch (formData.ruleType) {
      case RuleType.KEYWORD_FILTER:
        return (
          <div className="space-y-3">
            <Label>Keywords to Block</Label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Enter keyword..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              />
              <Button type="button" onClick={addKeyword} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        );
        
      case RuleType.PATTERN_MATCH:
        return (
          <div className="space-y-3">
            <Label>Regex Patterns</Label>
            <div className="flex gap-2">
              <Input
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                placeholder="Enter regex pattern..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPattern())}
              />
              <Button type="button" onClick={addPattern} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {patterns.map((pattern) => (
                <Badge key={pattern} variant="secondary" className="flex items-center gap-1">
                  {pattern}
                  <button
                    type="button"
                    onClick={() => removePattern(pattern)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Use regex patterns to match specific content. Be careful with complex patterns.
            </p>
          </div>
        );
        
      case RuleType.CONTENT_LENGTH:
        return (
          <div>
            <Label htmlFor="maxLength">Maximum Character Length</Label>
            <Input
              id="maxLength"
              name="maxLength"
              type="number"
              defaultValue="1000"
              min="1"
              max="10000"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Messages longer than this will be flagged
            </p>
          </div>
        );
        
      case RuleType.RATE_LIMIT:
        return (
          <div>
            <Label htmlFor="maxMessages">Max Messages Per Minute</Label>
            <Input
              id="maxMessages"
              name="maxMessages"
              type="number"
              defaultValue="10"
              min="1"
              max="100"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Users sending more messages will be flagged
            </p>
          </div>
        );
        
      case RuleType.LINK_FILTER:
        return (
          <div className="space-y-3">
            <Label>Blocked Domains</Label>
            <div className="flex gap-2">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
              />
              <Button type="button" onClick={addDomain} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {blockedDomains.map((domain) => (
                <Badge key={domain} variant="secondary" className="flex items-center gap-1">
                  {domain}
                  <button
                    type="button"
                    onClick={() => removeDomain(domain)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter rule name..."
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this rule does..."
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Rule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rule Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rule Type</Label>
              <Select 
                value={formData.ruleType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, ruleType: value as RuleType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RuleType.KEYWORD_FILTER}>Keyword Filter</SelectItem>
                  <SelectItem value={RuleType.PATTERN_MATCH}>Pattern Match</SelectItem>
                  <SelectItem value={RuleType.CONTENT_LENGTH}>Content Length</SelectItem>
                  <SelectItem value={RuleType.RATE_LIMIT}>Rate Limit</SelectItem>
                  <SelectItem value={RuleType.LINK_FILTER}>Link Filter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Severity</Label>
              <Select 
                value={formData.severity} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value as RuleSeverity }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RuleSeverity.LOW}>Low</SelectItem>
                  <SelectItem value={RuleSeverity.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={RuleSeverity.HIGH}>High</SelectItem>
                  <SelectItem value={RuleSeverity.CRITICAL}>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Action</Label>
              <Select 
                value={formData.action} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, action: value as RuleAction }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RuleAction.FLAG_FOR_REVIEW}>Flag for Review</SelectItem>
                  <SelectItem value={RuleAction.AUTO_DELETE}>Auto Delete</SelectItem>
                  <SelectItem value={RuleAction.AUTO_MUTE}>Auto Mute User</SelectItem>
                  <SelectItem value={RuleAction.REQUIRE_APPROVAL}>Require Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority (0-100)</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                min="0"
                max="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rule Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          {renderCriteriaForm()}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Rule'}
        </Button>
      </div>
    </form>
  );
};