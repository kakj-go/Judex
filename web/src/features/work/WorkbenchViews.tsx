import {Button} from "../../components/ui/Button";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDot,
  GitBranch,
  Leaf,
  Plus,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useWork } from "./store";
import { Btn, EmptyState, Heading, Person, Pill } from "./ui";
import {
  canAcceptTask,
  canOwnPlan,
  canWork,
  planTasks,
  sourceActions,
} from "./selectors";
import { PlanTile } from "./WorkPages";
import { CreateWorkDialog } from "./Dialogs";
import { planAction, decideDraft } from "./actions";
import { ProjectArt } from "./ProjectArt";
import { HandoffList } from "./HandoffPages";
import { TaskCard } from "./TaskCards";

export function StudioWorkbench() {
  const { state, project, text, t, go } = useWork(),
    [newPlan, setNewPlan] = useState(false);
  const plans = state.plans.filter((p) => p.projectId === project.id),
    items = sourceActions(state, project.id);
  const reviews = state.tasks.filter(
    (task) =>
      task.projectId === project.id &&
      task.status === "delivered" &&
      canAcceptTask(state, task),
  );
  const readyPlans = plans.filter(plan=>plan.status==='active'&&canOwnPlan(state,plan)&&planTasks(state,plan.id).length>0&&planTasks(state,plan.id).every(task=>task.status==='accepted'));
  const people = state.seats
    .filter((s) =>
      state.positions.some(
        (p) => p.id === s.positionId && p.projectId === project.id,
      ),
    )
    .slice(0, 4);
  return (
    <div className="judex-studio-next">
      <div className="judex-next-greeting">
        <span>
          {state.currentUser} <i>✦</i>{" "}
          {project.kind === "software"
            ? "LET'S MAKE SOMETHING GOOD"
            : "MAKE SPACE FOR THE UNEXPECTED"}
        </span>
        <span>{t("workDemo")}</span>
      </div>
      <section className="judex-next-hero">
        <div>
          <span className="judex-eyebrow">YOUR LITTLE ATELIER</span>
          <h1>{t("workGreeting")}</h1>
          <p>{t("workGreetingSub")}</p>
          <Btn onClick={() => setNewPlan(true)}>
            <Plus />
            {t("workNewPlan")}
          </Btn>
        </div>
        <div className="judex-next-hero-art">
          <div className="judex-hero-ring" />
          <span className="judex-paper-note">
            a little
            <br />
            <em>closer.</em>
            <i>✳</i>
          </span>
          <div className="judex-hero-caption">
            <Leaf />
            {t("workArtCaption")}
          </div>
        </div>
      </section>
      <div className="judex-studio-content-grid">
        <section>
          <div className="judex-work-section-title">
            <h2>{t("workPlanFocus")}</h2>
            <Button onClick={() => go({ view: "plans" })}>
              {t("workAll")}
              <ArrowUpRight />
            </Button>
          </div>
          <div className="judex-studio-plan-feature">
            <ProjectArt
              art={project.kind === "software" ? "software" : "coffee"}
            />
            {plans[0] && <PlanTile plan={plans[0]} featured />}
          </div>
          <div className="judex-work-section-title">
            <h2>
              {t("workMyToday")}
              <span>{items.length + reviews.length + readyPlans.length}</span>
            </h2>
            <Button onClick={() => go({ view: "decisions" })}>
              {t("workAll")}
              <ArrowRight />
            </Button>
          </div>
          <div className="judex-today-cards">
            {readyPlans.map(plan=><Button className="judex-today-card" key={plan.id} data-testid={'today-plan-review-'+plan.id} onClick={()=>go({view:'plan',id:plan.id})}><span className="judex-eyebrow">{t('workPlanAccept')}</span><strong>{text(plan.title)}</strong><p>{t('cardsPlanReady')}</p><ArrowUpRight/></Button>)}
            {items.map(({ handoff, source }) => (
              <Button
                key={handoff.id + source.id}
                className="judex-today-card"
                onClick={() => go({ view: "handoff", id: handoff.id })}
              >
                <Person seatId={source.senderSeatId} />
                <strong>
                  {text(state.tasks.find((t) => t.id === source.taskId)!.title)}
                </strong>
                <div>
                  <Pill status={source.status} />
                  <ArrowUpRight />
                </div>
              </Button>
            ))}
            {reviews.map((task) => (
              <Button
                className="judex-today-card"
                key={task.id}
                onClick={() => go({ view: "task", id: task.id })}
              >
                <span className="judex-eyebrow">{t("workReviewer")}</span>
                <strong>{text(task.title)}</strong>
                <div>
                  <Pill status="delivered" />
                  <ArrowUpRight />
                </div>
              </Button>
            ))}
          </div>
          {!items.length && !reviews.length && !readyPlans.length && (
            <EmptyState text={t("workNoActions")} />
          )}
        </section>
        <aside className="judex-studio-aside">
          <div className="judex-ai-note">
            <Sparkles />
            <span className="judex-eyebrow">{t("workAI")}</span>
            <p>{t("workAIObservation")}</p>
            <small>— Judex</small>
          </div>
          <div className="judex-work-section-title">
            <h3>{t("workPeople")}</h3>
            <Button
              aria-label={t("workTeam")}
              onClick={() => go({ view: "team" })}
            >
              <ArrowUpRight />
            </Button>
          </div>
          <div className="judex-people-strip">
            {people.map((p) => (
              <Button key={p.id} onClick={() => go({ view: "team" })}>
                <Person seatId={p.id} />
                <ArrowUpRight />
              </Button>
            ))}
          </div>
          <Button
            className="judex-studio-flow-note"
            onClick={() => go({ view: "flows" })}
          >
            <GitBranch />
            <strong>{t("workFlows")}</strong>
            <p>{t("workStudioHint")}</p>
            <ArrowRight />
          </Button>
        </aside>
      </div>
      {newPlan && (
        <CreateWorkDialog kind="plan" onClose={() => setNewPlan(false)} />
      )}
    </div>
  );
}
export function DecisionsPage() {
  const { state, project, t, text, act, go } = useWork();
  const reviews = state.tasks.filter(
    (task) =>
      task.projectId === project.id &&
      task.status === "delivered" &&
      canAcceptTask(state, task),
  );
  const planReviews = state.plans.filter(
    (plan) =>
      plan.projectId === project.id &&
      plan.status === "active" &&
      canOwnPlan(state, plan) &&
      planTasks(state, plan.id).length > 0 &&
      planTasks(state, plan.id).every((task) => task.status === "accepted"),
  );
  const plans = state.plans.filter(
    (p) =>
      p.projectId === project.id &&
      p.status === "draft" &&
      canOwnPlan(state, p),
  );
  const tasks = state.tasks.filter(
    (task) =>
      task.projectId === project.id &&
      task.status === "draft" &&
      (task.planId
        ? state.plans.some((p) => p.id === task.planId && canOwnPlan(state, p))
        : project.members.some(
            (m) => m.name === state.currentUser && m.role === "owner",
          )),
  );
  return (
    <>
      <Heading
        eyebrow="A HUMAN DECISION MATTERS"
        title={t("cardsAllDecisions")}
        description={t("workDraftNote")}
      />
      <section className="judex-work-section">
        <h3>{t("workHandoffs")}</h3>
        <HandoffList compact />
      </section>
      {(reviews.length > 0 || planReviews.length > 0) && (
        <section className="judex-work-section">
          <h3>{t("cardsReviewSection")}</h3>
          <div className="judex-task-card-grid">
            {reviews.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {planReviews.map((plan) => (
              <PlanTile key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}
      <div className="judex-decision-grid">
        {plans.map((p) => (
          <article className="judex-work-panel" key={p.id}>
            <span className="judex-eyebrow">{t("workPlans")}</span>
            <h2>{text(p.title)}</h2>
            <p>{text(p.goal)}</p>
            <div className="judex-task-actions">
              <Btn secondary onClick={() => go({ view: "plan", id: p.id })}>
                {t("details")}
              </Btn>
              <Btn onClick={() => act((s) => planAction(s, p.id, "activate"))}>
                {t("workActivate")}
              </Btn>
            </div>
          </article>
        ))}
        {tasks.map((task) => (
          <article className="judex-work-panel" key={task.id}>
            <h2>{text(task.title)}</h2>
            <Person seatId={task.seatIds[0]} />
            <p>{text(task.expected)}</p>
            <div className="judex-task-actions">
              <Btn secondary onClick={() => go({ view: "task", id: task.id })}>
                {t("details")}
              </Btn>
              <Btn onClick={() => act((s) => decideDraft(s, task.id))}>
                {t("workTaskDraftApprove")}
              </Btn>
            </div>
          </article>
        ))}
      </div>
      {!plans.length && !tasks.length && (
        <EmptyState text={t("workNoActions")} />
      )}
    </>
  );
}
