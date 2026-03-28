interface Props { taskId: string; }

export function TaskPanel({ taskId }: Props): JSX.Element {
  // TODO: fetch task by ID, show form with status/priority/labels/documents
  return <div style={{ padding: 24, color: "#a1a1aa" }}>Task {taskId}</div>;
}
