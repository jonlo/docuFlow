export interface Env {
  FLOWDOCS_KV: KVNamespace;
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  CONFLUENCE_CLIENT_ID: string;
  CONFLUENCE_CLIENT_SECRET: string;
  NOTION_CLIENT_ID: string;
  NOTION_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  ENVIRONMENT: "development" | "production";
}
