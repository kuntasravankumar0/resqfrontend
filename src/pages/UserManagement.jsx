import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip,
  Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import {
  createAdmin, createEmployee, deleteJob, deleteUser,
  roleColor, roleLabel, updateJob, updateUserProfile,
} from "../services/localBackend";

const initialForm = { name: "", email: "", password: "", department: "", phone: "", role: "employee" };
const statusColor  = { completed_today: "success", tomorrow: "info", pending: "default", no_install: "error", customer_next_day: "warning" };
const statusOpts   = ["pending", "completed_today", "tomorrow", "no_install", "customer_next_day"];

export default function UserManagement({ store, currentUser, onChange }) {
  const [form, setForm]         = useState(initialForm);
  const [error, setError]       = useState("");
  const [message, setMessage]   = useState("");
  const [busy, setBusy]         = useState(false);

  // Edit user dialog
  const [editUser, setEditUser]   = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [editBusy, setEditBusy]   = useState(false);

  // View employee jobs dialog
  const [viewEmp, setViewEmp]   = useState(null);

  // Edit job dialog (from employee view)
  const [editJob, setEditJob]   = useState(null);
  const [jobForm, setJobForm]   = useState({});
  const [jobBusy, setJobBusy]   = useState(false);

  const flash = (msg, isErr = false) => {
    if (isErr) { setError(msg); setMessage(""); } else { setMessage(msg); setError(""); }
    setTimeout(() => { setError(""); setMessage(""); }, 5000);
  };

  if (currentUser.role !== "manager") {
    return <Alert severity="warning">Account management is available to managers only.</Alert>;
  }

  const employees = useMemo(() => (store.users || []).filter((u) => u.role === "employee"), [store.users]);
  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  // ── Create user ─────────────────────────────────────────────────────────────
  const submitCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const created = form.role === "admin" ? await createAdmin(form) : await createEmployee(form);
      flash(`${created.name} created as ${roleLabel(created.role)}.`);
      setForm(initialForm);
      await onChange?.();
    } catch (err) {
      flash(err?.response?.data?.detail || err.message || "Failed.", true);
    } finally { setBusy(false); }
  };

  // ── Delete user (cascades all their data) ───────────────────────────────────
  const removeUser = async (userId, userName) => {
    if (!window.confirm(`Delete ${userName}? All their jobs, notes, and messages will be removed.`)) return;
    setBusy(true);
    try {
      await deleteUser(userId);
      flash("User and all associated data deleted.");
      await onChange?.();
    } catch (err) {
      flash(err?.response?.data?.detail || err.message || "Failed.", true);
    } finally { setBusy(false); }
  };

  // ── Edit user profile ────────────────────────────────────────────────────────
  const openEditUser = (user) => {
    setEditUser(user);
    setEditForm({ name: user.name, department: user.department || "", phone: user.phone || "" });
  };
  const saveEditUser = async () => {
    if (!editUser) return;
    setEditBusy(true);
    try {
      await updateUserProfile(editUser.id, editForm);
      flash(`${editForm.name} updated.`);
      setEditUser(null);
      await onChange?.();
    } catch (err) {
      flash(err?.response?.data?.detail || err.message || "Update failed.", true);
      setEditUser(null);
    } finally { setEditBusy(false); }
  };

  // ── Employee jobs dialog ─────────────────────────────────────────────────────
  const empJobs = useMemo(() => {
    if (!viewEmp) return [];
    return (store.serviceJobs || []).filter((j) => j.assignedTo === viewEmp.id);
  }, [store.serviceJobs, viewEmp]);

  // ── Edit job ─────────────────────────────────────────────────────────────────
  const openEditJob = (job) => {
    setEditJob(job);
    setJobForm({
      serviceNumber: job.serviceNumber,
      customerName: job.customerDetails?.name || "",
      customerPhone: job.customerDetails?.phone || "",
      assignedTo: job.assignedTo || "",
      priority: job.priority,
      currentStatus: job.currentStatus,
    });
  };
  const saveEditJob = async () => {
    if (!editJob) return;
    setJobBusy(true);
    try {
      await updateJob(editJob.id, { ...jobForm, assignedTo: jobForm.assignedTo ? Number(jobForm.assignedTo) : null });
      flash("Job updated.");
      setEditJob(null);
      await onChange?.();
    } catch (err) {
      flash(err?.response?.data?.detail || err.message || "Update failed.", true);
      setEditJob(null);
    } finally { setJobBusy(false); }
  };
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Delete this job?")) return;
    try {
      await deleteJob(jobId);
      flash("Job deleted.");
      await onChange?.();
    } catch (err) {
      flash(err?.response?.data?.detail || err.message || "Delete failed.", true);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      {error   && <Alert severity="error"   onClose={() => setError("")}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.4fr" }, gap: 2.5 }}>
        {/* Create account */}
        <Card elevation={0}>
          <CardContent>
            <Typography variant="h6" className="section-title">Create Account</Typography>
            <Typography variant="body2" className="muted" sx={{ mb: 2 }}>
              Only managers can create Admin and Employee accounts.
            </Typography>
            <Box component="form" className="auth-form" onSubmit={submitCreate}>
              <TextField label="Full name"  value={form.name}       onChange={set("name")}       required />
              <TextField label="Email"      type="email" value={form.email} onChange={set("email")} required />
              <TextField label="Password (min 8)" type="password" value={form.password} onChange={set("password")}
                required slotProps={{ htmlInput: { minLength: 8 } }} />
              <TextField label="Department" value={form.department}  onChange={set("department")} />
              <TextField label="Phone"      value={form.phone}       onChange={set("phone")} />
              <TextField select label="Role" value={form.role} onChange={set("role")}>
                <MenuItem value="employee">Employee (Technician)</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
              <Button type="submit" variant="contained" disabled={busy}>
                {busy ? "Creating…" : "Create Account"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Account list with Edit */}
        <Card elevation={0}>
          <CardContent>
            <Typography variant="h6" className="section-title" sx={{ mb: 1.5 }}>
              All Accounts ({(store.users || []).length})
            </Typography>
            <Stack spacing={1.5} className="table-list">
              {(store.users || []).map((user) => (
                <Box key={user.id} className="table-row">
                  <Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5 }}>
                      <Typography variant="subtitle2">{user.name}</Typography>
                      <Chip size="small" label={roleLabel(user.role)} color={roleColor(user.role)} />
                    </Box>
                    <Typography variant="body2">{user.email}</Typography>
                    <Typography variant="body2" className="muted">
                      {user.department || "No department"}{user.phone ? ` · ${user.phone}` : ""}
                    </Typography>
                    {user.role === "employee" && (
                      <Button size="small" variant="text" sx={{ p: 0, mt: 0.5 }}
                        onClick={() => setViewEmp(user)}>
                        View jobs →
                      </Button>
                    )}
                  </Box>
                  <Stack direction="column" spacing={0.5} sx={{ alignItems: "flex-end" }}>
                    <Button size="small" variant="outlined" onClick={() => openEditUser(user)}>Edit</Button>
                    {user.id !== currentUser.id && (
                      <Button size="small" color="error" onClick={() => removeUser(user.id, user.name)} disabled={busy}>
                        Delete
                      </Button>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* ── Edit user dialog ── */}
      <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit — {editUser?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Full name"  value={editForm.name || ""}       onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} required />
            <TextField label="Department" value={editForm.department || ""} onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))} />
            <TextField label="Phone"      value={editForm.phone || ""}      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveEditUser} disabled={editBusy}>
            {editBusy ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Employee jobs dialog ── */}
      <Dialog open={!!viewEmp} onClose={() => setViewEmp(null)} maxWidth="md" fullWidth>
        <DialogTitle>Jobs for {viewEmp?.name}</DialogTitle>
        <DialogContent>
          {empJobs.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>No jobs assigned to this employee.</Alert>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {empJobs.map((job) => (
                <Box key={job.id} className="table-row">
                  <Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5 }}>
                      <Typography variant="subtitle2">{job.serviceNumber}</Typography>
                      <Chip size="small" label={job.priority === "high" ? "Express" : job.priority} color={job.priority === "high" ? "error" : "default"} />
                      <Chip size="small" label={job.currentStatus.replace(/_/g, " ")} color={statusColor[job.currentStatus] || "default"} />
                    </Box>
                    <Typography variant="body2">{job.customerDetails?.name}</Typography>
                    <Typography variant="caption" className="muted">{job.customerDetails?.phone || ""}</Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Button size="small" variant="outlined" onClick={() => openEditJob(job)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDeleteJob(job.id)}>Delete</Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewEmp(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit job dialog ── */}
      <Dialog open={!!editJob} onClose={() => setEditJob(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Job #{jobForm.serviceNumber}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Service #"     value={jobForm.serviceNumber || ""} onChange={(e) => setJobForm((f) => ({ ...f, serviceNumber: e.target.value }))} required />
            <TextField label="Customer name" value={jobForm.customerName || ""}  onChange={(e) => setJobForm((f) => ({ ...f, customerName: e.target.value }))} required />
            <TextField label="Phone"         value={jobForm.customerPhone || ""} onChange={(e) => setJobForm((f) => ({ ...f, customerPhone: e.target.value }))} />
            <TextField select label="Assign to" value={jobForm.assignedTo || ""} onChange={(e) => setJobForm((f) => ({ ...f, assignedTo: e.target.value }))}>
              <MenuItem value="">Unassigned</MenuItem>
              {employees.map((emp) => <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>)}
            </TextField>
            <TextField select label="Priority" value={jobForm.priority || "medium"} onChange={(e) => setJobForm((f) => ({ ...f, priority: e.target.value }))}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">Express</MenuItem>
            </TextField>
            <TextField select label="Status" value={jobForm.currentStatus || "pending"} onChange={(e) => setJobForm((f) => ({ ...f, currentStatus: e.target.value }))}>
              {statusOpts.map((s) => <MenuItem key={s} value={s}>{s.replace(/_/g, " ")}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditJob(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveEditJob} disabled={jobBusy}>
            {jobBusy ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
