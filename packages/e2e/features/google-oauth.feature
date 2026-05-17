Feature: Google OAuth

  Scenario: Shows sign-in button when unauthenticated
    Given Google Calendar is disconnected
    When I visit the home page
    Then the connect Google Calendar button is visible

  Scenario: Clicking sign-in opens OAuth popup
    Given Google Calendar is disconnected
    When I visit the home page
    Then clicking the connect button opens a Google accounts popup

  Scenario: Completing OAuth shows calendar view and hides sign-in button
    Given Google Calendar is connected
    When I visit the home page
    Then the calendar view is visible
    And the connect Google Calendar button is not visible

  Scenario: Page reload preserves authenticated state
    Given Google Calendar is connected
    When I visit the home page
    And I reload the page
    Then the calendar view is visible
    And the connect Google Calendar button is not visible
