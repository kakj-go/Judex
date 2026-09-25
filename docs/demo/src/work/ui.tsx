import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, ArrowUpRight, Paperclip, FileText, Check } from "lucide-react";
import { useWork } from "./store";
import type { Evidence, Task, Source, Plan } from "./types";
import { uid } from "./seed";
export function Btn({
  children,
  onClick,
  secondary = false,
  disabled = false,
  testId,
  danger = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  testId?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={
        "judex-button judex-button-" +
        (danger ? "danger" : secondary ? "secondary" : "primary")
      }
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
    </button>
  );
}
export function Dialog({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const { t } = useWork(),
    ref = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLElement>("input,textarea,button")?.focus();
    const key = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if (dialogs[dialogs.length-1] !== ref.current) return;
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;
      const elements = ref.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled),input:not(:disabled),textarea,select,a[href]",
      );
      if (!elements?.length) return;
      if (event.shiftKey && document.activeElement === elements[0]) {
        event.preventDefault();
        elements[elements.length - 1].focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === elements[elements.length - 1]
      ) {
        event.preventDefault();
        elements[0].focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="judex-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={"judex-modal" + (wide ? " judex-modal-wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="judex-modal-header">
          <h2>{title}</h2>
          <button
            className="judex-icon-button"
            aria-label={t("close")}
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Person({
  seatId,
  name,
  small = false,
}: {
  seatId?: string;
  name?: string;
  small?: boolean;
}) {
  const { state, text } = useWork(),
    seat = state.seats.find((s) => s.id === seatId),
    pos = state.positions.find((p) => p.id === seat?.positionId),
    person = name ?? seat?.person ?? "Judex";
  return (
    <span
      className={
        "judex-work-person" + (small ? " judex-work-person-small" : "")
      }
    >
      <span className={"judex-initial judex-tone-" + (pos?.tone ?? "mint")}>
        {person.slice(0, 1)}
      </span>
      <span>
        <strong>{person}</strong>
        {!small && pos && <small>{text(pos.name)}</small>}
      </span>
    </span>
  );
}
export function Pill({
  status,
  kind = "task",
}: {
  status: Task["status"] | Source["status"] | Plan["status"] | "blocked";
  kind?: "task" | "source" | "plan";
}) {
  const { t } = useWork();
  return (
    <span className={"judex-work-pill judex-work-pill-" + status}>
      {status === "accepted"
        ? t(
            kind === "task"
              ? "workTaskAccepted"
              : kind === "plan"
                ? "workPlanCompleted"
                : "workSourceReceived",
          )
        : t(
            ("workStatus" +
              status[0].toUpperCase() +
              status.slice(1)) as Parameters<typeof t>[0],
          )}
    </span>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="judex-work-heading-row">
      <div>
        {eyebrow && <span className="judex-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="judex-work-heading-actions">{children}</div>}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="judex-field-label">
      {label}
      {children}
    </label>
  );
}
export function EmptyState({
  text,
  children,
}: {
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="judex-work-empty">
      <Check />
      <p>{text}</p>
      {children}
    </div>
  );
}
export function TaskRow({
  task,
  nested = false,
}: {
  task: Task;
  nested?: boolean;
}) {
  const { go, text, t, state } = useWork(),
    plan = state.plans.find((p) => p.id === task.planId);
  return (
    <button
      data-testid={"work-task-" + task.id}
      className={
        "judex-work-task-row" + (nested ? " judex-work-task-nested" : "")
      }
      onClick={() => go({ view: "task", id: task.id })}
    >
      <span
        className={
          "judex-task-check " +
          (task.status === "accepted" ? "judex-task-check-done" : "")
        }
      >
        {task.status === "accepted" && <Check />}
      </span>
      <span className="judex-work-task-name">
        <strong>{text(task.title)}</strong>
        <small>{plan ? text(plan.title) : t("workDirect")}</small>
      </span>
      <Pill status={task.status} />
      <Person seatId={task.seatIds[0]} small />
      <ArrowUpRight />
    </button>
  );
}
export function EvidenceList({ files }: { files: Evidence[] }) {
  const [selected, setSelected] = useState<Evidence | null>(null),
    { t } = useWork();
  return (
    <>
      <div className="judex-work-files">
        {files.map((file) => (
          <button key={file.id} onClick={() => setSelected(file)}>
            <FileText />
            <span>
              {file.name}
              <small>{file.author}</small>
            </span>
            <ArrowUpRight />
          </button>
        ))}
      </div>
      {selected && (
        <Dialog title={selected.name} onClose={() => setSelected(null)} wide>
          <p className="judex-muted">
            {selected.author} · {new Date(selected.at).toLocaleString()}
          </p>
          {selected.type?.startsWith("image/") && selected.data ? (
            <img
              className="judex-work-evidence-image"
              src={selected.data}
              alt={selected.name}
            />
          ) : (
            <pre className="judex-work-report">
              {selected.text || t("workBinary")}
            </pre>
          )}
          {selected.data && (
            <a
              className="judex-work-download"
              href={selected.data}
              download={selected.name}
            >
              {t("workDownload")}
            </a>
          )}
        </Dialog>
      )}
    </>
  );
}
export function Upload({
  files,
  onChange,
}: {
  files: Evidence[];
  onChange: (files: Evidence[]) => void;
}) {
  const { state, t, setToast } = useWork();
  return (
    <div className="judex-work-upload">
      <label>
        <Paperclip />
        {t("workAttach")}
        <input
          type="file"
          multiple
          data-testid="work-files"
          onChange={async (e) => {
            const values = Array.from(e.target.files ?? []),
              incoming: Evidence[] = [];
            for (const file of values) {
              if (file.size > 1024 * 1024) {
                setToast(t("workFileLarge"));
                continue;
              }
              const textual =
                file.type.startsWith("text/") ||
                /\.(md|txt|json|csv|log)$/i.test(file.name);
              const data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
              incoming.push({
                id: uid(),
                name: file.name,
                text: textual ? await file.text() : "",
                data,
                type: file.type,
                author: state.currentUser,
                at: Date.now(),
              });
            }
            onChange([...files, ...incoming]);
            e.target.value = "";
          }}
        />
      </label>
      {files.map((f) => (
        <span key={f.id}>
          {f.name}
          <button
            aria-label={t("workRemove")}
            onClick={() => onChange(files.filter((v) => v.id !== f.id))}
          >
            <X />
          </button>
        </span>
      ))}
    </div>
  );
}
