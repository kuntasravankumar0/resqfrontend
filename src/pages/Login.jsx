import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent,
  Stack, TextField, Typography,
} from "@mui/material";
import { authenticateUser, registerUser } from "../services/localBackend";

const initialForm = { name: "", email: "", password: "", department: "", phone: "" };

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const title = useMemo(
    () => (mode === "login" ? "Sign in to RESQ" : "Create Employee Account"),
    [mode]
  );

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await authenticateUser(form.email, form.password);
      } else {
        await registerUser(form);
      }
      setForm(initialForm);
      await onLogin?.();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : err.message || "Something went wrong. Check the backend is running.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box className="auth-layout">
      <Card className="auth-card" elevation={0}>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "8px", background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔩</Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>RESQ</Typography>
              </Box>
              <Typography variant="h4" className="hero-title">{title}</Typography>
              <Typography className="hero-copy" sx={{ mt: 0.5 }}>
                {mode === "login"
                  ? "Service center management — Managers, Admins, and Employees sign in here."
                  : "Self-registration creates an Employee account. Managers create Admin accounts from the Team tab."}
              </Typography>
            </Box>

            <Box className="auth-switch">
              <Button variant={mode === "login" ? "contained" : "outlined"} onClick={() => { setMode("login"); setError(""); }}>Login</Button>
              <Button variant={mode === "register" ? "contained" : "outlined"} onClick={() => { setMode("register"); setError(""); }}>Register as Employee</Button>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" className="auth-form" onSubmit={submit}>
              {mode === "register" && (
                <>
                  <TextField label="Full name" value={form.name} onChange={set("name")} required autoFocus />
                  <TextField label="Department" value={form.department} onChange={set("department")} placeholder="e.g. Electronics Repair" />
                  <TextField label="Phone" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
                </>
              )}
              <TextField label="Email address" type="email" value={form.email} onChange={set("email")} required autoFocus={mode === "login"} />
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                slotProps={{ htmlInput: { minLength: mode === "register" ? 8 : 1 } }}
                helperText={mode === "register" ? "Minimum 8 characters" : ""}
              />
              <Button type="submit" variant="contained" size="large" disabled={busy}>
                {busy ? "Working…" : mode === "login" ? "Sign In" : "Create Employee Account"}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
