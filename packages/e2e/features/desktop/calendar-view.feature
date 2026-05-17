Feature: Calendar View

  Background:
    Given I am authenticated and on the calendar page

  Scenario: Calendar component is visible after login
    Then the calendar view is visible

  Scenario: At least one event block is rendered for the current week
    Then at least one event block is visible

  Scenario: Event block displays the event title
    Then the first event block has a non-empty title

  Scenario: Clicking next-week button advances the calendar
    Given I have noted the current calendar header
    When I click the next week button
    Then the calendar header has changed

  Scenario: Clicking previous-week button goes back
    When I click the next week button
    And I note the current calendar header
    And I click the previous week button
    Then the calendar header has changed

  Scenario: Clicking Today button returns to the current week
    Given I have noted the current calendar header
    When I click the next week button
    And I click the today button
    Then the calendar header matches the noted header
