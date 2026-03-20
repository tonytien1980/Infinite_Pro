"use client";

import { FormEvent, useState } from "react";

import { createTask, uploadTaskFiles } from "@/lib/api";
import type { TaskAggregate, TaskCreatePayload } from "@/lib/types";

interface TaskCreateFormProps {
  onCreated: (task: TaskAggregate) => void;
}

const FLOW_OPTIONS = [
  {
    value: "research_synthesis",
    label: "Research Synthesis",
    mode: "specialist",
    taskType: "research_synthesis",
    description: "Use the Host specialist path to create a structured synthesis from notes and uploads.",
  },
  {
    value: "contract_review",
    label: "Contract Review",
    mode: "specialist",
    taskType: "contract_review",
    description: "Use the Host specialist path to spot key contractual risks, issues, and next actions.",
  },
  {
    value: "document_restructuring",
    label: "Document Restructuring",
    mode: "specialist",
    taskType: "document_restructuring",
    description: "Use the Host specialist path to propose a cleaner outline and rewrite guidance.",
  },
  {
    value: "multi_agent",
    label: "Multi-Agent Convergence",
    mode: "multi_agent",
    taskType: "complex_convergence",
    description: "Use the Host multi-agent path to run the fixed 4-agent convergence pack.",
  },
] as const;

type FlowOption = (typeof FLOW_OPTIONS)[number];

export function TaskCreateForm({ onCreated }: TaskCreateFormProps) {
  const [selectedFlow, setSelectedFlow] = useState<FlowOption["value"]>("research_synthesis");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [backgroundText, setBackgroundText] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const flow = FLOW_OPTIONS.find((item) => item.value === selectedFlow) ?? FLOW_OPTIONS[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload: TaskCreatePayload = {
      title,
      description,
      task_type: flow.taskType,
      mode: flow.mode,
      background_text: backgroundText,
      subject_name: subjectName || undefined,
      goal_description: goalDescription || undefined,
      constraints: constraints
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => ({
          description: item,
          constraint_type: "general",
          severity: "medium",
        })),
    };

    try {
      const task = await createTask(payload);
      if (files.length > 0) {
        await uploadTaskFiles(task.id, files);
      }
      setSuccess("Task created. Redirecting to the result workspace.");
      onCreated(task);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to create the task.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Create a task</h2>
          <p className="panel-copy">
            Choose one of the currently supported specialist or multi-agent flows. The
            Host orchestration layer remains the single runtime entry point.
          </p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="task-flow">Workflow</label>
          <select
            id="task-flow"
            value={selectedFlow}
            onChange={(event) => setSelectedFlow(event.target.value as FlowOption["value"])}
          >
            {FLOW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small>{flow.description}</small>
        </div>

        <div className="field">
          <label htmlFor="task-title">Task title</label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Internal convergence draft for proposal strategy"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="task-description">Task description</label>
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the task request, scope, and desired output."
          />
        </div>

        <div className="field">
          <label htmlFor="background-text">Manual background text</label>
          <textarea
            id="background-text"
            value={backgroundText}
            onChange={(event) => setBackgroundText(event.target.value)}
            placeholder="Paste notes, client context, or a working brief."
          />
          <small>This becomes TaskContext and is also stored as background Evidence.</small>
        </div>

        <div className="field">
          <label htmlFor="subject-name">Subject (optional)</label>
          <input
            id="subject-name"
            value={subjectName}
            onChange={(event) => setSubjectName(event.target.value)}
            placeholder="Client, market, document, or proposal name"
          />
        </div>

        <div className="field">
          <label htmlFor="goal-description">Goal (optional)</label>
          <textarea
            id="goal-description"
            value={goalDescription}
            onChange={(event) => setGoalDescription(event.target.value)}
            placeholder="Example: identify the biggest contract risks or converge the strongest evidence into an internal recommendation"
          />
        </div>

        <div className="field">
          <label htmlFor="constraints">Constraints (one per line, optional)</label>
          <textarea
            id="constraints"
            value={constraints}
            onChange={(event) => setConstraints(event.target.value)}
            placeholder={"Example:\nNeed a same-day internal draft\nKeep recommendations non-client-facing"}
          />
        </div>

        <div className="field">
          <label htmlFor="files">Upload files</label>
          <input
            id="files"
            type="file"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
          <small>Supported extraction: TXT, MD, CSV, JSON, PDF, DOCX.</small>
        </div>

        <div className="button-row">
          <button className="button-primary" type="submit" disabled={submitting}>
            {submitting ? "Creating task..." : "Create task"}
          </button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
        {success ? <p className="success-text">{success}</p> : null}
      </form>
    </section>
  );
}
