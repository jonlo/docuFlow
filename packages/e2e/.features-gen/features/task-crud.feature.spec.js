// Generated from: features/task-crud.feature
import { test } from "../../fixtures/auth.ts";

test.describe('Task CRUD', () => {

  test.beforeEach('Background', async ({ Given, authenticatedPage }, testInfo) => { if (testInfo.error) return;
    await Given('I am authenticated and on the calendar page', null, { authenticatedPage }); 
  });
  
  test('Clicking New Task opens the task creation form', async ({ When, Then, page }) => { 
    await When('I click the new task button', null, { page }); 
    await Then('the task form is visible', null, { page }); 
  });

  test('Submitting an independent task creates a block on the calendar', async ({ When, Then, And, page }) => { 
    await When('I click the new task button', null, { page }); 
    await And('I fill in the task title as "E2E New Independent Task"', null, { page }); 
    await And('I set the task dates to today', null, { page }); 
    await And('I submit the task form', null, { page }); 
    await Then('a calendar event with title "E2E New Independent Task" is visible', null, { page }); 
  });

  test('Clicking a calendar event shows an Add Task button', async ({ When, Then, And, page }) => { 
    await When('I click the first calendar event', null, { page }); 
    await Then('the event detail panel is visible', null, { page }); 
    await And('the add task button is visible', null, { page }); 
  });

  test('Creating an event-linked task', async ({ When, Then, And, page }) => { 
    await When('I click the first calendar event', null, { page }); 
    await And('I click the add task button', null, { page }); 
    await And('I fill in the task title as "Linked Event Task"', null, { page }); 
    await And('I submit the task form', null, { page }); 
    await Then('the event detail panel contains "Linked Event Task"', null, { page }); 
  });

  test('Editing a task title updates the calendar block', async ({ Given, When, Then, And, page }) => { 
    await Given('a task block exists on the calendar', null, { page }); 
    await When('I click the first task block', null, { page }); 
    await And('I update the task title to "Updated Task Title"', null, { page }); 
    await And('I submit the task form', null, { page }); 
    await Then('a calendar event with title "Updated Task Title" is visible', null, { page }); 
  });

  test('Confirming task deletion removes it from the calendar', async ({ Given, When, Then, And, page, state }) => { 
    await Given('a task block exists on the calendar', null, { page }); 
    await When('I click the first task block', null, { page }); 
    await And('I note the task title', null, { page, state }); 
    await And('I delete the task and confirm', null, { page }); 
    await Then('the noted task is no longer on the calendar', null, { page, state }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features/task-crud.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":6,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"When I click the new task button","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then the task form is visible","stepMatchArguments":[]}]},
  {"pwTestLine":15,"pickleLine":10,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When I click the new task button","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"And I fill in the task title as \"E2E New Independent Task\"","stepMatchArguments":[{"group":{"start":28,"value":"\"E2E New Independent Task\"","children":[{"start":29,"value":"E2E New Independent Task","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"And I set the task dates to today","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"And I submit the task form","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then a calendar event with title \"E2E New Independent Task\" is visible","stepMatchArguments":[{"group":{"start":28,"value":"\"E2E New Independent Task\"","children":[{"start":29,"value":"E2E New Independent Task","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":23,"pickleLine":17,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When I click the first calendar event","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then the event detail panel is visible","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And the add task button is visible","stepMatchArguments":[]}]},
  {"pwTestLine":29,"pickleLine":22,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"When I click the first calendar event","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"And I click the add task button","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"And I fill in the task title as \"Linked Event Task\"","stepMatchArguments":[{"group":{"start":28,"value":"\"Linked Event Task\"","children":[{"start":29,"value":"Linked Event Task","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":33,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"And I submit the task form","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then the event detail panel contains \"Linked Event Task\"","stepMatchArguments":[{"group":{"start":32,"value":"\"Linked Event Task\"","children":[{"start":33,"value":"Linked Event Task","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":37,"pickleLine":29,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"Given a task block exists on the calendar","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When I click the first task block","stepMatchArguments":[]},{"pwStepLine":40,"gherkinStepLine":32,"keywordType":"Action","textWithKeyword":"And I update the task title to \"Updated Task Title\"","stepMatchArguments":[{"group":{"start":27,"value":"\"Updated Task Title\"","children":[{"start":28,"value":"Updated Task Title","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":41,"gherkinStepLine":33,"keywordType":"Action","textWithKeyword":"And I submit the task form","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"Then a calendar event with title \"Updated Task Title\" is visible","stepMatchArguments":[{"group":{"start":28,"value":"\"Updated Task Title\"","children":[{"start":29,"value":"Updated Task Title","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":45,"pickleLine":36,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":46,"gherkinStepLine":37,"keywordType":"Context","textWithKeyword":"Given a task block exists on the calendar","stepMatchArguments":[]},{"pwStepLine":47,"gherkinStepLine":38,"keywordType":"Action","textWithKeyword":"When I click the first task block","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":39,"keywordType":"Action","textWithKeyword":"And I note the task title","stepMatchArguments":[]},{"pwStepLine":49,"gherkinStepLine":40,"keywordType":"Action","textWithKeyword":"And I delete the task and confirm","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"Then the noted task is no longer on the calendar","stepMatchArguments":[]}]},
]; // bdd-data-end