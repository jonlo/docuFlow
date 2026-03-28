import type { IntegrationProvider } from "@flowdocs/shared";

interface Props { provider: IntegrationProvider; }

export function IntegrationBadge({ provider }: Props): JSX.Element {
  // TODO: show connection status + connect/disconnect button
  return <div>{provider}</div>;
}
