Feature: Mobile Navigation

  Background:
    Given I am authenticated and on the calendar page

  Scenario: Sidebar is hidden by default on mobile
    Then the mobile menu button is visible
    And the sidebar drawer is closed

  Scenario: Tapping the mobile menu button opens the sidebar
    When I tap the mobile menu button
    Then the sidebar drawer is open

  Scenario: The close button hides the sidebar
    When I tap the mobile menu button
    And I tap the sidebar close button
    Then the sidebar drawer is closed

  Scenario: Tapping the overlay closes the sidebar
    When I tap the mobile menu button
    And I tap outside the sidebar
    Then the sidebar drawer is closed

  Scenario: Navigating to Tasks page closes the sidebar
    When I tap the mobile menu button
    And I tap the Tasks nav item
    Then the tasks page is visible
    And the sidebar drawer is closed

  Scenario: Navigating to Reports page closes the sidebar
    When I tap the mobile menu button
    And I tap the Reports nav item
    Then the reports page is visible
    And the sidebar drawer is closed

  Scenario: Opening new task from mobile sidebar
    When I tap the mobile menu button
    And I tap the New button in the sidebar
    And I select Task from the new item picker
    Then the task form is visible
