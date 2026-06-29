/// <reference types="cypress" />

// Backend-abhaengiger E2E-Test: Vollstaendiger Login-Ablauf.
// Voraussetzung: Das Go-Backend laeuft auf http://127.0.0.1:8088
// und das Frontend (Vite) auf http://localhost:5173.
//
// Der Test legt per API einen echten Nutzer an, loggt sich dann ueber
// das UI-Formular ein und prueft den authentifizierten Zustand der App.
describe('Login-Ablauf (echtes Backend)', () => {
  const password = 'password123'
  let email: string

  before(() => {
    // Eindeutige E-Mail, um Kollisionen zwischen Testlaeufen zu vermeiden.
    email = `e2e_${Date.now()}@unitube.test`
    cy.registerUser({ email, password, name: 'E2E', surname: 'Tester' })
  })

  it('meldet einen echten Nutzer an und zeigt den authentifizierten Zustand', () => {
    cy.loginViaUI(email, password)

    // Nach erfolgreichem Login erfolgt die Weiterleitung zur Startseite.
    cy.location('pathname').should('eq', '/')

    // Das JWT-Token wird clientseitig gespeichert.
    cy.window().its('localStorage.auth_token').should('be.a', 'string').and('not.be.empty')

    // Der Header wechselt in den authentifizierten Zustand.
    cy.contains('button', 'Video hochladen').should('be.visible')
    cy.get('#profile-menu-btn').should('be.visible')

    // Der Link "Anmelden" darf nicht mehr sichtbar sein.
    cy.contains('a', 'Anmelden').should('not.exist')
  })

  it('weist ungueltige Zugangsdaten ab und zeigt einen Fehler an', () => {
    cy.loginViaUI(email, 'mauvais-mot-de-passe')

    // Wir bleiben auf der Login-Seite und sehen eine Fehlermeldung.
    cy.location('pathname').should('eq', '/login')
    cy.get('.text-red-700, .text-red-400').should('be.visible')
    cy.window().its('localStorage.auth_token').should('not.exist')
  })
})
