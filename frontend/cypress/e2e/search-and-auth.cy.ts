/// <reference types="cypress" />

// E2E: Suche ueber den Header und clientseitige Validierung des Login-Formulars.
describe('Suche und Formularvalidierung', () => {
  it('aktualisiert die URL mit dem Suchparameter', () => {
    cy.visit('/')

    cy.get('header input[placeholder="Search"]').type('learn rust{enter}')

    // Das Absenden fuehrt zu /?search=... (URL-Kodierung von Leerzeichen).
    cy.location('pathname').should('eq', '/')
    cy.location('search').should('eq', '?search=learn%20rust')

    // Das Eingabefeld behaelt die Suchanfrage nach der Navigation.
    cy.get('header input[placeholder="Search"]').should('have.value', 'learn rust')
  })

  it('verhindert das Absenden des Login-Formulars bei leeren Pflichtfeldern', () => {
    cy.visit('/login')

    cy.contains('button', 'Sich einloggen').click()

    // Die HTML5-Validierung blockiert das Absenden: Wir bleiben auf /login.
    cy.location('pathname').should('eq', '/login')

    // Das Pflichtfeld E-Mail wird vom Browser als ungueltig markiert.
    cy.get('input#email:invalid').should('exist')
    cy.get('input#email').then(($input) => {
      const el = $input[0] as HTMLInputElement
      expect(el.checkValidity()).to.eq(false)
      expect(el.validity.valueMissing).to.eq(true)
    })
  })

  it('akzeptiert die Eingabe von Zugangsdaten im Login-Formular', () => {
    cy.visit('/login')

    cy.get('input#email').type('student@unitube.test').should('have.value', 'student@unitube.test')
    cy.get('input#password').type('password123').should('have.value', 'password123')

    // Der Submit-Button bleibt aktiv, solange keine Anfrage laeuft.
    cy.contains('button', 'Sich einloggen').should('be.enabled')
  })
})
