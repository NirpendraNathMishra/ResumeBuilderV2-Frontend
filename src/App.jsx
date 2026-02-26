import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { SignIn, SignUp, useUser } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import Home from "./pages/Home";
import SelectField from "./pages/SelectField";
import Builder from "./pages/Builder";
import MyResumes from "./pages/MyResumes";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;
  if (!isSignedIn) return <SignIn />;
  return children;
};

function App() {
  const location = useLocation();
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid rgba(51,65,85,0.5)",
            borderRadius: "10px",
            fontSize: "14px",
          },
        }}
      />
      {!location.pathname.startsWith("/builder") && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in/*" element={
          <div className="auth-container">
            <SignIn routing="path" path="/sign-in" />
          </div>
        } />
        <Route path="/sign-up/*" element={
          <div className="auth-container">
            <SignUp routing="path" path="/sign-up" />
          </div>
        } />
        <Route
          path="/select-field"
          element={<ProtectedRoute><SelectField /></ProtectedRoute>}
        />
        <Route
          path="/builder"
          element={<ProtectedRoute><Builder /></ProtectedRoute>}
        />
        <Route
          path="/builder/:fieldName"
          element={<ProtectedRoute><Builder /></ProtectedRoute>}
        />
        <Route
          path="/my-resumes"
          element={<ProtectedRoute><MyResumes /></ProtectedRoute>}
        />
      </Routes>
    </>
  );
}

export default App;
