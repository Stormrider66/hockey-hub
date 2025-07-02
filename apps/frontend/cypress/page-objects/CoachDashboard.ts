export class CoachDashboard {
  private readonly url = '/coach';
  
  // Selectors
  private readonly dashboardHeader = '[data-testid="dashboard-header"]';
  private readonly createSessionButton = 'button:contains("Create Training Session")';
  private readonly teamRosterCard = '[data-testid="team-roster-card"]';
  private readonly upcomingSessionsCard = '[data-testid="upcoming-sessions-card"]';
  private readonly performanceOverviewCard = '[data-testid="performance-overview-card"]';
  
  // Training session form selectors
  private readonly sessionTitleInput = 'input[name="title"]';
  private readonly sessionTypeSelect = 'select[name="type"]';
  private readonly sessionDateInput = 'input[name="date"]';
  private readonly sessionStartTimeInput = 'input[name="startTime"]';
  private readonly sessionEndTimeInput = 'input[name="endTime"]';
  private readonly sessionLocationSelect = 'select[name="locationId"]';
  private readonly sessionDescriptionTextarea = 'textarea[name="description"]';
  private readonly sessionObjectivesTextarea = 'textarea[name="objectives"]';
  private readonly playerCheckboxPrefix = 'input[name="players[';
  private readonly sessionSubmitButton = 'button[type="submit"]:contains("Create Session")';
  
  visit() {
    cy.visit(this.url);
    cy.get(this.dashboardHeader).should('be.visible');
    return this;
  }
  
  openCreateSessionForm() {
    cy.get(this.createSessionButton).click();
    return this;
  }
  
  fillSessionDetails(session: {
    title: string;
    type: string;
    date: Date;
    startTime: string;
    endTime: string;
    locationId?: string;
    description?: string;
    objectives?: string;
  }) {
    cy.get(this.sessionTitleInput).clear().type(session.title);
    cy.get(this.sessionTypeSelect).select(session.type);
    
    // Handle date selection
    cy.get(this.sessionDateInput).click();
    cy.selectDate(session.date);
    
    cy.get(this.sessionStartTimeInput).clear().type(session.startTime);
    cy.get(this.sessionEndTimeInput).clear().type(session.endTime);
    
    if (session.locationId) {
      cy.get(this.sessionLocationSelect).select(session.locationId);
    }
    
    if (session.description) {
      cy.get(this.sessionDescriptionTextarea).clear().type(session.description);
    }
    
    if (session.objectives) {
      cy.get(this.sessionObjectivesTextarea).clear().type(session.objectives);
    }
    
    return this;
  }
  
  selectPlayers(playerIds: string[]) {
    playerIds.forEach(playerId => {
      cy.get(`${this.playerCheckboxPrefix}${playerId}"]`).check();
    });
    return this;
  }
  
  selectAllPlayers() {
    cy.get('button:contains("Select All")').click();
    return this;
  }
  
  submitSession() {
    cy.get(this.sessionSubmitButton).click();
    return this;
  }
  
  createTrainingSession(session: {
    title: string;
    type: string;
    date: Date;
    startTime: string;
    endTime: string;
    playerIds?: string[];
    selectAll?: boolean;
  }) {
    this.openCreateSessionForm();
    this.fillSessionDetails(session);
    
    if (session.selectAll) {
      this.selectAllPlayers();
    } else if (session.playerIds) {
      this.selectPlayers(session.playerIds);
    }
    
    this.submitSession();
    return this;
  }
  
  assertSessionCreated(title: string) {
    cy.checkToast('Training session created successfully');
    cy.get(this.upcomingSessionsCard).should('contain', title);
    return this;
  }
  
  viewTeamRoster() {
    cy.get(this.teamRosterCard).should('be.visible');
    return this;
  }
  
  searchPlayer(name: string) {
    cy.get('input[placeholder="Search players..."]').clear().type(name);
    return this;
  }
  
  viewPlayerProfile(playerId: string) {
    cy.get(`[data-testid="player-${playerId}"]`).click();
    return this;
  }
  
  editSession(sessionId: string) {
    cy.get(`[data-testid="session-${sessionId}"]`).within(() => {
      cy.get('button:contains("Edit")').click();
    });
    return this;
  }
  
  cancelSession(sessionId: string) {
    cy.get(`[data-testid="session-${sessionId}"]`).within(() => {
      cy.get('button:contains("Cancel")').click();
    });
    cy.get('button:contains("Confirm Cancel")').click();
    return this;
  }
  
  viewSessionDetails(sessionId: string) {
    cy.get(`[data-testid="session-${sessionId}"]`).click();
    return this;
  }
  
  navigateToCalendar() {
    cy.get('a[href="/coach/calendar"]').click();
    return this;
  }
  
  navigateToAnalytics() {
    cy.get('a[href="/coach/analytics"]').click();
    return this;
  }
  
  navigateToPlanning() {
    cy.get('a[href="/coach/planning"]').click();
    return this;
  }
}