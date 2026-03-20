"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getTask, runTask } from "@/lib/api";
import type { Deliverable, TaskAggregate } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function buildRunMeta(task: TaskAggregate) {
  if (task.mode === "multi_agent") {
    return {
      title: "Run multi-agent flow",
      copy: "Host will orchestrate the fixed 4-agent convergence pack and save the structured result back into task history.",
      buttonIdle: "Run Multi-Agent Flow",
      buttonRunning: "Running multi-agent flow...",
    };
  }

  if (task.task_type === "contract_review") {
    return {
      title: "Run contract review",
      copy: "Host will route this task into the Contract Review Agent and save the structured review back into task history.",
      buttonIdle: "Run Contract Review",
      buttonRunning: "Running contract review...",
    };
  }

  if (task.task_type === "document_restructuring") {
    return {
      title: "Run document restructuring",
      copy: "Host will route this task into the Document Restructuring Agent and save the restructuring deliverable back into task history.",
      buttonIdle: "Run Document Restructuring",
      buttonRunning: "Running document restructuring...",
    };
  }

  return {
    title: "Run research synthesis",
    copy: "Host will route this task into the Research Synthesis Agent and save the structured synthesis back into task history.",
    buttonIdle: "Run Research Synthesis",
    buttonRunning: "Running research synthesis...",
  };
}

function renderStructuredValue(label: string, value: unknown) {
  if (Array.isArray(value)) {
    return (
      <section className="section-card" key={label}>
        <h4>{label}</h4>
        <ul className="list-content">
          {value.map((item, index) => (
            <li key={`${label}-${index}`}>
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (value && typeof value === "object") {
    return (
      <section className="section-card" key={label}>
        <h4>{label}</h4>
        <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>
      </section>
    );
  }

  return (
    <section className="section-card" key={label}>
      <h4>{label}</h4>
      <p className="content-block">{String(value ?? "")}</p>
    </section>
  );
}

export function TaskDetailPanel({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<TaskAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshTask() {
    try {
      setLoading(true);
      setError(null);
      const response = await getTask(taskId);
      setTask(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load the task.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshTask();
  }, [taskId]);

  async function handleRun() {
    try {
      setRunning(true);
      setError(null);
      await runTask(taskId);
      await refreshTask();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Failed to run the selected flow.");
    } finally {
      setRunning(false);
    }
  }

  const latestDeliverable: Deliverable | null = task?.deliverables
    ? [...task.deliverables].sort((a, b) => b.version - a.version)[0] ?? null
    : null;
  const latestMissingInformation = getStringList(
    latestDeliverable?.content_structure?.missing_information,
  );
  const runMeta = task ? buildRunMeta(task) : null;
  const sortedRecommendations = task?.recommendations
    ? [...task.recommendations].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : [];
  const sortedActionItems = task?.action_items
    ? [...task.action_items].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    : [];

  return (
    <main className="page-shell">
      <Link className="back-link" href="/">
        ← Back to workbench
      </Link>

      {loading ? <p className="status-text">Loading task workspace...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {task ? (
        <>
          <section className="hero-card">
            <span className="eyebrow">Task workspace</span>
            <h1 className="page-title">{task.title}</h1>
            <p className="page-subtitle">{task.description || "No extra description provided."}</p>
            <div className="meta-row" style={{ marginTop: "16px" }}>
              <span className="pill">{task.status}</span>
              <span>{task.task_type}</span>
              <span>{task.mode}</span>
              <span>Updated {formatDate(task.updated_at)}</span>
            </div>
          </section>

          <div className="detail-grid">
            <div className="detail-stack">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">{runMeta?.title ?? "Run task flow"}</h2>
                    <p className="panel-copy">{runMeta?.copy}</p>
                  </div>
                  <button
                    className="button-primary"
                    type="button"
                    onClick={handleRun}
                    disabled={running}
                  >
                    {running ? runMeta?.buttonRunning ?? "Running..." : runMeta?.buttonIdle}
                  </button>
                </div>
                {latestMissingInformation.length > 0 ? (
                  <p className="error-text">
                    This task currently has explicit uncertainty or missing information. Review
                    those notes before treating the output as final.
                  </p>
                ) : null}
              </section>

              <section className="panel">
                <h2 className="section-title">Latest structured deliverable</h2>
                {latestDeliverable ? (
                  <div className="section-list">
                    <div className="detail-item">
                      <h3>{latestDeliverable.title}</h3>
                      <div className="meta-row">
                        <span>Version {latestDeliverable.version}</span>
                        <span>{formatDate(latestDeliverable.generated_at)}</span>
                      </div>
                    </div>
                    {Object.entries(latestDeliverable.content_structure).map(([label, value]) =>
                      renderStructuredValue(label.replaceAll("_", " "), value),
                    )}
                  </div>
                ) : (
                  <p className="empty-text">
                    No deliverable yet. Run the selected flow to generate the first one.
                  </p>
                )}
              </section>
            </div>

            <div className="detail-stack">
              <section className="panel">
                <h2 className="section-title">Task context</h2>
                <div className="detail-list">
                  <div className="detail-item">
                    <h3>Background</h3>
                    <p className="content-block">
                      {task.contexts[0]?.summary || "No manual background text provided."}
                    </p>
                  </div>
                  <div className="detail-item">
                    <h3>Goals</h3>
                    <ul className="list-content">
                      {task.goals.map((goal) => (
                        <li key={goal.id}>{goal.description}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="detail-item">
                    <h3>Constraints</h3>
                    {task.constraints.length > 0 ? (
                      <ul className="list-content">
                        {task.constraints.map((constraint) => (
                          <li key={constraint.id}>{constraint.description}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted-text">No explicit constraints were added.</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">Evidence and uploads</h2>
                <div className="detail-list">
                  {task.evidence.map((evidence) => (
                    <div className="detail-item" key={evidence.id}>
                      <div className="meta-row">
                        <span className="pill">{evidence.evidence_type}</span>
                        <span>{evidence.source_type}</span>
                      </div>
                      <h3>{evidence.title}</h3>
                      <p className="content-block">{evidence.excerpt_or_summary}</p>
                    </div>
                  ))}
                  {task.evidence.length === 0 ? (
                    <p className="empty-text">No evidence attached yet.</p>
                  ) : null}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">Recommendations</h2>
                <div className="detail-list">
                  {sortedRecommendations.length > 0 ? (
                    sortedRecommendations.map((recommendation) => (
                      <div className="detail-item" key={recommendation.id}>
                        <div className="meta-row">
                          <span className="pill">{recommendation.priority}</span>
                          <span>{formatDate(recommendation.created_at)}</span>
                        </div>
                        <h3>{recommendation.summary}</h3>
                        <p className="content-block">{recommendation.rationale}</p>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">No recommendations recorded yet.</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">Action items</h2>
                <div className="detail-list">
                  {sortedActionItems.length > 0 ? (
                    sortedActionItems.map((actionItem) => (
                      <div className="detail-item" key={actionItem.id}>
                        <div className="meta-row">
                          <span className="pill">{actionItem.priority}</span>
                          <span>{actionItem.status}</span>
                          <span>{formatDate(actionItem.created_at)}</span>
                        </div>
                        <h3>{actionItem.description}</h3>
                        <p className="muted-text">
                          Suggested owner: {actionItem.suggested_owner || "Task owner"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">No action items recorded yet.</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">Missing information and uncertainty</h2>
                <div className="detail-list">
                  {latestMissingInformation.length > 0 ? (
                    <div className="detail-item">
                      <ul className="list-content">
                        {latestMissingInformation.map((item, index) => (
                          <li key={`${index}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="empty-text">No explicit missing-information notes on the latest deliverable.</p>
                  )}
                </div>
              </section>

              <section className="panel">
                <h2 className="section-title">Task history</h2>
                <div className="detail-list">
                  {task.runs.length > 0 ? (
                    [...task.runs]
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                      )
                      .map((run) => (
                        <div className="detail-item" key={run.id}>
                          <div className="meta-row">
                            <span className="pill">{run.status}</span>
                            <span>{run.agent_id}</span>
                            <span>{formatDate(run.created_at)}</span>
                          </div>
                          <h3>{run.summary || "Run recorded"}</h3>
                          <p className="muted-text">
                            {run.error_message || "Structured results were saved to history."}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p className="empty-text">No runs yet.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
