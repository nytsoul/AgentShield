import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import Ingestion from "./components/Ingestion";
import PreExecution from "./components/PreExecution";
import MemoryIntegrity from "./components/MemoryIntegrity";
import ConversationIntelligence from "./components/ConversationIntelligence";
import Output from "./components/Output";
import AdversarialResponse from "./components/AdversarialResponse";
import InterAgent from "./components/InterAgent";
import AdaptiveLearning from "./components/AdaptiveLearning";
import Observability from "./components/Observability";
import Honeypot from "./components/Honeypot";
import ChatInterface from "./components/ChatInterface";
import Settings from "./components/Settings";
import Auth from "./components/Auth";
import AuthCallback from "./components/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import { createElement } from "react";

// Helper to wrap a component with ProtectedRoute
const protect = (Comp: React.ComponentType, adminOnly = false) => () =>
  createElement(ProtectedRoute, { adminOnly }, createElement(Comp));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "chat", Component: ChatInterface },
      { path: "dashboard", Component: Dashboard },
      { path: "layer1-ingestion", Component: protect(Ingestion, true) },
      { path: "layer2-pre-execution", Component: protect(PreExecution, true) },
      { path: "layer3-memory", Component: protect(MemoryIntegrity, true) },
      { path: "layer4-conversation", Component: protect(ConversationIntelligence, true) },
      { path: "layer5-output", Component: protect(Output, true) },
      { path: "layer5-honeypot", Component: protect(Honeypot, true) },
      { path: "layer6-adversarial", Component: protect(AdversarialResponse, true) },
      { path: "layer7-inter-agent", Component: protect(InterAgent, true) },
      { path: "layer8-adaptive", Component: protect(AdaptiveLearning, true) },
      { path: "layer9-observability", Component: protect(Observability, true) },
      { path: "settings", Component: Settings },
    ],
  },
  {
    path: "/auth",
    Component: Auth,
  },
  {
    path: "/auth/callback",
    Component: AuthCallback,
  }
]);
