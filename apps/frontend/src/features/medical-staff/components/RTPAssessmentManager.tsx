"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Target,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Shield,
  AlertTriangle,
  FileText,
  Search,
  Edit,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Brain,
  Zap
} from "lucide-react";

interface RTPCriteria {
  id: string;
  category: 'medical' | 'physical' | 'functional' | 'psychological' | 'sport-specific';
  name: string;
  description: string;
  required: boolean;
  evaluationMethod: string;
  passingCriteria: string;
  evaluatedBy: 'medical' | 'physio' | 'trainer' | 'coach' | 'psychologist';
}

interface RTPAssessment {
  id: string;
  playerId: string;
  playerName: string;
  injuryId: string;
  injuryType: string;
  assessmentDate: string;
  completedDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cleared' | 'not-cleared';
  overallProgress: number;
  clearanceLevel: 'none' | 'training-only' | 'limited-contact' | 'full-contact';
  criteria: RTPCriteriaResult[];
  finalRecommendation?: string;
  restrictions?: string[];
  followUpDate?: string;
  assessedBy: string;
  approvedBy?: string;
  notes: string;
}

interface RTPCriteriaResult {
  criteriaId: string;
  status: 'not-started' | 'in-progress' | 'passed' | 'failed' | 'not-applicable';
  evaluationDate?: string;
  evaluatedBy?: string;
  score?: number;
  maxScore?: number;
  notes?: string;
  evidence?: string[]; // Documents, test results, etc.
}

interface RTPTemplate {
  id: string;
  name: string;
  injuryTypes: string[];
  criteria: RTPCriteria[];
  description: string;
  estimatedDuration: number; // days
  isActive: boolean;
}

// RTP Criteria Templates
const RTP_CRITERIA: RTPCriteria[] = [
  // Medical Criteria
  {
    id: "med1",
    category: "medical",
    name: "Medical Clearance",
    description: "Physician approval for return to sport activities",
    required: true,
    evaluationMethod: "Clinical examination",
    passingCriteria: "No pain, swelling, or instability",
    evaluatedBy: "medical"
  },
  {
    id: "med2",
    category: "medical",
    name: "Imaging Clearance",
    description: "Structural healing confirmed via imaging",
    required: true,
    evaluationMethod: "MRI/CT/X-ray review",
    passingCriteria: "Structural integrity restored",
    evaluatedBy: "medical"
  },
  
  // Physical Criteria
  {
    id: "phys1",
    category: "physical",
    name: "Range of Motion",
    description: "Full range of motion in affected joint",
    required: true,
    evaluationMethod: "Goniometer measurement",
    passingCriteria: "≥90% of uninjured side",
    evaluatedBy: "physio"
  },
  {
    id: "phys2",
    category: "physical",
    name: "Strength Testing",
    description: "Muscle strength evaluation",
    required: true,
    evaluationMethod: "Isokinetic testing",
    passingCriteria: "≥85% of uninjured side",
    evaluatedBy: "physio"
  },
  {
    id: "phys3",
    category: "physical",
    name: "Balance & Proprioception",
    description: "Balance and position sense testing",
    required: true,
    evaluationMethod: "Single leg stance, BESS test",
    passingCriteria: "Within normal limits",
    evaluatedBy: "physio"
  },
  
  // Functional Criteria
  {
    id: "func1",
    category: "functional",
    name: "Hop Testing",
    description: "Single leg hop test battery",
    required: true,
    evaluationMethod: "Single, triple, crossover hop",
    passingCriteria: "≥90% of uninjured side",
    evaluatedBy: "physio"
  },
  {
    id: "func2",
    category: "functional",
    name: "Running Progression",
    description: "Pain-free running at various intensities",
    required: true,
    evaluationMethod: "Graduated running program",
    passingCriteria: "Pain-free at 100% effort",
    evaluatedBy: "trainer"
  },
  {
    id: "func3",
    category: "functional",
    name: "Agility Testing",
    description: "Sport-specific movement patterns",
    required: true,
    evaluationMethod: "T-test, 5-10-5 shuttle",
    passingCriteria: "≥95% of baseline",
    evaluatedBy: "trainer"
  },
  
  // Psychological Criteria
  {
    id: "psych1",
    category: "psychological",
    name: "Fear Assessment",
    description: "Evaluation of fear of re-injury",
    required: false,
    evaluationMethod: "ACL-RSI questionnaire",
    passingCriteria: "Score ≥76",
    evaluatedBy: "psychologist"
  },
  {
    id: "psych2",
    category: "psychological",
    name: "Confidence Level",
    description: "Self-reported confidence in sport activities",
    required: false,
    evaluationMethod: "Confidence questionnaire",
    passingCriteria: "≥8/10 confidence",
    evaluatedBy: "psychologist"
  },
  
  // Sport-Specific Criteria
  {
    id: "sport1",
    category: "sport-specific",
    name: "Hockey Skills",
    description: "Sport-specific skill execution",
    required: true,
    evaluationMethod: "On-ice skill assessment",
    passingCriteria: "Pre-injury level performance",
    evaluatedBy: "coach"
  },
  {
    id: "sport2",
    category: "sport-specific",
    name: "Contact Readiness",
    description: "Readiness for body contact",
    required: true,
    evaluationMethod: "Progressive contact drills",
    passingCriteria: "Comfortable with full contact",
    evaluatedBy: "coach"
  }
];

// Mock RTP Templates
const RTP_TEMPLATES: RTPTemplate[] = [
  {
    id: "acl_template",
    name: "ACL Injury RTP Protocol",
    injuryTypes: ["ACL Tear", "ACL Reconstruction"],
    criteria: RTP_CRITERIA.filter(c => 
      ['med1', 'med2', 'phys1', 'phys2', 'phys3', 'func1', 'func2', 'func3', 'psych1', 'sport1', 'sport2'].includes(c.id)
    ),
    description: "Comprehensive return to play protocol for ACL injuries",
    estimatedDuration: 14,
    isActive: true
  },
  {
    id: "hamstring_template",
    name: "Hamstring Strain RTP Protocol", 
    injuryTypes: ["Hamstring Strain"],
    criteria: RTP_CRITERIA.filter(c => 
      ['med1', 'phys1', 'phys2', 'func1', 'func2', 'sport1'].includes(c.id)
    ),
    description: "Return to play protocol for hamstring strains",
    estimatedDuration: 7,
    isActive: true
  },
  {
    id: "concussion_template",
    name: "Concussion RTP Protocol",
    injuryTypes: ["Concussion", "Head Injury"],
    criteria: [
      ...RTP_CRITERIA.filter(c => c.id === 'med1'),
      {
        id: "conc1",
        category: "medical",
        name: "Symptom Resolution",
        description: "Complete resolution of concussion symptoms",
        required: true,
        evaluationMethod: "Symptom checklist",
        passingCriteria: "Symptom-free for 24 hours",
        evaluatedBy: "medical"
      },
      {
        id: "conc2",
        category: "medical",
        name: "Cognitive Testing",
        description: "Baseline cognitive function restored",
        required: true,
        evaluationMethod: "ImPACT or similar testing",
        passingCriteria: "Return to baseline scores",
        evaluatedBy: "medical"
      }
    ],
    description: "Graduated return to play protocol for concussions",
    estimatedDuration: 10,
    isActive: true
  }
];

// Mock RTP Assessments
const mockRTPAssessments: RTPAssessment[] = [
  {
    id: "rtp1",
    playerId: "15",
    playerName: "Erik Andersson (#15)",
    injuryId: "1",
    injuryType: "ACL Tear - Right Knee",
    assessmentDate: "2024-06-01",
    status: "in-progress",
    overallProgress: 65,
    clearanceLevel: "training-only",
    assessedBy: "Dr. Sarah Johnson",
    notes: "Progressing well through protocol. Still working on final strength and agility benchmarks.",
    criteria: [
      { criteriaId: "med1", status: "passed", evaluationDate: "2024-06-01", evaluatedBy: "Dr. Johnson" },
      { criteriaId: "med2", status: "passed", evaluationDate: "2024-05-28", evaluatedBy: "Dr. Johnson" },
      { criteriaId: "phys1", status: "passed", evaluationDate: "2024-06-05", evaluatedBy: "Lisa Chen" },
      { criteriaId: "phys2", status: "in-progress", evaluationDate: "2024-06-08", evaluatedBy: "Lisa Chen", score: 82, maxScore: 100 },
      { criteriaId: "func1", status: "not-started" },
      { criteriaId: "sport1", status: "not-started" }
    ]
  },
  {
    id: "rtp2", 
    playerId: "7",
    playerName: "Marcus Lindberg (#7)",
    injuryId: "2",
    injuryType: "Hamstring Strain - Grade 2",
    assessmentDate: "2024-06-08",
    completedDate: "2024-06-09",
    status: "cleared",
    overallProgress: 100,
    clearanceLevel: "full-contact",
    assessedBy: "Physical Therapist Lisa Chen",
    approvedBy: "Dr. Sarah Johnson",
    notes: "All criteria met. Cleared for full return to play.",
    criteria: [
      { criteriaId: "med1", status: "passed", evaluationDate: "2024-06-08", evaluatedBy: "Lisa Chen" },
      { criteriaId: "phys1", status: "passed", evaluationDate: "2024-06-08", evaluatedBy: "Lisa Chen" },
      { criteriaId: "phys2", status: "passed", evaluationDate: "2024-06-08", evaluatedBy: "Lisa Chen", score: 95, maxScore: 100 },
      { criteriaId: "func2", status: "passed", evaluationDate: "2024-06-09", evaluatedBy: "Coach Andersson" }
    ]
  }
];

// Utility functions for status and clearance level colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-gray-100 text-gray-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-purple-100 text-purple-800';
    case 'cleared': return 'bg-green-100 text-green-800';
    case 'not-cleared': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getClearanceLevelColor = (level: string) => {
  switch (level) {
    case 'none': return 'bg-gray-100 text-gray-800';
    case 'training-only': return 'bg-yellow-100 text-yellow-800';
    case 'limited-contact': return 'bg-orange-100 text-orange-800';
    case 'full-contact': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export function RTPAssessmentManager() {
  const [assessments, setAssessments] = useState<RTPAssessment[]>(mockRTPAssessments);
  const [selectedAssessment, setSelectedAssessment] = useState<RTPAssessment | null>(null);
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");

  const activeAssessments = assessments.filter(a => 
    a.status === 'pending' || a.status === 'in-progress'
  );
  
  const completedAssessments = assessments.filter(a => 
    a.status === 'completed' || a.status === 'cleared' || a.status === 'not-cleared'
  );

  const filteredActive = activeAssessments.filter(a =>
    a.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.injuryType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompleted = completedAssessments.filter(a =>
    a.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.injuryType.toLowerCase().includes(searchTerm.toLowerCase())
  );



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Return to Play Assessments</h3>
          <p className="text-muted-foreground">Checklist-based RTP evaluations and clearance management</p>
        </div>
        <Button onClick={() => setShowNewAssessment(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Assessment
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by player name or injury type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assessment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Assessments ({filteredActive.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filteredCompleted.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({RTP_TEMPLATES.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {filteredActive.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active RTP assessments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredActive.map((assessment) => (
                <RTPAssessmentCard 
                  key={assessment.id} 
                  assessment={assessment} 
                  onClick={() => setSelectedAssessment(assessment)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {filteredCompleted.map((assessment) => (
              <RTPAssessmentCard 
                key={assessment.id} 
                assessment={assessment} 
                onClick={() => setSelectedAssessment(assessment)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <RTPTemplateManager templates={RTP_TEMPLATES} />
        </TabsContent>
      </Tabs>

      {/* Assessment Details Modal */}
      {selectedAssessment && (
        <RTPAssessmentModal 
          assessment={selectedAssessment} 
          onClose={() => setSelectedAssessment(null)}
          onUpdate={(updated) => {
            setAssessments(prev => prev.map(a => a.id === updated.id ? updated : a));
            setSelectedAssessment(null);
          }}
        />
      )}

      {/* New Assessment Modal */}
      {showNewAssessment && (
        <NewRTPAssessmentModal 
          onClose={() => setShowNewAssessment(false)}
          templates={RTP_TEMPLATES}
          onSave={(newAssessment) => {
            setAssessments(prev => [newAssessment, ...prev]);
            setShowNewAssessment(false);
          }}
        />
      )}
    </div>
  );
}

// RTP Assessment Card Component
function RTPAssessmentCard({ 
  assessment, 
  onClick 
}: { 
  assessment: RTPAssessment; 
  onClick: () => void;
}) {
  const passedCriteria = assessment.criteria.filter(c => c.status === 'passed').length;
  const totalCriteria = assessment.criteria.length;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center",
              assessment.status === 'cleared' ? 'bg-green-100' :
              assessment.status === 'not-cleared' ? 'bg-red-100' :
              assessment.status === 'in-progress' ? 'bg-blue-100' : 'bg-gray-100'
            )}>
              {assessment.status === 'cleared' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : assessment.status === 'not-cleared' ? (
                <XCircle className="h-6 w-6 text-red-600" />
              ) : (
                <Target className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{assessment.playerName}</h3>
                <Badge className={getStatusColor(assessment.status)}>
                  {assessment.status === 'in-progress' ? 'In Progress' :
                   assessment.status === 'cleared' ? 'Cleared' :
                   assessment.status === 'not-cleared' ? 'Not Cleared' :
                   assessment.status === 'completed' ? 'Under Review' :
                   'Pending'}
                </Badge>
              </div>
              <p className="text-sm font-medium mt-1">{assessment.injuryType}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Started: {new Date(assessment.assessmentDate).toLocaleDateString()}</span>
                {assessment.completedDate && (
                  <>
                    <span>•</span>
                    <span>Completed: {new Date(assessment.completedDate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getClearanceLevelColor(assessment.clearanceLevel)}>
                  {assessment.clearanceLevel === 'training-only' ? 'Training Only' :
                   assessment.clearanceLevel === 'limited-contact' ? 'Limited Contact' :
                   assessment.clearanceLevel === 'full-contact' ? 'Full Contact' :
                   'No Clearance'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">{assessment.overallProgress}%</span>
              <Progress value={assessment.overallProgress} className="h-2 w-24" />
            </div>
            <p className="text-sm text-muted-foreground">
              {passedCriteria}/{totalCriteria} criteria passed
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Assessed by: {assessment.assessedBy}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// RTP Assessment Details Modal Component
function RTPAssessmentModal({ 
  assessment, 
  onClose, 
  onUpdate 
}: { 
  assessment: RTPAssessment; 
  onClose: () => void;
  onUpdate: (assessment: RTPAssessment) => void;
}) {
  const [criteriaResults, setCriteriaResults] = useState(assessment.criteria);

  const updateCriteriaStatus = (criteriaId: string, status: RTPCriteriaResult['status']) => {
    setCriteriaResults(prev => prev.map(c => 
      c.criteriaId === criteriaId ? { ...c, status, evaluationDate: new Date().toISOString().split('T')[0] } : c
    ));
  };

  const getCriteria = (criteriaId: string) => {
    return RTP_CRITERIA.find(c => c.id === criteriaId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medical': return <Shield className="h-4 w-4" />;
      case 'physical': return <Activity className="h-4 w-4" />;
      case 'functional': return <Zap className="h-4 w-4" />;
      case 'psychological': return <Brain className="h-4 w-4" />;
      case 'sport-specific': return <Target className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-blue-600" />;
      default: return <div className="h-5 w-5 rounded-full bg-gray-200" />;
    }
  };

  const passedCriteria = criteriaResults.filter(c => c.status === 'passed').length;
  const totalCriteria = criteriaResults.length;
  const overallProgress = totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>RTP Assessment - {assessment.playerName}</DialogTitle>
          <DialogDescription>
            {assessment.injuryType} • Started {new Date(assessment.assessmentDate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{overallProgress}%</p>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{passedCriteria}/{totalCriteria}</p>
                  <p className="text-sm text-muted-foreground">Criteria Passed</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Badge className={getClearanceLevelColor(assessment.clearanceLevel)} variant="outline">
                    {assessment.clearanceLevel === 'training-only' ? 'Training Only' :
                     assessment.clearanceLevel === 'limited-contact' ? 'Limited Contact' :
                     assessment.clearanceLevel === 'full-contact' ? 'Full Contact' :
                     'No Clearance'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">Current Level</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <Badge className={getStatusColor(assessment.status)} variant="outline">
                    {assessment.status === 'in-progress' ? 'In Progress' :
                     assessment.status === 'cleared' ? 'Cleared' :
                     assessment.status === 'not-cleared' ? 'Not Cleared' :
                     'Pending'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">Status</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Criteria Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['medical', 'physical', 'functional', 'psychological', 'sport-specific'].map(category => {
                  const categoryCriteria = criteriaResults.filter(cr => {
                    const criteria = getCriteria(cr.criteriaId);
                    return criteria?.category === category;
                  });

                  if (categoryCriteria.length === 0) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        {getCategoryIcon(category)}
                        <h4 className="font-medium capitalize">{category} Assessment</h4>
                      </div>
                      
                      {categoryCriteria.map(result => {
                        const criteria = getCriteria(result.criteriaId);
                        if (!criteria) return null;

                        return (
                          <div key={result.criteriaId} className="flex items-start gap-4 p-3 border rounded-lg">
                            <div className="mt-1">
                              {getStatusIcon(result.status)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium">{criteria.name}</h5>
                                {criteria.required && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {criteria.description}
                              </p>
                              <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-muted-foreground">
                                <div>
                                  <strong>Method:</strong> {criteria.evaluationMethod}
                                </div>
                                <div>
                                  <strong>Passing:</strong> {criteria.passingCriteria}
                                </div>
                              </div>
                              {result.evaluationDate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Evaluated: {new Date(result.evaluationDate).toLocaleDateString()}
                                  {result.evaluatedBy && ` by ${result.evaluatedBy}`}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={result.status === 'passed' ? 'default' : 'outline'}
                                onClick={() => updateCriteriaStatus(result.criteriaId, 'passed')}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={result.status === 'failed' ? 'destructive' : 'outline'}
                                onClick={() => updateCriteriaStatus(result.criteriaId, 'failed')}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notes and Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add assessment notes and recommendations..."
                value={assessment.notes}
                className="min-h-[100px]"
              />
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  <p><strong>Assessed by:</strong> {assessment.assessedBy}</p>
                  {assessment.approvedBy && (
                    <p><strong>Approved by:</strong> {assessment.approvedBy}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Save Progress</Button>
                  <Button>Complete Assessment</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// RTP Template Manager Component
function RTPTemplateManager({ templates }: { templates: RTPTemplate[] }) {
  return (
    <div className="space-y-4">
      {templates.map(template => (
        <Card key={template.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>Injury Types: {template.injuryTypes.join(', ')}</span>
                  <span>•</span>
                  <span>Est. Duration: {template.estimatedDuration} days</span>
                  <span>•</span>
                  <span>{template.criteria.length} criteria</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={template.isActive ? 'default' : 'secondary'}>
                  {template.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['medical', 'physical', 'functional', 'psychological', 'sport-specific'].map(category => {
                const categoryCriteria = template.criteria.filter(c => c.category === category);
                if (categoryCriteria.length === 0) return null;

                return (
                  <div key={category} className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span className="text-sm capitalize">{category}:</span>
                    <span className="text-sm text-muted-foreground">
                      {categoryCriteria.length} criteria
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// New RTP Assessment Modal Component (simplified)
function NewRTPAssessmentModal({ 
  onClose, 
  templates, 
  onSave 
}: { 
  onClose: () => void; 
  templates: RTPTemplate[];
  onSave: (assessment: RTPAssessment) => void;
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New RTP Assessment</DialogTitle>
          <DialogDescription>
            Create a new return to play assessment
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">New assessment form will be implemented next</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get category icon
function getCategoryIcon(category: string) {
  switch (category) {
    case 'medical': return <Shield className="h-4 w-4" />;
    case 'physical': return <Activity className="h-4 w-4" />;
    case 'functional': return <Zap className="h-4 w-4" />;
    case 'psychological': return <Brain className="h-4 w-4" />;
    case 'sport-specific': return <Target className="h-4 w-4" />;
    default: return <CheckCircle className="h-4 w-4" />;
  }
} 