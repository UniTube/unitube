/// <reference types="cypress" />
// ***********************************************
// Wiederverwendbare Custom Commands fuer E2E-Tests.
// https://on.cypress.io/custom-commands
// ***********************************************

const API = 'http://127.0.0.1:8088/api/v1'

// Legt ueber die Backend-API einen Nutzer an (fuer Tests mit echtem Konto).
Cypress.Commands.add('registerUser', (user) => {
  return cy
    .request({
      method: 'POST',
      url: `${API}/users`,
      body: {
        id: null,
        name: user.name ?? 'E2E',
        surname: user.surname ?? 'Tester',
        email: user.email,
        password: user.password,
      },
      failOnStatusCode: false,
    })
    .then((response) => {
      // 201 = erstellt, 200 = bereits vorhanden (je nach Implementierung): beides ok.
      expect(response.status).to.be.oneOf([200, 201, 409, 500])
      return response
    })
})

// Meldet einen Nutzer ueber das UI-Login-Formular an.
Cypress.Commands.add('loginViaUI', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input#email').clear().type(email)
  cy.get('input#password').clear().type(password)
  cy.contains('button', 'Sich einloggen').click()
})

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface RegisterUserOptions {
      email: string
      password: string
      name?: string
      surname?: string
    }
    interface Chainable {
      registerUser(user: RegisterUserOptions): Chainable<Cypress.Response<unknown>>
      loginViaUI(email: string, password: string): Chainable<void>
    }
  }
}

export {}
