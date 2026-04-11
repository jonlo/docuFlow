## ADDED Requirements

### Requirement: Document editor page
The system SHALL provide a `DocumentEditorPage` full-page overlay that renders when `documentPage` state is set in the app store. The page MUST display the document title in a header, a BlockNote editor loaded with the document's block content, an "Open in Notion" button that opens the Notion URL in a new tab, a "Sync to Notion" button that pushes the current editor state back to Notion, and a Back button that clears `documentPage` and returns to the previous view.

#### Scenario: Opening a document
- **WHEN** the user clicks a document link anywhere in the app
- **THEN** `documentPage` is set with the document's `id`, `title`, and `url`, and the `DocumentEditorPage` overlay renders over the current view

#### Scenario: Back navigation
- **WHEN** the user clicks the Back button
- **THEN** `documentPage` is cleared and the previous view is visible again

#### Scenario: Open in Notion
- **WHEN** the user clicks "Open in Notion"
- **THEN** the document's Notion URL opens in a new browser tab and the editor remains open

### Requirement: Load document content into editor
The `DocumentEditorPage` SHALL call `GET /api/notion/documents/:providerDocId` on mount and populate the BlockNote editor with the returned blocks. While loading, a skeleton or spinner MUST be shown. If the fetch fails, an error message MUST be shown with a Retry button.

#### Scenario: Successful load
- **WHEN** the page mounts and the API returns blocks
- **THEN** the BlockNote editor renders the document content as editable blocks

#### Scenario: Loading state
- **WHEN** the API request is in-flight
- **THEN** a loading indicator is shown and the editor is not yet interactive

#### Scenario: Load failure
- **WHEN** the API returns an error
- **THEN** an error message is shown with a Retry button; the editor is not rendered

#### Scenario: Unsupported blocks warning
- **WHEN** the API response includes a `hasUnsupportedBlocks: true` flag
- **THEN** a banner is shown informing the user that some blocks could not be rendered and suggesting to open in Notion for full fidelity

### Requirement: Sync document to Notion
The `DocumentEditorPage` SHALL provide a "Sync to Notion" button. Clicking it MUST call `PUT /api/notion/documents/:providerDocId` with the current BlockNote editor content serialised as blocks. During the request the button MUST be disabled and show a loading state. On success a brief success toast or indicator MUST be shown. On failure an error message MUST be shown.

#### Scenario: Successful sync
- **WHEN** the user clicks "Sync to Notion" and the API call succeeds
- **THEN** the button returns to its default state and a success indicator is briefly shown

#### Scenario: Sync in progress
- **WHEN** the sync request is in-flight
- **THEN** the button is disabled and shows a loading spinner or "Saving…" label

#### Scenario: Sync failure
- **WHEN** the API returns an error during sync
- **THEN** an inline error message is shown near the button; the editor content is preserved

### Requirement: Document page navigation state
The app store SHALL have a `documentPage` field of type `{ id: string; title: string; url: string } | null`. Setting it MUST cause `App.tsx` to render `DocumentEditorPage` as a full-page overlay. Clearing it MUST remove the overlay and restore the underlying view.

#### Scenario: documentPage set
- **WHEN** `openDocumentPage` is called with a document
- **THEN** `documentPage` is non-null and `DocumentEditorPage` is rendered

#### Scenario: documentPage cleared
- **WHEN** `closeDocumentPage` is called
- **THEN** `documentPage` is null and `DocumentEditorPage` is unmounted
