Feature: Mobile Layout

  Background:
    Given I am authenticated and on the calendar page

  Scenario: Mobile header is visible on small viewports
    Then the mobile header is visible
    And the mobile menu button is visible

  Scenario: Calendar view renders correctly on mobile
    Then the calendar view is visible
    And the sidebar drawer is closed

  Scenario: Calendar events are visible on mobile
    Then at least one event block is visible

  Scenario: Tasks page renders on mobile
    When I tap the mobile menu button
    And I tap the Tasks nav item
    Then the tasks page is visible

  Scenario: Reports page renders on mobile
    When I tap the mobile menu button
    And I tap the Reports nav item
    Then the reports page is visible

  Scenario: Creating a task via the mobile new-task flow
    When I tap the mobile menu button
    And I tap the New button in the sidebar
    And I select Task from the new item picker
    And I fill in the task title as "Mobile Task"
    And I set the task dates to today
    And I submit the task form
    Then a calendar event with title "Mobile Task" is visible
