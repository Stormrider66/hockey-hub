import { MedicalStaffDashboard } from '../../page-objects/MedicalStaffDashboard';
import { testUsers } from '../../support/e2e';

describe('Medical Staff Managing Injuries', () => {
  const medicalDashboard = new MedicalStaffDashboard();
  
  beforeEach(() => {
    // Login as medical staff
    cy.login(testUsers.medicalStaff.email, testUsers.medicalStaff.password);
    
    // Mock team players
    cy.mockApiResponse('GET', '**/api/team/players', {
      players: [
        { id: '1', name: 'John Doe', number: 10, position: 'Forward' },
        { id: '2', name: 'Jane Smith', number: 15, position: 'Defense' },
        { id: '3', name: 'Mike Johnson', number: 20, position: 'Goalie' },
        { id: '4', name: 'Sarah Williams', number: 25, position: 'Forward' },
      ],
    });
    
    // Mock active injuries
    cy.mockApiResponse('GET', '**/api/medical/injuries/active', {
      injuries: [
        {
          id: 'inj1',
          playerId: '2',
          playerName: 'Jane Smith',
          injuryType: 'Muscle Strain',
          bodyPart: 'Hamstring',
          severity: 'MODERATE',
          injuryDate: '2025-06-25',
          status: 'In Treatment',
          estimatedReturn: '2025-07-10',
        },
        {
          id: 'inj2',
          playerId: '3',
          playerName: 'Mike Johnson',
          injuryType: 'Bruise',
          bodyPart: 'Shoulder',
          severity: 'MINOR',
          injuryDate: '2025-06-30',
          status: 'Recovering',
          estimatedReturn: '2025-07-05',
        },
      ],
    });
  });
  
  describe('Adding New Injuries', () => {
    it('should add a new injury successfully', () => {
      const injuryDate = new Date();
      injuryDate.setDate(injuryDate.getDate() - 2); // 2 days ago
      
      medicalDashboard.visit();
      medicalDashboard.addInjury({
        playerId: '1',
        injuryType: 'Sprain',
        bodyPart: 'Ankle',
        severity: 'MODERATE',
        injuryDate: injuryDate,
        description: 'Player twisted ankle during practice drill. Moderate swelling observed.',
        diagnosis: 'Grade 2 ankle sprain, lateral ligament affected',
        estimatedRecoveryWeeks: 3,
      });
      
      // Mock successful creation
      cy.mockApiResponse('POST', '**/api/medical/injuries', {
        id: 'inj3',
        success: true,
      });
      
      medicalDashboard.assertInjuryAdded();
      
      // Verify injury appears in active list
      cy.contains('John Doe').should('be.visible');
      cy.contains('Ankle Sprain').should('be.visible');
    });
    
    it('should validate injury form inputs', () => {
      medicalDashboard.visit();
      medicalDashboard.openAddInjuryForm();
      
      // Try to submit empty form
      medicalDashboard.submitInjury();
      
      // Check validation errors
      cy.contains('Player is required').should('be.visible');
      cy.contains('Injury type is required').should('be.visible');
      cy.contains('Body part is required').should('be.visible');
      cy.contains('Severity is required').should('be.visible');
      cy.contains('Description is required').should('be.visible');
    });
    
    it('should prevent future injury dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      medicalDashboard.visit();
      medicalDashboard.openAddInjuryForm();
      
      cy.get('input[name="injuryDate"]').click();
      
      // Future dates should be disabled
      cy.get(`[data-date="${futureDate.toISOString().split('T')[0]}"]`)
        .should('have.attr', 'disabled');
    });
  });
  
  describe('Managing Active Injuries', () => {
    it('should update injury status', () => {
      medicalDashboard.visit();
      medicalDashboard.viewActiveInjuries();
      
      // Update Jane's injury status
      medicalDashboard.updateInjuryStatus('inj1', 'Recovering');
      
      // Mock update response
      cy.mockApiResponse('PUT', '**/api/medical/injuries/inj1/status', {
        success: true,
      });
      
      cy.checkToast('Injury status updated');
      cy.get('[data-testid="injury-inj1"]').should('contain', 'Recovering');
    });
    
    it('should add treatment notes with timestamp', () => {
      medicalDashboard.visit();
      
      const treatmentNote = 'Completed physiotherapy session. Range of motion improving. Ice applied for 20 minutes.';
      medicalDashboard.addTreatmentNote('inj1', treatmentNote);
      
      // Mock note addition
      cy.mockApiResponse('POST', '**/api/medical/injuries/inj1/notes', {
        id: 'note1',
        success: true,
        timestamp: new Date().toISOString(),
      });
      
      cy.checkToast('Treatment note added');
      
      // Verify note appears in injury details
      cy.get('[data-testid="injury-inj1-notes"]').click();
      cy.contains(treatmentNote).should('be.visible');
      cy.contains('Just now').should('be.visible');
    });
    
    it('should track injury progression', () => {
      medicalDashboard.visit();
      cy.get('[data-testid="injury-inj1"]').click();
      
      // Mock progression data
      cy.mockApiResponse('GET', '**/api/medical/injuries/inj1/progression', {
        assessments: [
          {
            date: '2025-06-25',
            painLevel: 8,
            mobility: 30,
            strength: 40,
            notes: 'Initial assessment',
          },
          {
            date: '2025-06-28',
            painLevel: 6,
            mobility: 50,
            strength: 50,
            notes: 'Improvement after 3 days',
          },
          {
            date: '2025-07-01',
            painLevel: 4,
            mobility: 70,
            strength: 65,
            notes: 'Significant improvement',
          },
        ],
      });
      
      // View progression chart
      cy.get('[data-testid="progression-tab"]').click();
      cy.get('[data-testid="progression-chart"]').should('be.visible');
      
      // Add new assessment
      cy.get('button:contains("Add Assessment")').click();
      cy.get('input[name="painLevel"]').invoke('val', 3).trigger('change');
      cy.get('input[name="mobility"]').invoke('val', 80).trigger('change');
      cy.get('input[name="strength"]').invoke('val', 75).trigger('change');
      cy.get('textarea[name="assessmentNotes"]').type('Ready for light training');
      cy.get('button:contains("Save Assessment")').click();
      
      cy.checkToast('Assessment saved');
    });
  });
  
  describe('Return to Play Protocol', () => {
    it('should clear player for return with protocol', () => {
      medicalDashboard.visit();
      
      // Start return to play process for Mike
      medicalDashboard.clearPlayerForReturn('3');
      
      // Fill return to play checklist
      cy.get('[data-testid="rtp-checklist"]').within(() => {
        cy.get('input[name="painFree"]').check();
        cy.get('input[name="fullRangeOfMotion"]').check();
        cy.get('input[name="normalStrength"]').check();
        cy.get('input[name="sportSpecificTesting"]').check();
        cy.get('input[name="psychologicalReadiness"]').check();
      });
      
      // Add clearance notes
      cy.get('textarea[name="clearanceNotes"]').type(
        'Player completed all return to play protocols. No pain reported during testing. Cleared for full participation.'
      );
      
      // Select clearance type
      cy.get('select[name="clearanceType"]').select('Full Clearance');
      
      // Confirm clearance
      cy.get('button:contains("Confirm Clearance")').click();
      
      // Mock clearance response
      cy.mockApiResponse('POST', '**/api/medical/injuries/inj2/clearance', {
        success: true,
        clearanceId: 'clr1',
      });
      
      medicalDashboard.assertPlayerCleared();
      
      // Verify injury status updated
      cy.get('[data-testid="injury-inj2"]').should('contain', 'Cleared');
    });
    
    it('should require all checklist items for clearance', () => {
      medicalDashboard.visit();
      medicalDashboard.clearPlayerForReturn('3');
      
      // Try to clear without checking all items
      cy.get('button:contains("Confirm Clearance")').click();
      
      // Should show validation error
      cy.contains('All checklist items must be completed').should('be.visible');
    });
  });
  
  describe('Treatment Scheduling', () => {
    it('should schedule treatment sessions', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      medicalDashboard.visit();
      medicalDashboard.scheduleTreatment({
        playerId: '2',
        date: tomorrow,
        time: '14:00',
        type: 'Physiotherapy',
        duration: 45,
      });
      
      // Mock schedule response
      cy.mockApiResponse('POST', '**/api/medical/treatments/schedule', {
        id: 'treat1',
        success: true,
      });
      
      cy.checkToast('Treatment scheduled successfully');
      
      // Verify in schedule
      cy.get('[data-testid="treatment-schedule"]').should('contain', 'Jane Smith');
      cy.get('[data-testid="treatment-schedule"]').should('contain', 'Physiotherapy');
    });
    
    it('should prevent scheduling conflicts', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Mock existing treatments
      cy.mockApiResponse('GET', '**/api/medical/treatments/conflicts', {
        conflicts: [{
          id: 'treat0',
          playerName: 'Jane Smith',
          time: '14:00-14:45',
          type: 'Massage Therapy',
        }],
      });
      
      medicalDashboard.visit();
      cy.get('button:contains("Schedule Treatment")').click();
      
      cy.get('select[name="playerId"]').select('2');
      cy.get('input[name="treatmentDate"]').click();
      cy.selectDate(tomorrow);
      cy.get('input[name="treatmentTime"]').clear().type('14:15');
      
      // Should show conflict warning
      cy.contains('Schedule conflict').should('be.visible');
      cy.contains('Jane Smith already has Massage Therapy at 14:00-14:45').should('be.visible');
    });
  });
  
  describe('Medical Reports and Alerts', () => {
    it('should generate medical reports', () => {
      medicalDashboard.visit();
      medicalDashboard.generateMedicalReport('2');
      
      // Mock report generation
      cy.mockApiResponse('POST', '**/api/medical/reports/generate', {
        reportId: 'rep1',
        url: '/reports/medical-report-jane-smith.pdf',
      });
      
      cy.checkToast('Report generated successfully');
      
      // Should trigger download
      cy.get('[data-testid="download-report"]').should('have.attr', 'href', '/reports/medical-report-jane-smith.pdf');
    });
    
    it('should handle medical alerts', () => {
      // Mock medical alerts
      cy.mockApiResponse('GET', '**/api/medical/alerts', {
        alerts: [
          {
            id: 'alert1',
            type: 'injury_update',
            message: 'John Doe reported increased pain in ankle',
            severity: 'high',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'alert2',
            type: 'treatment_missed',
            message: 'Sarah Williams missed scheduled treatment',
            severity: 'medium',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      });
      
      medicalDashboard.visit();
      medicalDashboard.viewMedicalAlerts();
      
      // Check high severity alert
      cy.get('[data-testid="alert-alert1"]').should('have.class', 'alert-high');
      
      // Acknowledge alert
      medicalDashboard.acknowledgeAlert('alert1');
      
      cy.mockApiResponse('PUT', '**/api/medical/alerts/alert1/acknowledge', {
        success: true,
      });
      
      cy.checkToast('Alert acknowledged');
      cy.get('[data-testid="alert-alert1"]').should('have.class', 'acknowledged');
    });
  });
  
  describe('Injury Statistics and Analytics', () => {
    it('should view injury analytics dashboard', () => {
      medicalDashboard.visit();
      medicalDashboard.navigateToReports();
      
      // Mock analytics data
      cy.mockApiResponse('GET', '**/api/medical/analytics', {
        totalInjuries: 15,
        activeInjuries: 3,
        averageRecoveryTime: 14,
        injuryByType: {
          'Muscle Strain': 5,
          'Sprain': 4,
          'Bruise': 3,
          'Fracture': 2,
          'Other': 1,
        },
        injuryByBodyPart: {
          'Ankle': 4,
          'Knee': 3,
          'Shoulder': 3,
          'Back': 2,
          'Other': 3,
        },
        monthlyTrend: [
          { month: 'April', count: 2 },
          { month: 'May', count: 4 },
          { month: 'June', count: 5 },
          { month: 'July', count: 4 },
        ],
      });
      
      // Check analytics display
      cy.contains('Injury Analytics').should('be.visible');
      cy.contains('15 Total Injuries').should('be.visible');
      cy.contains('3 Active').should('be.visible');
      cy.contains('14 days avg recovery').should('be.visible');
      
      // Check charts
      cy.get('[data-testid="injury-type-chart"]').should('be.visible');
      cy.get('[data-testid="body-part-chart"]').should('be.visible');
      cy.get('[data-testid="monthly-trend-chart"]').should('be.visible');
    });
  });
});