import { useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip,
  Divider, Stack, TextField, Typography,
} from "@mui/material";
import { roleColor, roleLabel, updateUserProfile } from "../services/localBackend";

// Manager can edit any profile (including their own)
// Admin and Employee see read-only view
export default function Profile({ user, currentUser, onUpdate }) {
  const canEdit = currentUser?.role === "manager";
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name || "", department: user.department || "", phone: user.phone || "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      await updateUserProfile(user.id, form);
      setMessage("Profile updated.");
      setEditing(false);
      await onUpdate?.();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Failed to update.");
    } finally { setBusy(false); }
  };

  return (
    <Card elevation={0}>
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Box>
              <Typography variant="h5" className="section-title">Profile</Typography>
              <Typography variant="body2" className="muted">
                {canEdit ? "Manager can edit all profiles." : "Read-only view — contact your Manager to update."}
              </Typography>
            </Box>
            <Chip label={roleLabel(user.role)} color={roleColor(user.role)} />
          </Box>

          <Divider />

          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}

          {editing && canEdit ? (
            <Box component="form" className="auth-form" onSubmit={save}>
              <TextField label="Full name" value={form.name} onChange={update("name")} required />
              <TextField label="Department" value={form.department} onChange={update("department")} />
              <TextField label="Phone" value={form.phone} onChange={update("phone")} />
              <Stack direction="row" spacing={1}>
                <Button type="submit" variant="contained" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
                <Button variant="outlined" onClick={() => setEditing(false)} disabled={busy}>Cancel</Button>
              </Stack>
            </Box>
          ) : (
            <>
              <Box className="profile-grid">
                <Typography variant="subtitle2">Name</Typography>
                <Typography>{user.name}</Typography>
                <Typography variant="subtitle2">Role</Typography>
                <Typography>{roleLabel(user.role)}</Typography>
                <Typography variant="subtitle2">Email</Typography>
                <Typography>{user.email}</Typography>
                <Typography variant="subtitle2">Department</Typography>
                <Typography>{user.department || "N/A"}</Typography>
                <Typography variant="subtitle2">Phone</Typography>
                <Typography>{user.phone || "N/A"}</Typography>
                <Typography variant="subtitle2">Status</Typography>
                <Typography>{user.status || "active"}</Typography>
              </Box>
              <Divider />
              {canEdit && (
                <Button variant="outlined" sx={{ width: "fit-content" }}
                  onClick={() => { setForm({ name: user.name || "", department: user.department || "", phone: user.phone || "" }); setEditing(true); }}>
                  Edit Profile
                </Button>
              )}
              {!canEdit && (
                <Typography variant="body2" className="muted">Only the Manager can edit profiles.</Typography>
              )}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
