/// <reference types="cypress" />

// E2E: Oeffentliche Navigation zwischen Startseite, Login und Registrierung.
// Kein Backend erforderlich: Es werden nur SPA-Routing und Rendering geprueft.
describe('Oeffentliche Navigation (nicht authentifiziert)', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('zeigt den Header mit UniTube-Logo und Login-Link an', () => {
    cy.get('header').should('be.visible')
    cy.get('header > a:first').should('have.text', 'UniTube')

    // Im nicht authentifizierten Zustand muss der Link "Anmelden" sichtbar sein.
    cy.contains('a', 'Anmelden').should('have.attr', 'href', '/login')

    // Aktionen fuer eingeloggte Nutzer duerfen nicht sichtbar sein.
    cy.contains('button', 'Video hochladen').should('not.exist')
    cy.contains('Go Live').should('not.exist')
  })

  it('navigiert zur Login-Seite und zeigt das Formular an', () => {
    cy.contains('a', 'Anmelden').click()
    cy.location('pathname').should('eq', '/login')

    cy.contains('h1', 'UniTube').should('be.visible')
    cy.get('input#email').should('be.visible').and('have.attr', 'type', 'email')
    cy.get('input#password').should('be.visible').and('have.attr', 'type', 'password')
    cy.contains('button', 'Sich einloggen').should('be.visible')
  })

  it('wechselt von Login zur Registrierungsseite', () => {
    cy.visit('/login')

    cy.contains('a', "S'ich registrieren").click()
    cy.location('pathname').should('eq', '/register')

    cy.get('input#name').should('be.visible')
    cy.get('input#email').should('be.visible')
    cy.contains('button', 'Sich registrieren').should('be.visible')
  })
})
