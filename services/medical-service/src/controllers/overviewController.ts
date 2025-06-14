import { Request, Response } from 'express';
import { findAll } from '../repositories/injuryRepository';
import { Injury } from '../types/medical';

export const getMedicalOverview = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    
    // Get all injuries for the team/organization
    // TODO: Filter by teamId when team-specific filtering is implemented
    console.log(`Fetching medical overview for team: ${teamId}`);
    const injuries = await findAll();
    
    // Calculate overview statistics
    const totalInjuries = injuries.length;
    const activeInjuries = injuries.filter((inj: Injury) => inj.status === 'active' || inj.status === 'recovering').length;
    const recentInjuries = injuries.filter((inj: Injury) => {
      const injuryDate = new Date(inj.dateOccurred);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return injuryDate >= weekAgo;
    }).length;

    // Player availability mock data (in real app, this would come from player availability service)
    const playerAvailability = {
      full: 18,
      limited: 3,
      individual: 2,
      rehab: activeInjuries,
      unavailable: 2
    };

    // Injury trends mock data
    const recoveryTrends = [
      { week: 'W1', injuries: 2, recovered: 1 },
      { week: 'W2', injuries: 1, recovered: 2 },
      { week: 'W3', injuries: 3, recovered: 1 },
      { week: 'W4', injuries: 1, recovered: 3 },
      { week: 'W5', injuries: 0, recovered: 2 },
      { week: 'W6', injuries: recentInjuries, recovered: 1 }
    ];

    // Group injuries by type
    const injuryTypes = injuries.reduce((acc: Record<string, number>, injury: Injury) => {
      const type = injury.bodyPart || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const injuryByType = Object.entries(injuryTypes).map(([type, count]) => ({
      type,
      count: count as number,
      percentage: Math.round(((count as number) / totalInjuries) * 100)
    }));

    const overview = {
      totalInjuries,
      activeInjuries,
      recentInjuries,
      playerAvailability,
      recoveryTrends,
      injuryByType,
      // Add treatments mock data
      treatments: [
        { id: 1, time: "09:00", player: "Marcus Lindberg", type: "Physiotherapy", location: "Treatment Room", duration: 45 },
        { id: 2, time: "10:00", player: "Erik Andersson", type: "Post-Op Assessment", location: "Medical Office", duration: 30 },
        { id: 3, time: "11:30", player: "Viktor Nilsson", type: "Cognitive Testing", location: "Testing Room", duration: 60 },
        { id: 4, time: "14:00", player: "Johan Bergström", type: "Return to Play Test", location: "Training Field", duration: 90 },
        { id: 5, time: "16:00", player: "Anders Johansson", type: "Preventive Care", location: "Treatment Room", duration: 30 }
      ]
    };

    res.status(200).json(overview);
  } catch (error: any) {
    console.error('Error fetching medical overview:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch medical overview',
      code: 'OVERVIEW_FETCH_ERROR',
      category: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
}; 