import { useEffect, useRef, useState } from "react";
import { Check, GitBranch, Plus, Sparkles } from "lucide-react";
import { useWork } from "./store";
import { Btn, Dialog, Field, Heading, EmptyState } from "./ui";
import { createFlow, publishFlow } from "./actions";
import type { Flow } from "./types";
import { uid } from "./seed";
function flowCode(flow: Flow, english: boolean) {
  const label = (v: string) => v.replace(/["<>\r\n]/g, " ");
  return (
    "flowchart LR\n" +
    flow.nodes
      .map(
        (n) =>
          "  " + n.id + '["' + label(english ? n.label.en : n.label.zh) + '"]',
      )
      .join("\n") +
    "\n" +
    flow.edges.map(([a, b]) => "  " + a + " --> " + b).join("\n")
  );
}
function FlowDiagram({ flow }: { flow: Flow }) {
  const { locale, theme } = useWork(),
    ref = useRef<HTMLDivElement>(null),
    [svg, setSvg] = useState(""),
    [error, setError] = useState(false);
  const code = flowCode(flow, locale === "en");
  useEffect(() => {
    let live = true;
    import("mermaid")
      .then(async ({ default: mermaid }) => {
        if (!ref.current || !live) return;
        const style = getComputedStyle(ref.current);
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: theme === "dark" ? "dark" : "base",
          themeVariables: {
            fontFamily: "Segoe UI, Microsoft YaHei, sans-serif",
            primaryColor: style.getPropertyValue("--accent-soft").trim(),
            primaryTextColor: style.getPropertyValue("--ink").trim(),
            primaryBorderColor: style.getPropertyValue("--accent").trim(),
            lineColor: style.getPropertyValue("--muted").trim(),
          },
        });
        const result = await mermaid.render(
          "judexFlow" + uid().replaceAll("-", ""),
          code,
        );
        if (live) {
          setSvg(result.svg);
          setError(false);
        }
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [code, theme]);
  return (
    <div
      ref={ref}
      className="judex-work-flow-figure"
      data-testid="workflow-diagram"
    >
      {error ? (
        <pre>{code}</pre>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </div>
  );
}
function NewFlowDialog({ onClose }: { onClose: () => void }) {
  const { t, project, act } = useWork(),
    [name, setName] = useState(""),
    [instructions, setInstructions] = useState(""),
    [steps, setSteps] = useState("");
  return (
    <Dialog title={t("workNewFlow")} onClose={onClose} wide>
      <p className="judex-modal-description">{t("workFlowSim")}</p>
      <Field label={t("workTitle")}>
        <input
          className="judex-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label={t("workFlowInput")}>
        <textarea
          className="judex-textarea"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </Field>
      <Field label={t("workFlowSteps")}>
        <textarea
          className="judex-textarea judex-textarea-short"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
        />
      </Field>
      <div className="judex-modal-actions">
        <Btn secondary onClick={onClose}>
          {t("cancel")}
        </Btn>
        <Btn
          onClick={() => {
            if (
              act((s) =>
                createFlow(
                  s,
                  project.id,
                  name,
                  instructions,
                  steps
                    .split("\n")
                    .map((v) => v.trim())
                    .filter(Boolean),
                ),
              )
            )
              onClose();
          }}
        >
          {t("workFlowPublish")}
        </Btn>
      </div>
    </Dialog>
  );
}
export function FlowPage() {
  const { state, project, t, text, locale, management, route, go, act } =
      useWork(),
    flows = state.flows.filter((f) => f.projectId === project.id),
    flow = flows.find((f) => f.id === route.id) ?? flows[0],
    [creating, setCreating] = useState(false);
  return (
    <>
      <Heading
        eyebrow="A SHARED WAY FORWARD"
        title={t("workFlows")}
        description={t("workFlowHint")}
      >
        {management && (
          <Btn secondary onClick={() => setCreating(true)}>
            <Plus />
            {t("workNewFlow")}
          </Btn>
        )}
      </Heading>
      <div className="judex-work-segments judex-work-filter">
        {flows.map((f) => (
          <button
            key={f.id}
            aria-pressed={f.id === flow.id}
            onClick={() => go({ view: "flows", id: f.id })}
          >
            {text(f.name)}
          </button>
        ))}
      </div>
      {flow ? <div className="judex-flow-layout">
        <section className="judex-flow-main">
          <div className="judex-flow-title">
            <GitBranch />
            <h2>{text(flow.name)}</h2>
            <span>v{flow.version}</span>
          </div>
          <FlowDiagram flow={flow} />
          <p className="judex-work-small-note">{t("workFlowLabels")}</p>
          <div className="judex-flow-node-notes">
            {flow.nodes.map((node) => (
              <article key={node.id}>
                <span>{flow.nodes.indexOf(node) + 1}</span>
                <div>
                  <h3>{text(node.label)}</h3>
                  <p>
                    {state.positions
                      .filter((p) =>
                        p.bindings.some(
                          (b) => b.flowId === flow.id && b.nodeId === node.id,
                        ),
                      )
                      .map((p) => text(p.name))
                      .join(" · ") || t("workNoItems")}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <details className="judex-work-records">
            <summary>{t("workFlowMermaid")}</summary>
            <pre>{flowCode(flow, locale === "en")}</pre>
          </details>
          <section className="judex-work-callout">
            <h3>{t("workFlowCurrent")}</h3>
            <p>{text(flow.instructions)}</p>
          </section>
        </section>
        <FlowEditor
          key={flow.id + ":" + flow.version + ":" + state.currentUser}
          flow={flow}
        />
      </div> : <EmptyState text={t("workNoItems")} />}
      {creating && <NewFlowDialog onClose={() => setCreating(false)} />}
    </>
  );
}
function FlowEditor({ flow }: { flow: Flow }) {
  const { t, text, management, act } = useWork(),
    [input, setInput] = useState(""),
    [draft, setDraft] = useState(""),
    [impact, setImpact] = useState(false);
  return (
    <aside className="judex-flow-editor">
      <span className="judex-ai-mark">
        <Sparkles />
      </span>
      <h2>{t("workFlowChat")}</h2>
      <p>{t("workFlowSim")}</p>
      {management ? (
        <>
          <Field label={t("workFlowInput")}>
            <textarea
              className="judex-textarea"
              data-testid="workflow-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </Field>
          <Btn
            secondary
            disabled={!input.trim()}
            testId="prepare-flow-draft"
            onClick={() =>
              setDraft(text(flow.instructions) + "\n\n" + input.trim())
            }
          >
            <Sparkles />
            {t("workFlowDraft")}
          </Btn>
          {draft && (
            <>
              <Field label={t("workFlowCurrent")}>
                <textarea
                  className="judex-textarea"
                  data-testid="workflow-draft"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </Field>
              <label className="judex-work-checkbox">
                <input
                  type="checkbox"
                  data-testid="flow-material-change"
                  checked={impact}
                  onChange={(e) => setImpact(e.target.checked)}
                />
                <span>{t("workFlowImpact")}</span>
              </label>
              <Btn
                testId="publish-flow"
                onClick={() =>
                  act((s) =>
                    publishFlow(s, flow.id, flow.version, draft, impact),
                  )
                }
              >
                <Check />
                {t("workFlowPublish")}
              </Btn>
            </>
          )}
        </>
      ) : (
        <p className="judex-work-callout">{t("workFlowReadOnly")}</p>
      )}
      <div className="judex-flow-boundary">
        <strong>{t("workHard")}</strong>
        <p>{t("workConditionHint")}</p>
      </div>
    </aside>
  );
}
