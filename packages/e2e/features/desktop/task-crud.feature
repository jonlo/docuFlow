Feature: Task CRUD

  Background:
    Given I am authenticated and on the calendar page

  Scenario: Clicking New Task opens the task creation form
    When I click the new task button
    Then the task form is visible

  Scenario: Submitting an independent task creates a block on the calendar
    When I click the new task button
    And I fill in the task title as "E2E New Independent Task"
    And I set the task dates to today
    And I submit the task form
    Then a calendar event with title "E2E New Independent Task" is visible

  Scenario: Clicking a calendar event shows an Add Task button
    When I click the first calendar event
    Then the event detail panel is visible
    And the add task button is visible

  Scenario: Creating an event-linked task
    When I click the first calendar event
    And I click the add task button
    And I fill in the task title as "Linked Event Task"
    And I submit the task form
    Then the event detail panel contains "Linked Event Task"

  Scenario: Editing a task title updates the calendar block
    Given a task block exists on the calendar
    When I click the first task block
    And I update the task title to "Updated Task Title"
    And I submit the task form
    Then a calendar event with title "Updated Task Title" is visible

  Scenario: Confirming task deletion removes it from the calendar
    Given a task block exists on the calendar
    When I click the first task block
    And I note the task title
    And I delete the task and confirm
    Then the noted task is no longer on the calendar
