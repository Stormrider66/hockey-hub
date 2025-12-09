export class RegistrationPage {
  private readonly url = '/register';
  
  // Selectors
  private readonly firstNameInput = 'input[name="firstName"]';
  private readonly lastNameInput = 'input[name="lastName"]';
  private readonly emailInput = 'input[name="email"]';
  private readonly passwordInput = 'input[name="password"]';
  private readonly confirmPasswordInput = 'input[name="confirmPassword"]';
  private readonly phoneInput = 'input[name="phone"]';
  private readonly roleSelect = 'select[name="role"]';
  private readonly organizationSelect = 'select[name="organizationId"]';
  private readonly teamSelect = 'select[name="teamId"]';
  private readonly termsCheckbox = 'input[name="agreeToTerms"]';
  private readonly submitButton = 'button[type="submit"]';
  private readonly errorMessage = '[data-testid="error-message"]';
  private readonly successMessage = '[data-testid="success-message"]';
  
  visit() {
    cy.visit(this.url);
    return this;
  }
  
  fillPersonalInfo(firstName: string, lastName: string) {
    cy.get(this.firstNameInput).clear().type(firstName);
    cy.get(this.lastNameInput).clear().type(lastName);
    return this;
  }
  
  fillEmail(email: string) {
    cy.get(this.emailInput).clear().type(email);
    return this;
  }
  
  fillPasswords(password: string, confirmPassword?: string) {
    cy.get(this.passwordInput).clear().type(password);
    cy.get(this.confirmPasswordInput).clear().type(confirmPassword || password);
    return this;
  }
  
  fillPhone(phone: string) {
    cy.get(this.phoneInput).clear().type(phone);
    return this;
  }
  
  selectRole(role: string) {
    cy.get(this.roleSelect).select(role);
    return this;
  }
  
  selectOrganization(organizationId: string) {
    cy.get(this.organizationSelect).select(organizationId);
    return this;
  }
  
  selectTeam(teamId: string) {
    cy.get(this.teamSelect).select(teamId);
    return this;
  }
  
  acceptTerms() {
    cy.get(this.termsCheckbox).check();
    return this;
  }
  
  submit() {
    cy.get(this.submitButton).click();
    return this;
  }
  
  register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    organizationId?: string;
    teamId?: string;
  }) {
    this.fillPersonalInfo(userData.firstName, userData.lastName);
    this.fillEmail(userData.email);
    this.fillPasswords(userData.password);
    
    if (userData.phone) {
      this.fillPhone(userData.phone);
    }
    
    if (userData.role) {
      this.selectRole(userData.role);
    }
    
    if (userData.organizationId) {
      this.selectOrganization(userData.organizationId);
    }
    
    if (userData.teamId) {
      this.selectTeam(userData.teamId);
    }
    
    this.acceptTerms();
    this.submit();
    return this;
  }
  
  assertRegistrationSuccess() {
    cy.get(this.successMessage).should('be.visible');
    cy.url().should('include', '/verify-email');
    return this;
  }
  
  assertRegistrationError(message: string) {
    cy.get(this.errorMessage).should('be.visible').and('contain', message);
    return this;
  }
  
  assertFieldError(field: string, message: string) {
    cy.get(`[data-testid="${field}-error"]`).should('be.visible').and('contain', message);
    return this;
  }
}