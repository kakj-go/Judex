import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/studio.css";
import "./styles/workflow.css";
import "./styles/conversation.css";
import "./styles/agents.css";
import "./styles/membership.css";
import "./styles/work.css";
import "./styles/work-layouts.css";
import "./styles/task-cards.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
