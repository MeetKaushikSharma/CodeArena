import { Routes, Route, Navigate } from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "./authSlice";
import { useEffect,useState } from "react";
import AdminPanel from "./components/AdminPanel";
import ProblemPage from "./pages/ProblemPage";
import Admin from "./pages/Admin";
import AdminDelete from "./components/AdminDelete";
import AdminVideo from "./components/AdminVideo";
import AdminUpload from "./components/AdminUpload";
import ProblemListForUpdate from "./components/Problemlistforupdate";
import UpdateProblem from "./components/Updateproblem";
import ProfileDashboard from "./pages/ProfileDashboard";
import Leaderboard from "./pages/Leaderboard";
import OAuthSuccess from "./pages/OAuthSuccess";
import NotFound from "./pages/NotFound";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [authInitialized, setAuthInitialized] = useState(false); // ← ADD

  useEffect(() => {
    dispatch(checkAuth()).finally(() => setAuthInitialized(true)); // ← ADD
  }, [dispatch]);

  // Show spinner ONLY on first load, not on every checkAuth call
  if (!authInitialized) {               // ← CHANGE (was: if (loading))
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Homepage /> : <Navigate to="/signup" />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" /> : <Signup />}
        />

        {/* ── Profile & Leaderboard (auth required) ── */}
        <Route
          path="/profile"
          element={
            isAuthenticated ? <ProfileDashboard /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/leaderboard"
          element={isAuthenticated ? <Leaderboard /> : <Navigate to="/login" />}
        />

        {/* ── Problems ── */}
        <Route
          path="/problem/:problemId"
          element={isAuthenticated ? <ProblemPage /> : <Navigate to="/login" />}
        />

        {/* ── Admin (role-guarded) ── */}
        <Route
          path="/admin"
          element={
            isAuthenticated && user?.role === "admin" ? (
              <Admin />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin/create"
          element={
            isAuthenticated && user?.role === "admin" ? (
              <AdminPanel />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin/delete"
          element={
            isAuthenticated && user?.role === "admin" ? (
              <AdminDelete />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin/video"
          element={
            isAuthenticated && user?.role === "admin" ? (
              <AdminVideo />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin/upload/:problemId"
          element={
            isAuthenticated && user?.role === "admin" ? (
              <AdminUpload />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin/update"
          element={
            isAuthenticated && user?.role === "admin" ? (
              <ProblemListForUpdate />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin/update/:id"
          element={
            isAuthenticated && user?.role === "admin" ? (
              <UpdateProblem />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="/oauth/success" element={<OAuthSuccess />} />
        
        {/* ── 404 Not Found ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
