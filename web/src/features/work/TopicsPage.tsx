import {Button} from "../../components/ui/Button";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, MessageCircle, Send } from "lucide-react";
import { useWork } from "./store";
import { Btn, EmptyState, Heading, Person, EvidenceList, Upload } from "./ui";
import { closeTopic, topicMessage } from "./actions";
import type { Topic, Evidence } from "./types";
import { DiscussionDialog } from "./CompositionDialogs";
export function TopicsPage() {
  const { state, project, t, text, go } = useWork(),
    list = state.topics.filter((t) => t.projectId === project.id);
  const [creating, setCreating] = useState(false);
  return (
    <>
      <Heading
        eyebrow="ROOM FOR A CONVERSATION"
        title={t("workTopics")}
        description={t("workPureTopic")}
      >
        <Btn testId="new-discussion" onClick={() => setCreating(true)}>
          {t("workNewDiscussion")}
        </Btn>
      </Heading>
      <div className="judex-work-topic-grid">
        {list.map((topic) => (
          <Button
            key={topic.id}
            onClick={() => go({ view: "topic", id: topic.id })}
            className="judex-work-topic-card"
          >
            <MessageCircle />
            <h2>{text(topic.title)}</h2>
            <p>
              {topic.messages.length
                ? text(topic.messages.at(-1)!.text)
                : t("workNoItems")}
            </p>
            <div>
              <span>
                {topic.messages.length} {t("discussion")}
              </span>
              <ArrowUpRight />
            </div>
          </Button>
        ))}
      </div>
      {creating && <DiscussionDialog onClose={() => setCreating(false)} />}
    </>
  );
}
export function TopicPage({ topic }: { topic: Topic }) {
  const { state, t, text, go, act } = useWork(),
    [body, setBody] = useState(""),
    [files, setFiles] = useState<Evidence[]>([]);
  return (
    <div className="judex-work-discussion">
      <Button
        className="judex-work-back"
        onClick={() => go({ view: "topics" })}
      >
        <ArrowLeft />
        {t("workTopics")}
      </Button>
      <Heading eyebrow={t("workPureTopic")} title={text(topic.title)}>
        <Btn
          secondary
          testId="close-pure-topic"
          onClick={() => act((s) => closeTopic(s, topic.id))}
        >
          {t(topic.closed ? "workReopenTopic" : "workCloseTopic")}
        </Btn>
      </Heading>
      <div className="judex-discussion-links">
        {topic.planIds.map((id) => (
          <Button key={id} onClick={() => go({ view: "plan", id })}>
            {text(state.plans.find((p) => p.id === id)!.title)}
            <ArrowUpRight />
          </Button>
        ))}
        {topic.taskIds.map((id) => (
          <Button key={id} onClick={() => go({ view: "task", id })}>
            {text(state.tasks.find((p) => p.id === id)!.title)}
            <ArrowUpRight />
          </Button>
        ))}
      </div>
      <div className="judex-work-messages">
        {topic.messages.map((m) => (
          <article
            className={m.kind === "ai" ? "judex-work-message-ai" : ""}
            key={m.id}
          >
            <Person name={m.actor} small />
            <span>
              {m.kind === "ai"
                ? t("workAI")
                : new Date(m.at).toLocaleTimeString()}
            </span>
            <p>{text(m.text)}</p>
            {!!m.files?.length && <EvidenceList files={m.files} />}
          </article>
        ))}
        {!topic.messages.length && <EmptyState text={t("workNoItems")} />}
      </div>
      <div className="judex-work-composer">
        <textarea
          data-testid="work-discussion-input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("workDiscussPlaceholder")}
        />
        <Btn
          testId="send-work-message"
          disabled={!body.trim() && !files.length}
          onClick={() => {
            if (act((s) => topicMessage(s, topic.id, body, files), false)) {
              setBody("");
              setFiles([]);
            }
          }}
        >
          <Send />
          {t("send")}
        </Btn>
      </div>
      <Upload files={files} onChange={setFiles} />
    </div>
  );
}
