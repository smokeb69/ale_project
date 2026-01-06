import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// No tRPC, no QueryClient, no sessions - just pure React!
createRoot(document.getElementById("root")!).render(<App />);
