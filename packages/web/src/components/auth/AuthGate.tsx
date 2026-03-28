import type { ReactNode } from "react";

interface Props { children: ReactNode; }

export function AuthGate({ children }: Props): JSX.Element {
  // TODO: fetch /api/auth/status, update appStore integrations, show connect screen if nothing connected
  return <>{children}</>;
}
