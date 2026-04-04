"use client";

import { useEffect, useState } from "react";

import {
  ADOPTION_FEEDBACK_OPTIONS,
  buildAdoptionFeedbackView,
  getAdoptionFeedbackReasonOptions,
  type AdoptionFeedbackSurface,
} from "@/lib/adoption-feedback";
import type { AdoptionFeedback, AdoptionFeedbackPayload } from "@/lib/types";

export function AdoptionFeedbackControls({
  surface,
  feedback,
  description,
  instanceId,
  isSubmitting,
  message,
  onApply,
}: {
  surface: AdoptionFeedbackSurface;
  feedback: AdoptionFeedback | null | undefined;
  description: string;
  instanceId: string;
  isSubmitting: boolean;
  message: string | null;
  onApply: (payload: AdoptionFeedbackPayload) => Promise<void> | void;
}) {
  const feedbackView = buildAdoptionFeedbackView(feedback, surface);
  const currentStatus = feedbackView.currentStatus;
  const reasonOptions = getAdoptionFeedbackReasonOptions(surface, currentStatus);
  const [draftNote, setDraftNote] = useState(feedbackView.currentNote);

  useEffect(() => {
    setDraftNote(feedbackView.currentNote);
  }, [feedbackView.currentNote, feedback?.id, currentStatus]);

  return (
    <>
      <p className="content-block">{feedbackView.currentLabel}</p>
      <p className="muted-text">{description}</p>
      {feedbackView.currentAttributionSummary ? (
        <p className="muted-text">{feedbackView.currentAttributionSummary}</p>
      ) : null}
      {feedbackView.currentReasonSummary ? (
        <p className="muted-text">主要原因：{feedbackView.currentReasonSummary}</p>
      ) : null}
      {feedbackView.currentNote ? (
        <p className="muted-text">補充：{feedbackView.currentNote}</p>
      ) : null}
      <div className="button-row" style={{ marginTop: "10px" }}>
        {ADOPTION_FEEDBACK_OPTIONS.map((option) => (
          <button
            key={`${instanceId}-feedback-${option.value}`}
            className={
              feedbackView.currentStatus === option.value ? "button-primary" : "button-secondary"
            }
            type="button"
            disabled={isSubmitting}
            onClick={() => void onApply({ feedback_status: option.value })}
          >
            {isSubmitting && feedbackView.currentStatus !== option.value ? "儲存中..." : option.label}
          </button>
        ))}
      </div>
      {feedbackView.shouldShowReasonStage && currentStatus ? (
        <div className="section-card" style={{ marginTop: "12px" }}>
          <h4>{feedbackView.reasonPrompt}</h4>
          <p className="muted-text">這一步是選填，但能讓系統更知道這次為什麼可用或不可用。</p>
          <div className="button-row" style={{ marginTop: "10px" }}>
            {reasonOptions.map((option) => {
              const selected = feedbackView.currentReasonCodes.includes(option.value);
              return (
                <button
                  key={`${instanceId}-reason-${option.value}`}
                  className={selected ? "button-primary" : "button-secondary"}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    void onApply({
                      feedback_status: currentStatus,
                      reason_codes: selected ? [] : [option.value],
                    })
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <details className="inline-disclosure" style={{ marginTop: "10px" }}>
            <summary className="inline-disclosure-summary">補一句</summary>
            <div className="field field-wide field-editor field-editor-note" style={{ marginTop: "10px" }}>
              <label htmlFor={`${instanceId}-feedback-note`}>補充說明</label>
              <textarea
                id={`${instanceId}-feedback-note`}
                rows={3}
                value={draftNote}
                onChange={(event) => setDraftNote(event.target.value)}
                placeholder="只有在你想多補一句背景時再寫。"
              />
            </div>
            <div className="button-row" style={{ marginTop: "10px" }}>
              <button
                className="button-secondary"
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  void onApply({
                    feedback_status: currentStatus,
                    reason_codes: feedbackView.currentReasonCodes,
                    note: draftNote,
                  })
                }
              >
                {isSubmitting ? "儲存中..." : "儲存補充"}
              </button>
            </div>
          </details>
        </div>
      ) : null}
      {message ? (
        <p className="success-text" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </>
  );
}
