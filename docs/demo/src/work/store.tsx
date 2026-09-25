import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { seedWork, WORK_KEY } from "./seed";
import { normalizeWork } from "./normalize";
import type { Design, Route, View, Text, WorkState, Result } from "./types";
import { allPeople, manage, member } from "./selectors";
import { translate, type Key, type Locale } from "../i18n";
const views: View[] = [
  "home",
  "plans",
  "plan",
  "tasks",
  "task",
  "handoffs",
  "handoff",
  "topics",
  "topic",
  "team",
  "flows",
  "decisions",
  "settings",
  "resources",
];
function readRoute(): Route {
  const q = new URLSearchParams(location.search),
    design = q.get("design"),
    view = q.get("view");
  return {
    design: "studio",
    view: views.includes(view as View) ? (view as View) : "home",
    projectId: q.get("project") ?? "leaf",
    id: q.get("item") ?? undefined,
  };
}
function loadState(): WorkState {
  try {
    const state = normalizeWork(
      JSON.parse(localStorage.getItem(WORK_KEY) ?? "null"),
    );
    if (state) return state;
  } catch {
    /* A broken sample can always be reset. */
  }
  return seedWork();
}
function useWorkbench() {
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("design") !== "studio" || location.pathname !== "/") {
      q.set("design", "studio");
      history.replaceState(null, "", "/?" + q);
    }
  }, []);
  const [state, setState] = useState(loadState),
    ref = useRef(state);
  ref.current = state;
  const [route, setRoute] = useState(readRoute),
    [locale, setLocale] = useState<Locale>(() =>
      localStorage.getItem("argus.locale") === "en" ? "en" : "zh-CN",
    );
  const [theme, setTheme] = useState(
      () => localStorage.getItem("judex.toc.theme") ?? "light",
    ),
    [toast, setToast] = useState(""),
    [storageError, setStorageError] = useState(false);
  const t = (key: Key, values?: Record<string, string | number>) =>
    translate(locale, key, values);
  const text = (value: Text | string) =>
    typeof value === "string" ? value : locale === "en" ? value.en : value.zh;
  useEffect(() => {
    document.title = t("workStudio") + " 2.0 · Judex";
  }, [locale]);
  useEffect(() => {
    try {
      localStorage.setItem(WORK_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    try {
      localStorage.setItem("argus.locale", locale);
      localStorage.setItem("judex.toc.theme", theme);
    } catch {
      setStorageError(true);
    }
    document.documentElement.lang = locale;
  }, [locale, theme]);
  useEffect(() => {
    const pop = () => setRoute(readRoute());
    const sync = (event: StorageEvent) => {
      if (event.key !== WORK_KEY || !event.newValue) return;
      try {
        const next = normalizeWork(JSON.parse(event.newValue));
        if (next) {
          ref.current = next;
          setState(next);
        }
      } catch {
        /* Keep the current valid demonstration snapshot. */
      }
    };
    window.addEventListener("popstate", pop);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  const go = (next: Partial<Route>) => {
    const value = {
      ...route,
      ...next,
      id:
        "id" in next
          ? next.id
          : next.view && next.view !== route.view
            ? undefined
            : route.id,
    };
    const q = new URLSearchParams({
      design: value.design,
      project: value.projectId,
    });
    if (value.view !== "home") q.set("view", value.view);
    if (value.id) q.set("item", value.id);
    history.pushState(null, "", "/?" + q);
    setRoute(value);
    document.querySelector(".judex-next-main")?.scrollTo(0, 0);
  };
  const act = (fn: (s: WorkState) => Result, success = true) => {
    const result = fn(ref.current);
    if (result.error) {
      setToast(
        t(
          ("workError" +
            result.error[0].toUpperCase() +
            result.error.slice(1)) as Key,
        ),
      );
      return false;
    }
    ref.current = result.state;
    setState(result.state);
    if (success) setToast(t("workSaved"));
    return true;
  };
  const switchPerson = (name: string) => {
    ref.current = { ...ref.current, currentUser: name };
    setState(ref.current);
    go({ view: "home", id: undefined });
  };
  const reset = () => {
    const next = seedWork();
    ref.current = next;
    setState(next);
    go({ projectId: "leaf", view: "home", id: undefined });
    setToast(t("resetDone"));
  };
  const project =
    state.projects.find((p) => p.id === route.projectId) ?? state.projects[0];
  const membership = member(state, project.id),
    management = manage(state, project.id);
  const people = allPeople(state);
  return {
    state,
    route,
    go,
    locale,
    setLocale,
    theme,
    setTheme,
    toast,
    setToast,
    storageError,
    text,
    t,
    act,
    switchPerson,
    reset,
    project,
    membership,
    management,
    people,
  };
}
const Context = createContext<ReturnType<typeof useWorkbench> | null>(null);
export function WorkProvider({ children }: { children: ReactNode }) {
  return <Context.Provider value={useWorkbench()}>{children}</Context.Provider>;
}
export function useWork() {
  const value = useContext(Context);
  if (!value) throw new Error("WorkProvider required");
  return value;
}
