export class ParentDashboard {
  private readonly url = '/parent';
  
  // Selectors
  private readonly dashboardHeader = '[data-testid="dashboard-header"]';
  private readonly childrenTabsContainer = '[data-testid="children-tabs"]';
  private readonly scheduleCard = '[data-testid="schedule-card"]';
  private readonly medicalInfoCard = '[data-testid="medical-info-card"]';
  private readonly paymentsCard = '[data-testid="payments-card"]';
  private readonly messagesCard = '[data-testid="messages-card"]';
  private readonly calendarView = '[data-testid="calendar-view"]';
  
  visit() {
    cy.visit(this.url);
    cy.get(this.dashboardHeader).should('be.visible');
    return this;
  }
  
  selectChild(childName: string) {
    cy.get(this.childrenTabsContainer).within(() => {
      cy.contains('button', childName).click();
    });
    return this;
  }
  
  viewChildSchedule() {
    cy.get(this.scheduleCard).should('be.visible');
    return this;
  }
  
  viewUpcomingEvent(eventTitle: string) {
    cy.get(this.scheduleCard).within(() => {
      cy.contains(eventTitle).should('be.visible');
    });
    return this;
  }
  
  openCalendarView() {
    cy.get('button:contains("View Full Calendar")').click();
    cy.get(this.calendarView).should('be.visible');
    return this;
  }
  
  viewEventDetails(eventTitle: string) {
    cy.contains(eventTitle).click();
    return this;
  }
  
  rsvpToEvent(response: 'attending' | 'not-attending' | 'maybe') {
    cy.get(`button[data-testid="rsvp-${response}"]`).click();
    return this;
  }
  
  assertRsvpSaved() {
    cy.checkToast('RSVP saved successfully');
    return this;
  }
  
  viewMedicalInfo() {
    cy.get(this.medicalInfoCard).scrollIntoView().should('be.visible');
    return this;
  }
  
  viewInjuryHistory() {
    cy.get('button:contains("View Injury History")').click();
    return this;
  }
  
  downloadMedicalReport() {
    cy.get('button:contains("Download Medical Report")').click();
    return this;
  }
  
  viewPayments() {
    cy.get(this.paymentsCard).scrollIntoView().should('be.visible');
    return this;
  }
  
  makePayment(invoiceId: string) {
    cy.get(`[data-testid="invoice-${invoiceId}"]`).within(() => {
      cy.get('button:contains("Pay Now")').click();
    });
    return this;
  }
  
  viewPaymentHistory() {
    cy.get('button:contains("View Payment History")').click();
    return this;
  }
  
  sendMessageToCoach(message: string) {
    cy.get('button:contains("Message Coach")').click();
    cy.get('textarea[name="message"]').type(message);
    cy.get('button:contains("Send")').click();
    return this;
  }
  
  viewMessages() {
    cy.get(this.messagesCard).scrollIntoView().should('be.visible');
    return this;
  }
  
  assertMessageSent() {
    cy.checkToast('Message sent successfully');
    return this;
  }
  
  updateEmergencyContact(contact: {
    name: string;
    phone: string;
    relationship: string;
  }) {
    cy.get('button:contains("Update Emergency Contacts")').click();
    cy.get('input[name="emergencyContactName"]').clear().type(contact.name);
    cy.get('input[name="emergencyContactPhone"]').clear().type(contact.phone);
    cy.get('select[name="emergencyContactRelationship"]').select(contact.relationship);
    cy.get('button:contains("Save")').click();
    return this;
  }
  
  assertEmergencyContactUpdated() {
    cy.checkToast('Emergency contact updated successfully');
    return this;
  }
  
  navigateToCalendar() {
    cy.get('a[href="/parent/calendar"]').click();
    return this;
  }
  
  navigateToPayments() {
    cy.get('a[href="/parent/payments"]').click();
    return this;
  }
  
  navigateToMessages() {
    cy.get('a[href="/parent/messages"]').click();
    return this;
  }
}