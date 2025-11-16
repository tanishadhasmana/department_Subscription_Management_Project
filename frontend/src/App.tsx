import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import AppRouter from "./router/AppRoutes";
import "./index.css";
import { Toaster } from "react-hot-toast";

const App = () => (
  // wreapped with that, like for authentication like logged in user, session managemenet etc.
  <BrowserRouter>
    <AuthProvider>
      <AppRouter />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
