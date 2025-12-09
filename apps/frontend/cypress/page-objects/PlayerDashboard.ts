export class PlayerDashboard {
  private readonly url = '/player';
  
  // Selectors
  private readonly dashboardHeader = '[data-testid="dashboard-header"]';
  private readonly wellnessCard = '[data-testid="wellness-card"]';
  private readonly scheduleCard = '[data-testid="schedule-card"]';
  private readonly trainingCard = '[data-testid="training-card"]';
  private readonly performanceCard = '[data-testid="performance-card"]';
  
  // Wellness form selectors
  private readonly wellnessButton = 'button:contains("Submit Wellness")';
  private readonly sleepQualitySlider = 'input[name="sleepQuality"]';
  private readonly sleepHoursInput = 'input[name="sleepHours"]';
  private readonly fatigueSlider = 'input[name="fatigue"]';
  private readonly sorenessSlider = 'input[name="soreness"]';
  private readonly stressSlider = 'input[name="stress"]';
  private readonly moodSlider = 'input[name="mood"]';
  private readonly hrvInput = 'input[name="hrv"]';
  private readonly restingHeartRateInput = 'input[name="restingHeartRate"]';
  private readonly weightInput = 'input[name="weight"]';
  private readonly notesTextarea = 'textarea[name="notes"]';
  private readonly wellnessSubmitButton = 'button[type="submit"]:contains("Submit")';
  
  visit() {
    cy.visit(this.url);
    cy.get(this.dashboardHeader).should('be.visible');
    return this;
  }
  
  openWellnessForm() {
    cy.get(this.wellnessButton).click();
    return this;
  }
  
  fillWellnessData(data: {
    sleepQuality?: number;
    sleepHours?: number;
    fatigue?: number;
    soreness?: number;
    stress?: number;
    mood?: number;
    hrv?: number;
    restingHeartRate?: number;
    weight?: number;
    notes?: string;
  }) {
    if (data.sleepQuality !== undefined) {
      cy.get(this.sleepQualitySlider).invoke('val', data.sleepQuality).trigger('change');
    }
    
    if (data.sleepHours !== undefined) {
      cy.get(this.sleepHoursInput).clear().type(data.sleepHours.toString());
    }
    
    if (data.fatigue !== undefined) {
      cy.get(this.fatigueSlider).invoke('val', data.fatigue).trigger('change');
    }
    
    if (data.soreness !== undefined) {
      cy.get(this.sorenessSlider).invoke('val', data.soreness).trigger('change');
    }
    
    if (data.stress !== undefined) {
      cy.get(this.stressSlider).invoke('val', data.stress).trigger('change');
    }
    
    if (data.mood !== undefined) {
      cy.get(this.moodSlider).invoke('val', data.mood).trigger('change');
    }
    
    if (data.hrv !== undefined) {
      cy.get(this.hrvInput).clear().type(data.hrv.toString());
    }
    
    if (data.restingHeartRate !== undefined) {
      cy.get(this.restingHeartRateInput).clear().type(data.restingHeartRate.toString());
    }
    
    if (data.weight !== undefined) {
      cy.get(this.weightInput).clear().type(data.weight.toString());
    }
    
    if (data.notes) {
      cy.get(this.notesTextarea).clear().type(data.notes);
    }
    
    return this;
  }
  
  submitWellnessForm() {
    cy.get(this.wellnessSubmitButton).click();
    return this;
  }
  
  assertWellnessSubmitted() {
    cy.checkToast('Wellness data submitted successfully');
    return this;
  }
  
  viewSchedule() {
    cy.get(this.scheduleCard).should('be.visible');
    return this;
  }
  
  viewUpcomingEvent(eventTitle: string) {
    cy.get(this.scheduleCard).within(() => {
      cy.contains(eventTitle).should('be.visible');
    });
    return this;
  }
  
  markTrainingComplete(sessionId: string) {
    cy.get(`[data-testid="training-${sessionId}"]`).within(() => {
      cy.get('button:contains("Mark Complete")').click();
    });
    return this;
  }
  
  viewPerformanceMetrics() {
    cy.get(this.performanceCard).scrollIntoView().should('be.visible');
    return this;
  }
  
  assertMetricValue(metric: string, value: string) {
    cy.get(`[data-testid="${metric}-value"]`).should('contain', value);
    return this;
  }
  
  navigateToCalendar() {
    cy.get('a[href="/player/calendar"]').click();
    return this;
  }
  
  navigateToTraining() {
    cy.get('a[href="/player/training"]').click();
    return this;
  }
  
  navigateToProfile() {
    cy.get('a[href="/player/profile"]').click();
    return this;
  }
}