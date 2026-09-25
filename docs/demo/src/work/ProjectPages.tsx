import { useState } from "react";
import { FileText, FolderPlus, Upload as UploadIcon } from "lucide-react";
import { useWork } from "./store";
import { Btn, Dialog, Field, Upload, EvidenceList } from "./ui";
import { createDiscussion } from "./composition";
import { topicMessage, assignPositions } from "./actions";
import { uid } from "./seed";
import { words, type Evidence, type Project } from "./types";
export function ExistingAssignments() {
  const { state, project, management, t, text, act } = useWork();
  const [open, setOpen] = useState(false),
    [person, setPerson] = useState(state.currentUser),
    [ids, setIds] = useState<string[]>([]);
  if (!management) return null;
  const available = state.positions.filter(
    (p) =>
      p.projectId === project.id &&
      !state.seats.some((s) => s.person === person && s.positionId === p.id),
  );
  return (
    <>
      <div className="judex-project-assignment">
        <Btn secondary onClick={() => setOpen(true)}>
          {t("projectAssign")}
        </Btn>
      </div>
      {open && (
        <Dialog title={t("projectAssign")} onClose={() => setOpen(false)}>
          <p className="judex-project-note">{t("projectAssignHint")}</p>
          <select
            className="judex-input"
            aria-label={t("workTeam")}
            value={person}
            onChange={(e) => {
              setPerson(e.target.value);
              setIds([]);
            }}
          >
            {project.members.map((m) => (
              <option key={m.name}>{m.name}</option>
            ))}
          </select>
          <div className="judex-position-options">
            {available.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={ids.includes(p.id)}
                  onChange={(e) =>
                    setIds(
                      e.target.checked
                        ? [...ids, p.id]
                        : ids.filter((id) => id !== p.id),
                    )
                  }
                />
                {text(p.name)}
              </label>
            ))}
          </div>
          {!available.length && <p>{t("workNoItems")}</p>}
          <Btn
            disabled={!ids.length}
            testId="assign-existing-position"
            onClick={() => {
              if (act((s) => assignPositions(s, project.id, person, ids))) {
                setOpen(false);
                setIds([]);
              }
            }}
          >
            {t("projectAssign")}
          </Btn>
        </Dialog>
      )}
    </>
  );
}
export function ResourcesPage() {
  const { state, project, t, go, act } = useWork();
  const [adding, setAdding] = useState(false),
    [files, setFiles] = useState<Evidence[]>([]),
    [purpose, setPurpose] = useState("");
  const filesById = new Map<string, Evidence>();
  state.tasks
    .filter((v) => v.projectId === project.id)
    .forEach((v) => v.files.forEach((f) => filesById.set(f.id, f)));
  state.handoffs
    .filter((v) => v.projectId === project.id)
    .forEach((v) =>
      v.sources.forEach((s) => s.files.forEach((f) => filesById.set(f.id, f))),
    );
  state.topics
    .filter((v) => v.projectId === project.id)
    .forEach((v) =>
      v.messages.forEach((m) =>
        m.files?.forEach((f) => filesById.set(f.id, f)),
      ),
    );
  return (
    <>
      <div className="judex-project-section-heading">
        <div>
          <small>{t("projectSource")}</small>
          <h2>{t("projectLibrary")}</h2>
        </div>
        <Btn onClick={() => setAdding(true)}>
          <UploadIcon />
          {t("projectRegister")}
        </Btn>
      </div>
      <p className="judex-project-note">{t("projectRegisterHint")}</p>
      {filesById.size ? (
        <EvidenceList files={[...filesById.values()]} />
      ) : (
        <div className="judex-project-empty">
          <FileText />
          <p>{t("projectFilesEmpty")}</p>
        </div>
      )}
      {adding && (
        <Dialog title={t("projectRegister")} onClose={() => setAdding(false)}>
          <Field label={t("projectPurpose")}>
            <textarea
              className="judex-input"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </Field>
          <Upload files={files} onChange={setFiles} />
          <Btn
            disabled={!files.length}
            onClick={() => {
              let id = "";
              if (
                act((s) => {
                  const r = createDiscussion(
                    s,
                    project.id,
                    purpose.trim() || t("projectEvidence"),
                    [],
                    [],
                  );
                  if (r.error) return r;
                  id = r.state!.topics.at(-1)!.id;
                  return topicMessage(
                    r.state!,
                    id,
                    purpose || t("projectEvidence"),
                    files,
                  );
                })
              ) {
                setAdding(false);
                setFiles([]);
                setPurpose("");
                go({ view: "topic", id });
              }
            }}
          >
            {t("projectRegister")}
          </Btn>
        </Dialog>
      )}
    </>
  );
}
export function ProjectDialog({ onClose }: { onClose: () => void }) {
  const { t, state, act, go } = useWork();
  const [name, setName] = useState(""),
    [goal, setGoal] = useState(""),
    [kind, setKind] = useState<Project["kind"]>("software");
  return (
    <Dialog title={t("projectSetupTitle")} onClose={onClose}>
      <p className="judex-project-note">{t("projectSetupHint")}</p>
      <Field label={t("projectProjectName")}>
        <input
          className="judex-input"
          data-testid="project-project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label={t("projectGoal")}>
        <textarea
          className="judex-input"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
      </Field>
      <Field label={t("projectKind")}>
        <select
          className="judex-input"
          value={kind}
          onChange={(e) => setKind(e.target.value as Project["kind"])}
        >
          <option value="software">{t("projectSoftware")}</option>
          <option value="design">{t("projectDesign")}</option>
        </select>
      </Field>
      <Btn
        disabled={!name.trim() || !goal.trim()}
        testId="project-create-project"
        onClick={() => {
          const id = uid();
          if (
            act((s) => {
              if (!name.trim() || !goal.trim()) return { error: "required" };
              return {
                state: {
                  ...s,
                  projects: [
                    ...s.projects,
                    {
                      id,
                      title: words(name.trim()),
                      description: words(goal.trim()),
                      kind,
                      members: [{ name: s.currentUser, role: "owner" }],
                    },
                  ],
                },
              };
            })
          ) {
            onClose();
            go({ projectId: id, view: "home", id: undefined });
          }
        }}
      >
        <FolderPlus />
        {t("projectCreate")}
      </Btn>
    </Dialog>
  );
}
