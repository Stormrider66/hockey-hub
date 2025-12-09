export class MedicalStaffDashboard {
  private readonly url = '/medical';
  
  // Selectors
  private readonly dashboardHeader = '[data-testid="dashboard-header"]';
  private readonly injuryManagementCard = '[data-testid="injury-management-card"]';
  private readonly activeInjuriesCard = '[data-testid="active-injuries-card"]';
  private readonly medicalAlertsCard = '[data-testid="medical-alerts-card"]';
  private readonly treatmentScheduleCard = '[data-testid="treatment-schedule-card"]';
  
  // Injury form selectors
  private readonly addInjuryButton = 'button:contains("Add Injury")';
  private readonly playerSelect = 'select[name="playerId"]';
  private readonly injuryTypeSelect = 'select[name="injuryType"]';
  private readonly bodyPartSelect = 'select[name="bodyPart"]';
  private readonly severitySelect = 'select[name="severity"]';
  private readonly injuryDateInput = 'input[name="injuryDate"]';
  private readonly descriptionTextarea = 'textarea[name="description"]';
  private readonly diagnosisTextarea = 'textarea[name="diagnosis"]';
  private readonly estimatedRecoveryInput = 'input[name="estimatedRecoveryWeeks"]';
  private readonly injurySubmitButton = 'button[type="submit"]:contains("Save Injury")';
  
  visit() {
    cy.visit(this.url);
    cy.get(this.dashboardHeader).should('be.visible');
    return this;
  }
  
  openAddInjuryForm() {
    cy.get(this.addInjuryButton).click();
    return this;
  }
  
  fillInjuryDetails(injury: {
    playerId: string;
    injuryType: string;
    bodyPart: string;
    severity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
    injuryDate: Date;
    description: string;
    diagnosis?: string;
    estimatedRecoveryWeeks?: number;
  }) {
    cy.get(this.playerSelect).select(injury.playerId);
    cy.get(this.injuryTypeSelect).select(injury.injuryType);
    cy.get(this.bodyPartSelect).select(injury.bodyPart);
    cy.get(this.severitySelect).select(injury.severity);
    
    // Handle date selection
    cy.get(this.injuryDateInput).click();
    cy.selectDate(injury.injuryDate);
    
    cy.get(this.descriptionTextarea).clear().type(injury.description);
    
    if (injury.diagnosis) {
      cy.get(this.diagnosisTextarea).clear().type(injury.diagnosis);
    }
    
    if (injury.estimatedRecoveryWeeks) {
      cy.get(this.estimatedRecoveryInput).clear().type(injury.estimatedRecoveryWeeks.toString());
    }
    
    return this;
  }
  
  submitInjury() {
    cy.get(this.injurySubmitButton).click();
    return this;
  }
  
  addInjury(injury: {
    playerId: string;
    injuryType: string;
    bodyPart: string;
    severity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
    injuryDate: Date;
    description: string;
  }) {
    this.openAddInjuryForm();
    this.fillInjuryDetails(injury);
    this.submitInjury();
    return this;
  }
  
  assertInjuryAdded() {
    cy.checkToast('Injury recorded successfully');
    return this;
  }
  
  viewActiveInjuries() {
    cy.get(this.activeInjuriesCard).should('be.visible');
    return this;
  }
  
  updateInjuryStatus(injuryId: string, status: string) {
    cy.get(`[data-testid="injury-${injuryId}"]`).within(() => {
      cy.get('button:contains("Update Status")').click();
    });
    cy.get(`select[name="status"]`).select(status);
    cy.get('button:contains("Save")').click();
    return this;
  }
  
  addTreatmentNote(injuryId: string, note: string) {
    cy.get(`[data-testid="injury-${injuryId}"]`).within(() => {
      cy.get('button:contains("Add Note")').click();
    });
    cy.get('textarea[name="treatmentNote"]').type(note);
    cy.get('button:contains("Save Note")').click();
    return this;
  }
  
  clearPlayerForReturn(playerId: string) {
    cy.get(`[data-testid="player-${playerId}-clearance"]`).within(() => {
      cy.get('button:contains("Clear for Return")').click();
    });
    cy.get('button:contains("Confirm Clearance")').click();
    return this;
  }
  
  assertPlayerCleared() {
    cy.checkToast('Player cleared for return');
    return this;
  }
  
  scheduleTreatment(treatment: {
    playerId: string;
    date: Date;
    time: string;
    type: string;
    duration: number;
  }) {
    cy.get('button:contains("Schedule Treatment")').click();
    cy.get('select[name="playerId"]').select(treatment.playerId);
    cy.get('input[name="treatmentDate"]').click();
    cy.selectDate(treatment.date);
    cy.get('input[name="treatmentTime"]').clear().type(treatment.time);
    cy.get('select[name="treatmentType"]').select(treatment.type);
    cy.get('input[name="duration"]').clear().type(treatment.duration.toString());
    cy.get('button:contains("Schedule")').click();
    return this;
  }
  
  viewMedicalAlerts() {
    cy.get(this.medicalAlertsCard).scrollIntoView().should('be.visible');
    return this;
  }
  
  acknowledgeAlert(alertId: string) {
    cy.get(`[data-testid="alert-${alertId}"]`).within(() => {
      cy.get('button:contains("Acknowledge")').click();
    });
    return this;
  }
  
  generateMedicalReport(playerId: string) {
    cy.get(`[data-testid="player-${playerId}"]`).within(() => {
      cy.get('button:contains("Generate Report")').click();
    });
    return this;
  }
  
  navigateToInjuries() {
    cy.get('a[href="/medical/injuries"]').click();
    return this;
  }
  
  navigateToTreatments() {
    cy.get('a[href="/medical/treatments"]').click();
    return this;
  }
  
  navigateToReports() {
    cy.get('a[href="/medical/reports"]').click();
    return this;
  }
}