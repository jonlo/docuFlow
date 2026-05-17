// Generated from: features/document-attach.feature
import { test } from "../../fixtures/auth.ts";

test.describe('Document Attach', () => {

  test.beforeEach('Background', async ({ Given, And, authenticatedPage, page }, testInfo) => { if (testInfo.error) return;
    await Given('I am authenticated and on the calendar page', null, { authenticatedPage }); 
    await And('a task block exists on the calendar', null, { page }); 
  });
  
  test('Task panel shows document search when a task is open', async ({ When, Then, page }) => { 
    await When('I click the first task block', null, { page }); 
    await Then('the document search input is visible', null, { page }); 
  });

  test('Notion search returns results', async ({ When, Then, And, page }) => { 
    await When('I click the first task block', null, { page }); 
    await And('I select "notion" as the document provider', null, { page }); 
    await And('I search for documents with "test"', null, { page }); 
    await Then('document search results are visible', null, { page }); 
  });

  test('Selecting a Notion result attaches it to the task', async ({ When, Then, And, page, state }) => { 
    await When('I click the first task block', null, { page }); 
    await And('I select "notion" as the document provider', null, { page }); 
    await And('I search for documents with "test"', null, { page }); 
    await And('I click the first search result', null, { page, state }); 
    await Then('the first search result is attached to the task', null, { page, state }); 
  });

  test('Confluence search returns results', async ({ When, Then, And, page }) => { 
    await When('I click the first task block', null, { page }); 
    await And('I select "confluence" as the document provider', null, { page }); 
    await And('I search for documents with "test"', null, { page }); 
    await Then('document search results are visible', null, { page }); 
  });

  test('Selecting a Confluence result attaches it to the task', async ({ When, Then, And, page, state }) => { 
    await When('I click the first task block', null, { page }); 
    await And('I select "confluence" as the document provider', null, { page }); 
    await And('I search for documents with "test"', null, { page }); 
    await And('I click the first search result', null, { page, state }); 
    await Then('the first search result is attached to the task', null, { page, state }); 
  });

  test('Removing an attached document unlinks it from the task', async ({ When, Then, And, page, state }) => { 
    await When('I click the first task block', null, { page }); 
    await And('I select "notion" as the document provider', null, { page }); 
    await And('I search for documents with "test"', null, { page }); 
    await And('I click the first search result', null, { page, state }); 
    await And('I remove the first attached document', null, { page }); 
    await Then('no attached documents are shown', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features/document-attach.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":7,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"And a task block exists on the calendar","isBg":true,"stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When I click the first task block","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then the document search input is visible","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":11,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"And a task block exists on the calendar","isBg":true,"stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When I click the first task block","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"And I select \"notion\" as the document provider","stepMatchArguments":[{"group":{"start":9,"value":"\"notion\"","children":[{"start":10,"value":"notion","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":19,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"And I search for documents with \"test\"","stepMatchArguments":[{"group":{"start":28,"value":"\"test\"","children":[{"start":29,"value":"test","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":20,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then document search results are visible","stepMatchArguments":[]}]},
  {"pwTestLine":23,"pickleLine":17,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"And a task block exists on the calendar","isBg":true,"stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When I click the first task block","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"And I select \"notion\" as the document provider","stepMatchArguments":[{"group":{"start":9,"value":"\"notion\"","children":[{"start":10,"value":"notion","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":26,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"And I search for documents with \"test\"","stepMatchArguments":[{"group":{"start":28,"value":"\"test\"","children":[{"start":29,"value":"test","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":27,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"And I click the first search result","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"Then the first search result is attached to the task","stepMatchArguments":[]}]},
  {"pwTestLine":31,"pickleLine":24,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"And a task block exists on the calendar","isBg":true,"stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When I click the first task block","stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"And I select \"confluence\" as the document provider","stepMatchArguments":[{"group":{"start":9,"value":"\"confluence\"","children":[{"start":10,"value":"confluence","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":34,"gherkinStepLine":27,"keywordType":"Action","textWithKeyword":"And I search for documents with \"test\"","stepMatchArguments":[{"group":{"start":28,"value":"\"test\"","children":[{"start":29,"value":"test","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":35,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"Then document search results are visible","stepMatchArguments":[]}]},
  {"pwTestLine":38,"pickleLine":30,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"And a task block exists on the calendar","isBg":true,"stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When I click the first task block","stepMatchArguments":[]},{"pwStepLine":40,"gherkinStepLine":32,"keywordType":"Action","textWithKeyword":"And I select \"confluence\" as the document provider","stepMatchArguments":[{"group":{"start":9,"value":"\"confluence\"","children":[{"start":10,"value":"confluence","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":41,"gherkinStepLine":33,"keywordType":"Action","textWithKeyword":"And I search for documents with \"test\"","stepMatchArguments":[{"group":{"start":28,"value":"\"test\"","children":[{"start":29,"value":"test","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":42,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"And I click the first search result","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then the first search result is attached to the task","stepMatchArguments":[]}]},
  {"pwTestLine":46,"pickleLine":37,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am authenticated and on the calendar page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"And a task block exists on the calendar","isBg":true,"stepMatchArguments":[]},{"pwStepLine":47,"gherkinStepLine":38,"keywordType":"Action","textWithKeyword":"When I click the first task block","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":39,"keywordType":"Action","textWithKeyword":"And I select \"notion\" as the document provider","stepMatchArguments":[{"group":{"start":9,"value":"\"notion\"","children":[{"start":10,"value":"notion","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":49,"gherkinStepLine":40,"keywordType":"Action","textWithKeyword":"And I search for documents with \"test\"","stepMatchArguments":[{"group":{"start":28,"value":"\"test\"","children":[{"start":29,"value":"test","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":50,"gherkinStepLine":41,"keywordType":"Action","textWithKeyword":"And I click the first search result","stepMatchArguments":[]},{"pwStepLine":51,"gherkinStepLine":42,"keywordType":"Action","textWithKeyword":"And I remove the first attached document","stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":43,"keywordType":"Outcome","textWithKeyword":"Then no attached documents are shown","stepMatchArguments":[]}]},
]; // bdd-data-end