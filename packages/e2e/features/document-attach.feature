Feature: Document Attach

  Background:
    Given I am authenticated and on the calendar page
    And a task block exists on the calendar

  Scenario: Task panel shows document search when a task is open
    When I click the first task block
    Then the document search input is visible

  Scenario: Notion search returns results
    When I click the first task block
    And I select "notion" as the document provider
    And I search for documents with "test"
    Then document search results are visible

  Scenario: Selecting a Notion result attaches it to the task
    When I click the first task block
    And I select "notion" as the document provider
    And I search for documents with "test"
    And I click the first search result
    Then the first search result is attached to the task

  Scenario: Confluence search returns results
    When I click the first task block
    And I select "confluence" as the document provider
    And I search for documents with "test"
    Then document search results are visible

  Scenario: Selecting a Confluence result attaches it to the task
    When I click the first task block
    And I select "confluence" as the document provider
    And I search for documents with "test"
    And I click the first search result
    Then the first search result is attached to the task

  Scenario: Removing an attached document unlinks it from the task
    When I click the first task block
    And I select "notion" as the document provider
    And I search for documents with "test"
    And I click the first search result
    And I remove the first attached document
    Then no attached documents are shown
