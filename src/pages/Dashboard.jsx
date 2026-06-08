import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip,
  LinearProgress, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { addJobNote, getDashboardSummary, roleColor, roleLabel } from "../services/localBackend";
import { useAutoLocation } from "./LocationView";

const statusOptions = [
  { label: "Pending",           value: "pending" },
  { label: "Completed Today",   value: "completed_today" },
  { label: "Tomorrow",          value: "tomorrow" },
  { label: "No Install",        value: "no_install" },
  { label: "Customer Next Day", value: "customer_next_day" },
];

const kpiMetrics = [
  { key: "pendingJobs",         label: "Pending",        color: "#f59e0b" },
  { key: "completedToday",      label: "Completed Today", color: "#10b981" },
  { key: "scheduledTomorrow",   label: "Tomorrow",        color: "#6366f1" },
  { key: "pendingPartRequests", label: "Approvals",       color: "#ef4444" },
];

const statusColor = {
  completed_today: "success", tomorrow: "info", pending: "default",
  no_install: "error", customer_next_day: "warning",
};
const channelIcon = { sms: "📱", whatsapp: "💬" };
const webhookStatusColor = { queued: "warning", sent: "success", failed: "error" };

// ── Employee view ─────────────────────────────────────────────────────────────
function EmployeeDashboard({ store, currentUser, onChange }) {
  const today = new Date().toISOString().slice(0, 10);
  const [filterDate, setFilterDate] = useState(today);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingJob, setUpdatingJob] = useState(null);

  // Auto-share location silently (no button) — useEffect inside the hook
  useAutoLocation(currentUser.id, currentUser.name);

  const myJobs = useMemo(
    () => (store.serviceJobs || []).filter((j) => j.assignedTo === currentUser.id),
    [store.serviceJobs, currentUser.id]
  );

  const filteredJobs = useMemo(() => {
    return myJobs.filter((job) => {
      const logs = (store.jobLogs || []).filter((l) => l.jobId === job.id);
      const hasLogOnDate = logs.some((l) => l.dateStamp?.slice(0, 10) === filterDate);
      const createdOnDate = job.createdAt?.slice(0, 10) === filterDate;
      const dateMatch = filterDate ? hasLogOnDate || createdOnDate : true;
      const statusMatch = filterStatus === "all" || job.currentStatus === filterStatus;
      return dateMatch && statusMatch;
    });
  }, [myJobs, filterDate, filterStatus, store.jobLogs]);

  const latestNote = (jobId) => {
    const logs = (store.jobLogs || []).filter((l) => l.jobId === jobId);
    return logs.sort((a, b) => new Date(b.dateStamp) - new Date(a.dateStamp))[0] || null;
  };

  const quickUpdate = async (jobId, newStatus) => {
    setUpdatingJob(jobId);
    try {
      await addJobNote(jobId, {
        noteText: `Status → ${statusOptions.find((s) => s.value === newStatus)?.label || newStatus}`,
        currentStatus: newStatus,
        partsRequested: [],
      });
      await onChange?.();
    } finally { setUpdatingJob(null); }
  };

  const pendingCount  = myJobs.filter((j) => j.currentStatus === "pending").length;
  const completedCount = myJobs.filter((j) => j.currentStatus === "completed_today").length;

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      {/* Welcome */}
      <Card className="hero-card" elevation={0}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1 }}>
            <Chip label="Technician" color="info" />
            <Typography variant="body2" className="muted">{currentUser.department || "Field Tech"}</Typography>
            <Chip label="📍 Location: Auto" size="small" color="success" variant="outlined" />
          </Box>
          <Typography variant="h5" className="section-title">
            Welcome back, {currentUser.name.split(" ")[0]}
          </Typography>
          <Typography className="muted" sx={{ mt: 0.5 }}>
            {myJobs.length} total · {pendingCount} pending · {completedCount} completed today
          </Typography>
        </CardContent>
      </Card>

      {/* KPI row */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
        {[
          { label: "Total Jobs",       value: myJobs.length,   color: "#6366f1" },
          { label: "Pending",          value: pendingCount,    color: "#f59e0b" },
          { label: "Completed Today",  value: completedCount,  color: "#10b981" },
        ].map((m) => (
          <Card key={m.label} className="metric-card" elevation={0}>
            <CardContent>
              <Typography variant="overline" sx={{ color: m.color, fontWeight: 700 }}>{m.label}</Typography>
              <Typography variant="h3" sx={{ color: m.color, fontWeight: 800 }}>{m.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Today's Tasks */}
      <Card elevation={0}>
        <CardContent>
          <Typography variant="h6" className="section-title" sx={{ mb: 1.5 }}>Today's Tasks</Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              type="date"
              label="Date"
              size="small"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 180 }}
            />
            <TextField
              select
              label="Status"
              size="small"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ width: 200 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {statusOptions.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
            {(filterDate !== today || filterStatus !== "all") && (
              <Button size="small" onClick={() => { setFilterDate(today); setFilterStatus("all"); }}>
                Reset
              </Button>
            )}
          </Stack>

          <Typography variant="caption" className="muted" sx={{ mb: 1, display: "block" }}>
            Showing {filteredJobs.length} of {myJobs.length} jobs
          </Typography>

          {filteredJobs.length === 0 ? (
            <Alert severity="info">No jobs match the selected date / status.</Alert>
          ) : (
            <Stack spacing={1.5} className="table-list">
              {filteredJobs.map((job) => {
                const note = latestNote(job.id);
                return (
                  <Box key={job.id} className="table-row">
                    <Box>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5, flexWrap: "wrap" }}>
                        <Typography variant="subtitle2">{job.serviceNumber}</Typography>
                        <Chip size="small" label={job.priority === "high" ? "Express" : job.priority} color={job.priority === "high" ? "error" : "default"} />
                        <Chip size="small" label={job.currentStatus.replace(/_/g, " ")} color={statusColor[job.currentStatus] || "default"} />
                      </Box>
                      <Typography variant="body2">{job.customerDetails?.name}</Typography>
                      <Typography variant="caption" className="muted">
                        {job.customerDetails?.phone || "No phone"}
                        {job.customerDetails?.email ? ` · ${job.customerDetails.email}` : ""}
                      </Typography>
                      {note && (
                        <Typography variant="caption" className="muted" sx={{ display: "block", mt: 0.5 }}>
                          Last note ({new Date(note.dateStamp).toLocaleDateString()}): {note.noteText.slice(0, 80)}{note.noteText.length > 80 ? "…" : ""}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-end", minWidth: 170 }}>
                      <TextField
                        select
                        size="small"
                        value={job.currentStatus}
                        onChange={(e) => quickUpdate(job.id, e.target.value)}
                        disabled={updatingJob === job.id}
                        sx={{ width: 170 }}
                      >
                        {statusOptions.map((s) => (
                          <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                        ))}
                      </TextField>
                      <Typography variant="caption" className="muted">
                        {new Date(job.updatedAt || job.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// ── Manager / Admin view ──────────────────────────────────────────────────────
function ManagerAdminDashboard({ store, currentUser }) {
  const summary = getDashboardSummary(store, currentUser);
  const metricsPanel = store.managerMetrics || {};
  const webhookLogs = (store.webhookLogs || []).slice(0, 10);

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      {/* Welcome */}
      <Card className="hero-card" elevation={0}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1 }}>
            <Chip label={roleLabel(currentUser.role)} color={roleColor(currentUser.role)} />
            <Typography variant="body2" className="muted">{currentUser.email}</Typography>
          </Box>
          <Typography variant="h5" className="section-title">
            Welcome back, {currentUser.name.split(" ")[0]}
          </Typography>
          <Typography className="muted" sx={{ mt: 0.5 }}>
            {currentUser.role === "manager"
              ? "Full access — manage accounts, performance, all service data."
              : "Import sheet data, assign jobs to technicians, search all records."}
          </Typography>
        </CardContent>
      </Card>

      {/* KPI row */}
      <Box className="metric-grid">
        {kpiMetrics.map((item) => (
          <Card key={item.key} className="metric-card" elevation={0}>
            <CardContent>
              <Typography variant="overline" sx={{ color: item.color, fontWeight: 700 }}>{item.label}</Typography>
              <Typography variant="h3" sx={{ color: item.color, fontWeight: 800 }}>{summary[item.key] ?? 0}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Technician performance */}
      {(metricsPanel.employeeMetrics || []).length > 0 && (
        <Card elevation={0}>
          <CardContent>
            <Typography variant="h6" className="section-title" sx={{ mb: 1.5 }}>Technician Performance</Typography>
            <Stack spacing={2}>
              {metricsPanel.employeeMetrics.map((entry) => {
                const total = entry.jobsCompletedToday + entry.pendingBacklog;
                const pct = total > 0 ? Math.round((entry.jobsCompletedToday / total) * 100) : 0;
                return (
                  <Box key={entry.employeeId}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="subtitle2">{entry.employeeName}</Typography>
                      <Typography variant="caption" className="muted">
                        {entry.jobsCompletedToday} done · {entry.pendingBacklog} pending · {entry.averageResolutionMinutes} min avg
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                      color={pct >= 80 ? "success" : pct >= 40 ? "warning" : "error"}
                      sx={{ height: 8, borderRadius: 4 }} />
                    <Typography variant="caption" className="muted">{pct}% completion rate</Typography>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
        {[
          { label: "Total Users",   value: summary.totalUsers },
          { label: "Admins",        value: summary.admins },
          { label: "Employees",     value: summary.employees },
          { label: "Total Jobs",    value: summary.jobs },
          { label: "Completed",     value: summary.completedToday },
          { label: "Tomorrow",      value: summary.scheduledTomorrow },
        ].map((item) => (
          <Card key={item.label} className="metric-card" elevation={0}>
            <CardContent sx={{ py: "12px !important" }}>
              <Typography variant="overline">{item.label}</Typography>
              <Typography variant="h4">{item.value ?? 0}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Customer notification log */}
      <Card elevation={0}>
        <CardContent>
          <Typography variant="h6" className="section-title" sx={{ mb: 1 }}>Customer Notification Log</Typography>
          <Typography variant="body2" className="muted" sx={{ mb: 2 }}>
            SMS/WhatsApp sent when a job is marked "Completed Today".
          </Typography>
          {webhookLogs.length === 0 ? (
            <Alert severity="info">No notifications sent yet.</Alert>
          ) : (
            <Stack spacing={1.5} className="table-list">
              {webhookLogs.map((log) => (
                <Box key={log.id} className="table-row">
                  <Box>
                    <Typography variant="subtitle2">{channelIcon[log.channel] || "📨"} {log.message}</Typography>
                    <Typography variant="body2" className="muted">Job #{log.jobId} · {log.channel}</Typography>
                  </Box>
                  <Box className="right-aligned">
                    <Chip size="small" label={log.status} color={webhookStatusColor[log.status] || "default"} />
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      {(store.activities || []).length > 0 && (
        <Card elevation={0}>
          <CardContent>
            <Typography variant="h6" className="section-title" sx={{ mb: 1.5 }}>Recent Activity</Typography>
            <Stack spacing={1} className="activity-list">
              {(store.activities || []).slice(0, 10).map((a) => (
                <Box key={a.id} className="activity-row">
                  <Box>
                    <Typography variant="subtitle2">{a.title}</Typography>
                    <Typography variant="body2" className="muted">{a.description}</Typography>
                  </Box>
                  <Typography variant="caption" className="muted">
                    {new Date(a.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default function Dashboard({ store, currentUser, onChange }) {
  if (currentUser.role === "employee") {
    return <EmployeeDashboard store={store} currentUser={currentUser} onChange={onChange} />;
  }
  return <ManagerAdminDashboard store={store} currentUser={currentUser} />;
}
