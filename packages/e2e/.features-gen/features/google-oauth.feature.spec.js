// Generated from: features/google-oauth.feature
import { test } from "../../fixtures/auth.ts";

test.describe('Google OAuth', () => {

  test('Shows sign-in button when unauthenticated', async ({ Given, When, Then, page }) => { 
    await Given('Google Calendar is disconnected', null, { page }); 
    await When('I visit the home page', null, { page }); 
    await Then('the connect Google Calendar button is visible', null, { page }); 
  });

  test('Clicking sign-in opens OAuth popup', async ({ Given, When, Then, page }) => { 
    await Given('Google Calendar is disconnected', null, { page }); 
    await When('I visit the home page', null, { page }); 
    await Then('clicking the connect button opens a Google accounts popup', null, { page }); 
  });

  test('Completing OAuth shows calendar view and hides sign-in button', async ({ Given, When, Then, And, page }) => { 
    await Given('Google Calendar is connected', null, { page }); 
    await When('I visit the home page', null, { page }); 
    await Then('the calendar view is visible', null, { page }); 
    await And('the connect Google Calendar button is not visible', null, { page }); 
  });

  test('Page reload preserves authenticated state', async ({ Given, When, Then, And, page }) => { 
    await Given('Google Calendar is connected', null, { page }); 
    await When('I visit the home page', null, { page }); 
    await And('I reload the page', null, { page }); 
    await Then('the calendar view is visible', null, { page }); 
    await And('the connect Google Calendar button is not visible', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features/google-oauth.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":3,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given Google Calendar is disconnected","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":5,"keywordType":"Action","textWithKeyword":"When I visit the home page","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":6,"keywordType":"Outcome","textWithKeyword":"Then the connect Google Calendar button is visible","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":8,"tags":[],"steps":[{"pwStepLine":13,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"Given Google Calendar is disconnected","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When I visit the home page","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then clicking the connect button opens a Google accounts popup","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":13,"tags":[],"steps":[{"pwStepLine":19,"gherkinStepLine":14,"keywordType":"Context","textWithKeyword":"Given Google Calendar is connected","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"When I visit the home page","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then the calendar view is visible","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"And the connect Google Calendar button is not visible","stepMatchArguments":[]}]},
  {"pwTestLine":25,"pickleLine":19,"tags":[],"steps":[{"pwStepLine":26,"gherkinStepLine":20,"keywordType":"Context","textWithKeyword":"Given Google Calendar is connected","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"When I visit the home page","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"And I reload the page","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then the calendar view is visible","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"And the connect Google Calendar button is not visible","stepMatchArguments":[]}]},
]; // bdd-data-end