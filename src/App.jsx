import { useEffect, useMemo, useState } from "react";
import {
  AppBar, Box, Button, Chip, Container, CssBaseline,
  Paper, Tab, Tabs, Toolbar, Typography,
} from "@mui/material";
import {
  Link as RouterLink, Navigate, Route, Routes,
  useLocation, useNavigate,
} from "react-router-dom";

import Home           from "./pages/Home";
import Dashboard      from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Chat           from "./pages/Chat";
import DataCenter     from "./pages/DataCenter";
import Messaging      from "./pages/Messaging";
import Notes          from "./pages/Notes";
import LocationView   from "./pages/LocationView";
import Login          from "./pages/Login";
import Profile        from "./pages/Profile";
import Settings       from "./pages/Settings";
import { AppProvider } from "./context/AppContext";
import { useAutoLocation } from "./pages/LocationView";
import {
  clearSession, getCurrentSession, getStoreSnapshot,
  initStore, loadSession, roleLabel,
} from "./services/localBackend";
import "./App.css";

// Navigation config — employees get "Customer Members" instead of "Jobs"
const navigation = [
  { label: "Dashboard",         path: "/app",       roles: ["admin", "manager", "employee"] },
  { label: "Customer Members",  path: "/jobs",       roles: ["employee"] },
  { label: "Import",            path: "/search",     roles: ["admin", "manager"] },
  { label: "Chat",              path: "/messages",   roles: ["admin", "manager", "employee"] },
  { label: "Notes",             path: "/notes",      roles: ["admin", "manager", "employee"] },
  { label: "Locations",         path: "/locations",  roles: ["admin", "manager"] },
  { label: "Team",              path: "/team",       roles: ["manager"] },
  { label: "Profile",           path: "/profile",    roles: ["admin", "manager", "employee"] },
  { label: "Settings",          path: "/settings",   roles: ["admin", "manager", "employee"] },
];

// Inner component so hooks run after currentUser is available
function AuthenticatedApp({ currentUser, store, session, refresh, handleLogout }) {
  const location  = useLocation();
  const navigate  = useNavigate();

  // Employee: auto-share location silently
  useAutoLocation(
    currentUser.role === "employee" ? currentUser.id : null,
    currentUser.name
  );

  const visibleTabs = useMemo(() => {
    const role = currentUser?.role;
    return navigation.filter((item) => item.roles.includes(role));
  }, [currentUser]);

  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/login") return;
    const ok = visibleTabs.some((item) => location.pathname.startsWith(item.path));
    if (!ok) navigate(visibleTabs[0]?.path || "/app", { replace: true });
  }, [currentUser, location.pathname, navigate, visibleTabs]);

  const activeTabIndex = visibleTabs.findIndex((item) => location.pathname.startsWith(item.path));
  const activeTab   = activeTabIndex >= 0 ? activeTabIndex : 0;
  const activeLabel = visibleTabs[activeTab]?.label || "Dashboard";

  return (
    <AppProvider value={{ store, session, currentUser, refresh }}>
      <CssBaseline />
      <Box className="app-shell">
        <AppBar position="sticky" color="transparent" elevation={0}>
          <Toolbar className="topbar">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{
                width: 34, height: 34, borderRadius: "8px",
                background: "linear-gradient(135deg,#f59e0b,#ef4444)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}>🔩</Box>
              <Box>
                <Typography variant="overline" className="eyebrow" sx={{ lineHeight: 1 }}>RESQ</Typography>
                <Typography variant="h6" className="title" sx={{ lineHeight: 1 }}>{activeLabel}</Typography>
              </Box>
            </Box>

            <Box className="topbar-actions">
              <Chip label={roleLabel(currentUser.role)} className={`role-chip ${currentUser.role}`} />
              <Typography variant="body2" sx={{ color: "#66707b" }}>{currentUser.name}</Typography>
              <Button variant="outlined" size="small" onClick={handleLogout}>Logout</Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" className="app-container">
          <Paper className="nav-card" elevation={0}>
            <Tabs value={activeTab} variant="scrollable" scrollButtons="auto">
              {visibleTabs.map((item) => (
                <Tab key={item.path} label={item.label} component={RouterLink} to={item.path} />
              ))}
            </Tabs>
          </Paper>

          <Box className="page-stack">
            <Routes>
              <Route path="/app"       element={<Dashboard      store={store} currentUser={currentUser} onChange={refresh} />} />
              <Route path="/jobs"      element={<Chat           store={store} currentUser={currentUser} onChange={refresh} />} />
              <Route path="/search"    element={<DataCenter     store={store} currentUser={currentUser} onChange={refresh} />} />
              <Route path="/messages"  element={<Messaging      store={store} currentUser={currentUser} onChange={refresh} />} />
              <Route path="/notes"     element={<Notes          store={store} currentUser={currentUser} />} />
              <Route path="/locations" element={<LocationView   store={store} />} />
              <Route path="/team"      element={<UserManagement store={store} currentUser={currentUser} onChange={refresh} />} />
              <Route path="/profile"   element={<Profile        user={currentUser} currentUser={currentUser} onUpdate={refresh} />} />
              <Route path="/settings"  element={<Settings       currentUser={currentUser} />} />
              <Route path="*"          element={<Navigate to={visibleTabs[0]?.path || "/app"} replace />} />
            </Routes>
          </Box>
        </Container>
      </Box>
    </AppProvider>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [ready,   setReady]   = useState(false);
  const [session, setSession] = useState(() => loadSession());
  const [store,   setStore]   = useState(() => getStoreSnapshot());

  const refresh = async () => {
    await initStore();
    setStore(getStoreSnapshot());
    setSession(loadSession());
  };

  useEffect(() => {
    (async () => {
      await initStore();
      setStore(getStoreSnapshot());
      setSession(getCurrentSession());
      setReady(true);
    })();
  }, []);

  const currentUser = useMemo(() => {
    if (!session || !store?.users) return null;
    return store.users.find((u) => u.id === session.userId) || null;
  }, [session, store]);

  const handleLogin  = async () => { await refresh(); navigate("/app", { replace: true }); };
  const handleLogout = () => { clearSession(); setSession(null); navigate("/", { replace: true }); };

  if (!ready) return null;

  if (!currentUser) {
    return (
      <AppProvider value={{ store, session, currentUser, refresh }}>
        <CssBaseline />
        <Routes>
          <Route path="/"      element={<Home />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*"      element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    );
  }

  return (
    <AuthenticatedApp
      currentUser={currentUser}
      store={store}
      session={session}
      refresh={refresh}
      handleLogout={handleLogout}
    />
  );
}
