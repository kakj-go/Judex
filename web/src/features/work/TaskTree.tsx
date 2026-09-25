import {Button} from "../../components/ui/Button";
import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Expand,
  Minus,
  Plus,
  Scan,
  X,
} from "lucide-react";
import { useWork } from "./store";
import { Person, Pill } from "./ui";
import { TaskCard } from "./TaskCards";
import { layoutTasks, TREE } from "./taskTreeLayout";
import type { Plan, Task } from "./types";
export function TaskTree({
  plan,
  tasks,
  onOpen,
  onChild,
}: {
  plan: Plan;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onChild: (task: Task) => void;
}) {
  const { state, text, t } = useWork();
  const [collapsed, setCollapsed] = useState(new Set<string>()),
    [scale, setScale] = useState(0.85),
    [dependencies, setDependencies] = useState(true),
    [expanded, setExpanded] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const arrow = "tree-" + useId().replaceAll(":", "");
  const { positions, rootY, width, height, invalid } = layoutTasks(
    tasks,
    collapsed,
  );
  const done = tasks.filter((v) => v.status === "accepted").length;
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector('[role="dialog"]'))
        setExpanded(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const toggle = (id: string) =>
    setCollapsed((old) => {
      const next = new Set(old);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const zoom = (v: number) => setScale(Math.max(0.4, Math.min(1.4, v)));
  const fit = () => {
    const el = viewport.current;
    if (el) {
      zoom(
        Math.min(
          (el.clientWidth - 32) / width,
          (el.clientHeight - 32) / height,
          1,
        ),
      );
      el.scrollTo(0, 0);
    }
  };
  return (
    <section
      className={
        "judex-task-tree-shell" + (expanded ? " judex-task-tree-expanded" : "")
      }
      aria-label={t("cardsTree")}
    >
      <header className="judex-task-tree-toolbar">
        <div>
          <strong>{t("cardsTree")}</strong>
          <small>{t("cardsTreeHint")}</small>
        </div>
        <div className="judex-task-tree-tools">
          <label>
            <input
              type="checkbox"
              checked={dependencies}
              onChange={(e) => setDependencies(e.target.checked)}
            />
            {t("cardsDependencies")}
          </label>
          <Button onClick={() => setCollapsed(new Set())}>
            {t("cardsExpandAll")}
          </Button>
          <Button
            aria-label={t("cardsZoomOut")}
            onClick={() => zoom(scale - 0.15)}
          >
            <Minus />
          </Button>
          <span>{Math.round(scale * 100)}%</span>
          <Button
            aria-label={t("cardsZoomIn")}
            onClick={() => zoom(scale + 0.15)}
          >
            <Plus />
          </Button>
          <Button onClick={fit} title={t("cardsFit")}>
            <Scan />
            {t("cardsFit")}
          </Button>
          <Button
            aria-label={t(expanded ? "cardsCloseCanvas" : "cardsExpandCanvas")}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <X /> : <Expand />}
          </Button>
        </div>
      </header>
      <div className="judex-task-tree-legend">
        <span>
          <i />
          {t("cardsHierarchy")}
        </span>
        <span>
          <i className="judex-task-tree-dashed" />
          {t("cardsPrerequisite")}
        </span>
        <span>{t("cardsDragHint")}</span>
      </div>
      {invalid && <p className="judex-work-warning">{t("cardsInvalidTree")}</p>}
      <div
        className="judex-task-tree-viewport"
        ref={viewport}
        data-testid="task-tree-viewport"
        onPointerDown={(e) => {
          if (e.button !== 0 || (e.target as Element).closest("button,input"))
            return;
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            left: e.currentTarget.scrollLeft,
            top: e.currentTarget.scrollTop,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) {
            e.currentTarget.scrollLeft =
              drag.current.left - (e.clientX - drag.current.x);
            e.currentTarget.scrollTop =
              drag.current.top - (e.clientY - drag.current.y);
          }
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <div style={{ width: width * scale, height: height * scale }}>
          <div
            className="judex-task-tree-canvas"
            style={{ width, height, transform: `scale(${scale})` }}
          >
            <svg width={width} height={height} aria-hidden="true">
              <defs>
                <marker
                  id={arrow}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0 0 10 5 0 10z" />
                </marker>
              </defs>
              {[...positions].map(([id, p]) => {
                const a = p.parent
                  ? positions.get(p.parent)
                  : { x: TREE.padding, y: rootY };
                if (!a) return null;
                const x = a.x + TREE.cardWidth,
                  y = a.y + TREE.cardHeight / 2,
                  end = p.y + TREE.cardHeight / 2;
                return (
                  <path
                    key={"h" + id}
                    d={`M${x} ${y} C${x + 40} ${y},${p.x - 40} ${end},${p.x} ${end}`}
                  />
                );
              })}
              {dependencies &&
                tasks.flatMap((task) => {
                  const target = positions.get(task.id);
                  if (!target) return [];
                  return task.requirements.flatMap((r, ri) => {
                    const sources =
                      r.kind === "task"
                        ? [r.ref]
                        : r.kind === "receipt"
                          ? state.handoffs
                              .find((h) => h.id === r.ref)
                              ?.sources.map((s) => s.taskId) || []
                          : [];
                    return [...new Set(sources)].map((id, si) => {
                      const from = positions.get(id);
                      if (!from || id === task.id) return null;
                      const x =
                        Math.max(from.x, target.x) +
                        TREE.cardWidth +
                        30 +
                        (ri + si) * 12;
                      return (
                        <path
                          className="judex-task-tree-dependency"
                          key={task.id + r.id + id}
                          markerEnd={`url(#${arrow})`}
                          d={`M${from.x + TREE.cardWidth} ${from.y + TREE.cardHeight - 24} H${x} V${target.y + TREE.cardHeight - 24} H${target.x + TREE.cardWidth + 3}`}
                        />
                      );
                    });
                  });
                })}
            </svg>
            <div
              className="judex-task-tree-root"
              style={{
                left: TREE.padding,
                top: rootY,
                width: TREE.cardWidth,
                height: TREE.cardHeight,
              }}
            >
              <Pill status={plan.status} kind="plan" />
              <h3>{text(plan.title)}</h3>
              <Person seatId={plan.ownerSeatId} small />
              <small>{t("workPlanCount", { done, total: tasks.length })}</small>
            </div>
            {[...positions].map(([id, p]) => {
              const task = tasks.find((v) => v.id === id)!;
              const children = tasks.filter((v) => v.parentId === id);
              return (
                <div
                  className="judex-task-tree-node"
                  key={id}
                  style={{
                    left: p.x,
                    top: p.y,
                    width: TREE.cardWidth,
                    height: TREE.cardHeight,
                  }}
                >
                  <TaskCard task={task} compact onOpen={() => onOpen(task)} />
                  <div className="judex-task-tree-node-tools">
                    {children.length > 0 && (
                      <Button
                        aria-expanded={!collapsed.has(id)}
                        aria-label={t("cardsToggle", {
                          title: text(task.title),
                        })}
                        onClick={() => toggle(id)}
                      >
                        {collapsed.has(id) ? <ChevronRight /> : <ChevronDown />}
                        {children.length}
                      </Button>
                    )}
                    <Button
                      title={t("cardsAddChild")}
                      aria-label={t("cardsAddTo", { title: text(task.title) })}
                      onClick={() => onChild(task)}
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
