"use client";

import { FormEvent, useState } from "react";

import { createTask, uploadTaskFiles } from "@/lib/api";
import type { TaskAggregate, TaskCreatePayload } from "@/lib/types";

interface TaskCreateFormProps {
  onCreated: (task: TaskAggregate) => void;
}

export function TaskCreateForm({ onCreated }: TaskCreateFormProps) {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload: TaskCreatePayload = {
      title,
      description,
      task_type: "research_synthesis",
      mode: "specialist",
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
          <h2 className="panel-title">Create a Research Synthesis task</h2>
          <p className="panel-copy">
            This MVP starts with one specialist flow only. The Host orchestration layer
            will route this task to the Research Synthesis Agent.
          </p>
        </div>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="task-title">Task title</label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Synthesize competitor research for a proposal kick-off"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="task-description">Task description</label>
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the synthesis request and desired outcome."
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
            placeholder="Example: distill the strongest findings into a proposal-ready synthesis"
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
