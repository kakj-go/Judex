import {Button} from "../../components/ui/Button";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  FolderOpen,
  GitBranch,
  Inbox,
  LayoutGrid,
  Leaf,
  ListChecks,
  Mail,
  MessageCircle,
  Moon,
  Settings2,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useWork, WorkProvider } from "./store";
import { Heading, EmptyState } from "./ui";
import { StudioWorkbench, DecisionsPage } from "./WorkbenchViews";
import { PlansPage, PlanPage, TasksPage, TaskPage } from "./WorkPages";
import { HandoffList, HandoffPage } from "./HandoffPages";
import { TopicsPage, TopicPage } from "./TopicsPage";
import { TeamPage, PreferencesPage, InvitePage } from "./TeamPages";
import { FlowPage } from "./FlowPage";
import { member, sourceActions } from "./selectors";
import type { View } from "./types";
import { useState } from "react";
import { ProjectDialog, ResourcesPage } from "./ProjectPages";
import { Btn } from "./ui";
const nav = [
  { view: "home", key: "workHome", icon: LayoutGrid },
  { view: "plans", key: "workPlans", icon: FolderOpen },
  { view: "tasks", key: "workTasks", icon: ListChecks },
  { view: "handoffs", key: "workHandoffs", icon: Inbox },
  { view: "decisions", key: "workDecisions", icon: Check },
  { view: "topics", key: "workTopics", icon: MessageCircle },
  { view: "team", key: "workTeam", icon: Users },
  { view: "flows", key: "workFlows", icon: GitBranch },
  { view: "resources", key: "workEvidence", icon: FolderOpen },
  { view: "settings", key: "workSettings", icon: Settings2 },
] as const;
function Content() {
  const { state, project, route, membership, t } = useWork();
  if (!membership) return <InvitePage />;
  if (route.view === "home") return <StudioWorkbench />;
  if (route.view === "resources") return <ResourcesPage />;
  if (route.view === "plans") return <PlansPage />;
  if (route.view === "tasks") return <TasksPage />;
  if (route.view === "handoffs") return <HandoffList />;
  if (route.view === "topics") return <TopicsPage />;
  if (route.view === "team") return <TeamPage />;
  if (route.view === "settings")
    return <PreferencesPage key={project.id + state.currentUser} />;
  if (route.view === "flows") return <FlowPage />;
  if (route.view === "decisions") return <DecisionsPage />;
  const item =
    route.view === "plan"
      ? state.plans.find((p) => p.id === route.id && p.projectId === project.id)
      : undefined;
  if (item) return <PlanPage key={item.id} plan={item} />;
  const task =
    route.view === "task"
      ? state.tasks.find((p) => p.id === route.id && p.projectId === project.id)
      : undefined;
  if (task) return <TaskPage key={task.id} task={task} />;
  const handoff =
    route.view === "handoff"
      ? state.handoffs.find(
          (p) => p.id === route.id && p.projectId === project.id,
        )
      : undefined;
  if (handoff) return <HandoffPage key={handoff.id} handoff={handoff} />;
  const topic =
    route.view === "topic"
      ? state.topics.find(
          (p) => p.id === route.id && p.projectId === project.id,
        )
      : undefined;
  return topic ? (
    <TopicPage key={topic.id} topic={topic} />
  ) : (
    <EmptyState text={t("workNoItems")} />
  );
}
export function Workbench() {
  const {
    state,
    project,
    route,
    go,
    text,
    t,
    locale,
    setLocale,
    theme,
    setTheme,
    people,
    switchPerson,
    toast,
    setToast,
    storageError,
    membership,
  } = useWork();
  const [creatingProject, setCreatingProject] = useState(false);
  const count = membership ? sourceActions(state, project.id).length : 0;
  const currentView: View =
    route.view === "plan"
      ? "plans"
      : route.view === "task"
        ? "tasks"
        : route.view === "handoff"
          ? "handoffs"
          : route.view === "topic"
            ? "topics"
            : route.view;
  return (
    <div
      className="judex-app judex-next-app"
      data-design={route.design}
      data-theme={theme}
      data-locale={locale}
    >
      <header className="judex-design-bar">
        <a className="judex-next-wordmark" href="/">
          <span>j.</span> judex
        </a>
        <div className="judex-studio-title">
          <Leaf /> {t("workStudio")} <small>2.0</small>
        </div>
        <div className="judex-next-controls">
          <Button
            aria-label={t("language")}
            data-testid="next-language"
            onClick={() => setLocale(locale === "en" ? "zh-CN" : "en")}
          >
            {locale === "en" ? "中文" : "EN"}
          </Button>
          <Button
            aria-label={t("theme")}
            data-testid="next-theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>
      <div className="judex-next-shell">
        <aside className="judex-next-sidebar">
          <div className="judex-project-select">
            <span className="judex-project-icon">
              {project.kind === "software" ? <Leaf /> : <Sparkles />}
            </span>
            <label>
              <small>{t("workSwitchProject")}</small>
              <select
                aria-label={t("workSwitchProject")}
                value={project.id}
                onChange={(e) =>
                  go({ projectId: e.target.value, view: "home", id: undefined })
                }
              >
                {state.projects
                  .filter(
                    (p) =>
                      member(state, p.id) ||
                      state.invites.some(
                        (i) =>
                          i.projectId === p.id &&
                          i.person === state.currentUser,
                      ),
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {text(p.title)}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <nav className="judex-next-nav">
            {membership &&
              nav.map(({ view, key, icon: Icon }) => (
                <Button
                  key={view}
                  data-testid={"work-nav-" + view}
                  className={
                    currentView === view ? "judex-next-nav-active" : ""
                  }
                  onClick={() => go({ view, id: undefined })}
                >
                  <Icon />
                  <span>{t(key)}</span>
                  {view === "handoffs" && count > 0 && <b>{count}</b>}
                </Button>
              ))}
          </nav>
          <div className="judex-sidebar-project-note">
            <span className="judex-side-flower">✳</span>
            <p>{t("workStudioHint")}</p>
          </div>
          <div className="judex-identity-switch">
            <label htmlFor="work-person">{t("workSwitchPerson")}</label>
            <div>
              <span className="judex-initial judex-tone-mint">
                {state.currentUser.slice(0, 1)}
              </span>
              <select
                id="work-person"
                data-testid="work-person"
                value={state.currentUser}
                onChange={(e) => switchPerson(e.target.value)}
              >
                {people.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </div>
            <small>
              {t(
                membership?.role === "owner"
                  ? "workOwnerRole"
                  : membership?.role === "manager"
                    ? "workManagerRole"
                    : membership
                      ? "workMemberRole"
                      : "roleInvited",
              )}
            </small>
          </div>
          <Btn secondary onClick={() => setCreatingProject(true)}>
            {t("projectNewProject")}
          </Btn>
        </aside>
        <main className="judex-next-main" key={project.id}>
          {storageError && (
            <p className="judex-work-warning" role="alert">
              {t("storageError")}
            </p>
          )}
          <Content />
          <footer className="judex-next-footer">
            <span>{t("workDemo")}</span>
            <span>{t("workSimulated")}</span>
          </footer>
        </main>
      </div>
      {creatingProject && (
        <ProjectDialog onClose={() => setCreatingProject(false)} />
      )}
      {toast && (
        <div className="judex-toast" role="status">
          <Check />
          <span>{toast}</span>
          <Button aria-label={t("close")} onClick={() => setToast("")}>
            <X />
          </Button>
        </div>
      )}
    </div>
  );
}
export default function WorkApp() {
  return (
    <WorkProvider>
      <Workbench />
    </WorkProvider>
  );
}
