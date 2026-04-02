## Design Context

### Users
Infinite Pro serves a single consultant handling high-stakes advisory work across intake, case framing, evidence review, decision convergence, and deliverable shaping. Users often work in long, cognitively heavy sessions and need the interface to reduce context switching, preserve orientation, and keep source-to-evidence-to-deliverable relationships visible. The default working language is Traditional Chinese. The product must support both sparse inquiry starts and complex multi-source matters without changing the core mental model.

### Brand Personality
Infinite Pro should feel professional, trusted, and stable.

Voice and tone:
- Calm, precise, deliberate
- Competent without showing off
- Structured, serious, and reassuring during high-stakes work
- More like an advisory operating system than an AI toy

Emotional goals:
- Help the user feel oriented, in control, and safe to proceed
- Increase confidence through clarity, not spectacle
- Make the product feel dependable enough for repeated client-facing use

Anti-personality:
- Playful
- Trend-chasing
- Consumer-social
- Chatbot-first
- Chaotic
- Overly magical or hype-driven

### Aesthetic Direction
Infinite Pro should lean toward a Western professional consultant software feel: editorial enterprise workbench, not generic SaaS dashboard and not AI-chat chrome.

Visual direction:
- Light mode and dark mode are both first-class product modes
- Define hierarchy, readability, and spacing in light mode first, then map them faithfully into dark mode rather than treating dark mode as a color inversion
- Prefer restrained structural grids, stable spacing, and deliberate whitespace over busy dashboard density
- Use high-legibility Traditional Chinese typography:
  - Headings: `Noto Serif TC`
  - Body and UI: `Noto Sans TC`
- Keep the palette trustworthy and durable:
  - Deep navy/slate neutrals for structure
  - Disciplined blue as the main accent
  - Warm orange only for decisive CTA, escalation, or important next-step emphasis
  - Semantic colors must remain explicit and accessible in both themes

Interaction direction:
- One primary action per page
- First screen answers: where am I, what matters most, what should I do next
- Section navigators, disclosure panels, and workspace jumps should guide reading order
- Motion should be subtle, meaningful, and removable via `prefers-reduced-motion`
- Evidence, limitations, and system state should be visible without turning the product into a debug console

Reference cues to borrow, not copy:
- `Linear`: disciplined chrome, compact hierarchy, strong light/dark parity
- `Stripe Dashboard`: trustworthy data density, clear operational states, shortcut-friendly feel
- `Attio`: object-aware modeling and relational workspace feel
- `Vanta`: evidence, gap, and governance framing with a professional trust posture

Anti-references:
- AI-purple gradients
- Floating chatbot shells
- Consumer startup whimsy
- Metrics-first dashboards that bury the actual work
- Glass-heavy neon dark interfaces
- Admin-console clutter pretending to be a workbench

### Design Principles
1. Consultant-first, not chat-first.
The UI should always feel like a consulting workbench organized around matters, evidence, decisions, and deliverables.

2. Clarity before decoration.
Visual polish is only valuable when it strengthens orientation, trust, and reading order.

3. One page, one primary action.
Every first screen must clearly communicate the next best action without competing calls to action.

4. Evidence-backed confidence.
Recommendations, risks, limitations, and sufficiency should remain legible enough to support decisions without overwhelming the main reading path.

5. Progressive disclosure over summary duplication.
Do not repeat the same summary in hero, rail, and body. Use section guides, disclosure, and dedicated workspaces instead.

6. Stable trust posture.
Prefer restrained, high-contrast, durable UI patterns over trend-driven aesthetics. The product should look dependable in both light and dark mode.

7. Accessibility is part of product quality.
Keyboard navigation, visible focus states, announced errors, semantic landmarks, non-color status signaling, and reduced-motion support are required, not optional polish.

8. Documentation and code must stay aligned.
When UI behavior, terminology, hierarchy, or state semantics change, the governing docs and implementation should be updated together. `.impeccable.md`, `AGENTS.md`, and the formal docs should stay consistent with shipped behavior.
