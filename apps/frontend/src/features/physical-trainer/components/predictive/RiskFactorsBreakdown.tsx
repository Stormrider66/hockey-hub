import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Activity, Clock, Shield } from 'lucide-react';

interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
  category?: 'modifiable' | 'non-modifiable' | 'environmental';
  severity?: 'low' | 'moderate' | 'high' | 'critical';
}

interface RiskFactorsBreakdownProps {
  riskFactors: RiskFactor[];
  compact?: boolean;
  className?: string;
}

export function RiskFactorsBreakdown({ 
  riskFactors, 
  compact = false,
  className = '' 
}: RiskFactorsBreakdownProps) {
  if (!riskFactors || riskFactors.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No risk factors identified.</p>
        </CardContent>
      </Card>
    );
  }

  // Categorize and sort risk factors
  const categorizedFactors = riskFactors.reduce((acc, factor) => {
    const category = factor.category || 'modifiable';
    if (!acc[category]) acc[category] = [];
    acc[category].push(factor);
    return acc;
  }, {} as Record<string, RiskFactor[]>);

  // Sort within each category by impact
  Object.keys(categorizedFactors).forEach(category => {
    categorizedFactors[category].sort((a, b) => b.impact - a.impact);
  });

  const getSeverityColor = (impact: number) => {
    if (impact >= 20) return 'text-red-600 bg-red-100';
    if (impact >= 15) return 'text-orange-600 bg-orange-100';
    if (impact >= 10) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getSeverityLevel = (impact: number) => {
    if (impact >= 20) return 'Critical';
    if (impact >= 15) return 'High';
    if (impact >= 10) return 'Moderate';
    return 'Low';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'modifiable': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'non-modifiable': return <Clock className="h-4 w-4 text-gray-600" />;
      case 'environmental': return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'modifiable': return 'bg-green-100 text-green-800';
      case 'non-modifiable': return 'bg-gray-100 text-gray-800';
      case 'environmental': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Top Risk Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskFactors
              .sort((a, b) => b.impact - a.impact)
              .slice(0, 5)
              .map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{factor.factor}</div>
                    <div className="text-xs text-gray-600">{factor.description}</div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm font-bold">{factor.impact}%</span>
                    <Badge className={getSeverityColor(factor.impact)}>
                      {getSeverityLevel(factor.impact)}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Risk Factors Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(categorizedFactors).map(([category, factors]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                {getCategoryIcon(category)}
                <h3 className="font-semibold capitalize">
                  {category.replace('-', ' ')} Risk Factors
                </h3>
                <Badge className={getCategoryColor(category)}>
                  {factors.length} factor{factors.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {factors.map((factor, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{factor.factor}</h4>
                      <p className="text-sm text-gray-600 mt-1">{factor.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xl font-bold">{factor.impact}%</span>
                      <Badge className={getSeverityColor(factor.impact)}>
                        {getSeverityLevel(factor.impact)}
                      </Badge>
                    </div>
                  </div>

                  {/* Impact Visualization */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Risk Contribution</span>
                      <span>{factor.impact}% of total risk</span>
                    </div>
                    <Progress value={factor.impact} className="h-2" />
                  </div>

                  {/* Modifiability Indicator */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Intervention:</span>
                    {category === 'modifiable' ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ✓ Can be improved
                      </Badge>
                    ) : category === 'environmental' ? (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        ~ Environmental control
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600 border-gray-600">
                        ✗ Fixed factor
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Risk Factor Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Risk Factor Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Factors:</span>
                <div className="font-bold">{riskFactors.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Modifiable:</span>
                <div className="font-bold text-green-600">
                  {categorizedFactors.modifiable?.length || 0}
                </div>
              </div>
              <div>
                <span className="text-gray-600">High Impact:</span>
                <div className="font-bold text-red-600">
                  {riskFactors.filter(f => f.impact >= 15).length}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Total Impact:</span>
                <div className="font-bold">
                  {Math.round(riskFactors.reduce((sum, f) => sum + f.impact, 0))}%
                </div>
              </div>
            </div>
          </div>

          {/* Intervention Recommendations */}
          {categorizedFactors.modifiable && categorizedFactors.modifiable.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                Intervention Opportunities
              </h3>
              <p className="text-sm text-green-700 mb-3">
                You have {categorizedFactors.modifiable.length} modifiable risk factors that can be addressed:
              </p>
              <ul className="space-y-1">
                {categorizedFactors.modifiable
                  .sort((a, b) => b.impact - a.impact)
                  .slice(0, 3)
                  .map((factor, index) => (
                    <li key={index} className="text-sm text-green-700">
                      • <strong>{factor.factor}</strong> ({factor.impact}% impact)
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}