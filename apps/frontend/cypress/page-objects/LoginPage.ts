export class LoginPage {
  private readonly url = '/login';
  
  // Selectors
  private readonly emailInput = 'input[name="email"]';
  private readonly passwordInput = 'input[name="password"]';
  private readonly submitButton = 'button[type="submit"]';
  private readonly errorMessage = '[data-testid="error-message"]';
  private readonly forgotPasswordLink = 'a[href="/forgot-password"]';
  private readonly registerLink = 'a[href="/register"]';
  private readonly rememberMeCheckbox = 'input[name="rememberMe"]';
  
  visit() {
    cy.visit(this.url);
    return this;
  }
  
  fillEmail(email: string) {
    cy.get(this.emailInput).clear().type(email);
    return this;
  }
  
  fillPassword(password: string) {
    cy.get(this.passwordInput).clear().type(password);
    return this;
  }
  
  checkRememberMe() {
    cy.get(this.rememberMeCheckbox).check();
    return this;
  }
  
  submit() {
    cy.get(this.submitButton).click();
    return this;
  }
  
  login(email: string, password: string) {
    this.fillEmail(email);
    this.fillPassword(password);
    this.submit();
    return this;
  }
  
  clickForgotPassword() {
    cy.get(this.forgotPasswordLink).click();
    return this;
  }
  
  clickRegister() {
    cy.get(this.registerLink).click();
    return this;
  }
  
  getErrorMessage() {
    return cy.get(this.errorMessage);
  }
  
  assertLoginSuccess() {
    cy.url().should('not.include', '/login');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.exist;
    });
    return this;
  }
  
  assertLoginError(message: string) {
    this.getErrorMessage().should('be.visible').and('contain', message);
    return this;
  }
}