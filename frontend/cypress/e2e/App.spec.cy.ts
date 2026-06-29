describe('Basis-Template', () => {
  it('zeigt die Standardelemente im Header an', () => {
    cy.visit('http://localhost:5173')

    cy.get('header').should('be.visible')
    cy.get('header').should('exist')
    cy.get('header>a:first').should('have.text', 'UniTube')
  })
})
