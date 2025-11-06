import ReactDOM from "react-dom/client";
import AppRouter from "./router/AppRoutes";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
    </BrowserRouter>
);
