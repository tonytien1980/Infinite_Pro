"use client";

import { useEffect, useState } from "react";

import { createMemberInvite, listMembers, revokeMemberInvite, updateMemberRole } from "@/lib/api";
import { buildDemoMemberSummary, canRevokeInvite } from "@/lib/demo-workspace";
import type { MemberListSnapshot } from "@/lib/types";

export function MembersPagePanel() {
  const [snapshot, setSnapshot] = useState<MemberListSnapshot | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"consultant" | "demo">("consultant");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await listMembers();
        if (!cancelled) {
          setSnapshot(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "目前無法載入成員資料。");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleInvite() {
    try {
      const created = await createMemberInvite({ email, role });
      setSnapshot((current) =>
        current
          ? {
              members: current.members,
              pendingInvites: [created].concat(current.pendingInvites),
              summary: {
                activeDemoMemberCount: current.summary.activeDemoMemberCount,
                pendingDemoInviteCount:
                  current.summary.pendingDemoInviteCount + (created.role === "demo" ? 1 : 0),
              },
            }
          : current,
      );
      setEmail("");
      setFeedback(`已送出 ${created.email} 的邀請。`);
      setError(null);
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "目前無法送出邀請。");
      setFeedback(null);
    }
  }

  async function handleReapply(memberId: string, nextRole: "owner" | "consultant" | "demo", nextStatus: "active" | "disabled") {
    try {
      const updated = await updateMemberRole(memberId, {
        role: nextRole,
        status: nextStatus,
      });
      setSnapshot((current) =>
        current
          ? {
              ...current,
              members: current.members.map((member) => (member.id === updated.id ? updated : member)),
            }
          : current,
      );
      setFeedback(`已更新 ${updated.email} 的身份設定。`);
      setError(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "目前無法更新成員身份。");
      setFeedback(null);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      const revoked = await revokeMemberInvite(inviteId);
      setSnapshot((current) =>
        current
          ? {
              ...current,
              pendingInvites: current.pendingInvites.map((invite) =>
                invite.id === revoked.id ? revoked : invite,
              ),
              summary: {
                ...current.summary,
                pendingDemoInviteCount:
                  revoked.role === "demo"
                    ? Math.max(0, current.summary.pendingDemoInviteCount - 1)
                    : current.summary.pendingDemoInviteCount,
              },
            }
          : current,
      );
      setFeedback(`已撤回 ${revoked.email} 的邀請。`);
      setError(null);
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "目前無法撤回邀請。");
      setFeedback(null);
    }
  }

  const demoSummary = buildDemoMemberSummary(snapshot);

  return (
    <main className="page-shell management-page-shell">
      <section className="section-card">
        <p className="hero-focus-label">成員管理</p>
        <h1>管理 Firm 成員與邀請</h1>
        <p className="section-copy">
          只有 owner 可以在這裡管理成員身份別。consultant 與 demo 帳號都由這裡建立與維護。
        </p>
      </section>

      <section className="section-card">
        <h2>送出新邀請</h2>
        <div className="form-row">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@example.com"
            aria-label="受邀 email"
          />
          <select value={role} onChange={(event) => setRole(event.target.value as "consultant" | "demo")}>
            <option value="consultant">Consultant</option>
            <option value="demo">Demo</option>
          </select>
          <button className="button-primary" type="button" onClick={handleInvite} disabled={!email.trim()}>
            送出邀請
          </button>
        </div>
        {feedback ? <p>{feedback}</p> : null}
        {error ? (
          <p className="error-text" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="section-card">
        <h2>現有成員</h2>
        <div className="summary-grid" style={{ marginBottom: "16px" }}>
          <div className="section-card">
            <p className="muted-text">已啟用 demo</p>
            <strong>{demoSummary.activeCount}</strong>
          </div>
          <div className="section-card">
            <p className="muted-text">待接受 demo 邀請</p>
            <strong>{demoSummary.pendingCount}</strong>
          </div>
        </div>
        <ul className="detail-list">
          {(snapshot?.members ?? []).map((member) => (
            <li key={member.id}>
              <strong>{member.email}</strong>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "8px" }}>
                <span>{member.fullName || "未命名成員"}</span>
                <span>角色：{member.role}</span>
                <span>狀態：{member.status}</span>
                <button
                  type="button"
                  onClick={() => void handleReapply(member.id, member.role, member.status)}
                >
                  重新儲存
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section-card">
        <h2>待接受邀請</h2>
        <ul className="detail-list">
          {(snapshot?.pendingInvites ?? []).map((invite) => (
            <li key={invite.id}>
              <strong>{invite.email}</strong>｜{invite.role}｜{invite.status}
              {canRevokeInvite(invite.status) ? (
                <div style={{ marginTop: "8px" }}>
                  <button type="button" onClick={() => void handleRevokeInvite(invite.id)}>
                    撤回邀請
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
