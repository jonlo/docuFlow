// Generated from: features/calendar-view.feature
import { test } from "../../fixtures/auth.ts";

test.describe('Calendar View', () => {

  test.beforeEach('Background', async ({ Given, authenticatedPage }, testInfo) => { if (testInfo.error) return;
    await Given('I am authenticated and on the calendar page', null, { authenticatedPage }); 
  });
  
  test('Calendar component is visible after login', async ({ Then, page }) => { 
    await Then('the calendar view is visible', null, { page }); 
  });

  test('At least one event block is rendered for the current week', async ({ Then, page }) => { 
    await Then('at least one event block is visible', null, { page }); 
  });

  test('Event block displays the event title', async ({ Then, page }) => { 
    await Then('the first event block has a non-empty title', null, { page }); 
  });

  test('Clicking next-week button advances the calendar', async ({ Given, When, Then, page, state }) => { 
    await Given('I have noted the current calendar header', null, { page, state }); 
    await When('I click the next week button', null, { page }); 
    await Then('the calendar header has changed', null, { page, state }); 
  });

  test('Clicking previous-week button goes back', async ({ When, Then, And, page, state }) => { 
    await When('I click the next week button', null, { page }); 
    await And('I note the current calendar header', null, { page, state }); 
    await And('I click the previous week button', null, { page }); 
    await Then('the calendar header has changed', null, { page, state }); 
  });

  test('Clicking Today button returns to the current week', async ({ Given, When, Then, And, page, state }) => { 
    await Given('I have noted the current calendar header', null, { page, state }); 
    await When('I click the next week button', null, { page }); 
    await And('I click the today button', null, { page }); 
    await Then('the calendar header matches the noted header', null, { page, state }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features/calendar-view.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":6,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":7,"keywordType":"Outcome","textWithKeyword":"Then the calendar view is visible","stepMatchArguments":[]}]},
  {"pwTestLine":14,"pickleLine":9,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"Then at least one event block is visible","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":12,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then the first event block has a non-empty title","stepMatchArguments":[]}]},
  {"pwTestLine":22,"pickleLine":15,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given I have noted the current calendar header","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"When I click the next week button","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then the calendar header has changed","stepMatchArguments":[]}]},
  {"pwTestLine":28,"pickleLine":20,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"When I click the next week button","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"And I note the current calendar header","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"And I click the previous week button","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then the calendar header has changed","stepMatchArguments":[]}]},
  {"pwTestLine":35,"pickleLine":26,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"Given I have noted the current calendar header","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":28,"keywordType":"Action","textWithKeyword":"When I click the next week button","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":29,"keywordType":"Action","textWithKeyword":"And I click the today button","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"Then the calendar header matches the noted header","stepMatchArguments":[]}]},
]; // bdd-data-end