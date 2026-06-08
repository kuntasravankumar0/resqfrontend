import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip,
  MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { addJobNote, getAllowedJobs, roleLabel } from "../services/localBackend";

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Completed Today", value: "completed_today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "No Install", value: "no_install" },
  { label: "Customer Next Day", value: "customer_next_day" },
];

const priorityColor = { high: "error", medium: "warning", low: "default" };
const priorityLabel = { high: "Express", medium: "Medium", low: "Low" };
const statusColor = { completed_today: "success", tomorrow: "info", pending: "default", no_install: "error", customer_next_day: "warning" };

export default function Chat({ store, currentUser, onChange }) {
  const jobs = useMemo(() => getAllowedJobs(store, currentUser), [store, currentUser]);
  const [selectedJobId, setSelectedJobId] = useState(() => jobs[0]?.id || "");
  const [noteText, setNoteText] = useState("");
  const [currentStatus, setCurrentStatus] = useState(() => jobs[0]?.currentStatus || "pending");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0] || null;

  const history = useMemo(() => {
    if (!selectedJob) return [];
    let logs = (store.jobLogs || []).filter((l) => l.jobId === selectedJob.id);
    if (filterFrom) logs = logs.filter((l) => new Date(l.dateStamp) >= new Date(filterFrom));
    if (filterTo) {
      const end = new Date(filterTo); end.setHours(23, 59, 59, 999);
      logs = logs.filter((l) => new Date(l.dateStamp) <= end);
    }
    return [...logs].sort((a, b) => new Date(a.dateStamp) - new Date(b.dateStamp));
  }, [store.jobLogs, selectedJob, filterFrom, filterTo]);

  const flash = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccessMsg(""); }
    else { setSuccessMsg(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccessMsg(""); }, 4000);
  };

  const submitNote = async (e) => {
    e.preventDefault();
    if (!selectedJob || !noteText.trim()) return;
    setBusy(true);
    try {
      await addJobNote(selectedJob.id, { noteText, currentStatus, partsRequested: [] });
      setNoteText("");
      flash("Note saved.");
      await onChange?.();
    } catch (err) {
      flash(err?.response?.data?.detail || err.message || "Failed.", true);
    } finally { setBusy(false); }
  };

  const quickStatus = async (val) => {
    if (!selectedJob) return;
    setBusy(true);
    try {
      await addJobNote(selectedJob.id, {
        noteText: `Status → ${statusOptions.find((s) => s.value === val)?.label || val}`,
        currentStatus: val, partsRequested: [],
      });
      flash(`Status updated.`);
      await onChange?.();
    } catch (err) {
      flash(err?.response?.data?.detail || err.message || "Failed.", true);
    } finally { setBusy(false); }
  };

  if (!jobs.length) {
    return <Alert severity="warning">No service jobs assigned yet. Contact your Admin or Manager.</Alert>;
  }

  return (
    <Card elevation={0} className="chat-shell">
      <CardContent className="chat-layout" sx={{ padding: "0 !important" }}>

        {/* Sidebar */}
        <Box className="chat-sidebar">
          <Typography variant="h6" className="section-title" sx={{ mb: 0.5 }}>Jobs</Typography>
          <Typography variant="body2" className="muted" sx={{ mb: 2 }}>{jobs.length} assigned</Typography>
          <Stack spacing={1}>
            {jobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              return (
                <Box
                  key={job.id}
                  className={`job-card${isSelected ? " selected" : ""}${job.priority === "high" ? " urgent" : ""}`}
                  onClick={() => { setSelectedJobId(job.id); setCurrentStatus(job.currentStatus); }}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedJobId(job.id)}
                >
                  <Stack spacing={0.5}>
                    <Box className="job-card-row">
                      <Typography variant="subtitle2">{job.serviceNumber}</Typography>
                      <Chip size="small" label={priorityLabel[job.priority] || job.priority} color={priorityColor[job.priority] || "default"} />
                    </Box>
                    <Typography variant="body2">{job.customerDetails?.name}</Typography>
                    <Typography variant="caption" className="muted">{job.customerDetails?.phone || "No phone"}</Typography>
                    <Chip size="small" label={job.currentStatus.replace(/_/g, " ")} color={statusColor[job.currentStatus] || "default"} sx={{ width: "fit-content" }} />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* Thread */}
        <Box className="chat-thread">
          {selectedJob ? (
            <>
              <Box className="chat-header">
                <Box>
                  <Typography variant="h6">Job #{selectedJob.serviceNumber}</Typography>
                  <Typography variant="body2" className="muted">
                    {selectedJob.customerDetails?.name}
                    {selectedJob.customerDetails?.phone ? ` · ${selectedJob.customerDetails.phone}` : ""}
                    {selectedJob.customerDetails?.email ? ` · ${selectedJob.customerDetails.email}` : ""}
                  </Typography>
                </Box>
                <Box className="chat-header-actions">
                  <Chip label={selectedJob.currentStatus.replace(/_/g, " ")} color={statusColor[selectedJob.currentStatus] || "default"} />
                  <Chip label={priorityLabel[selectedJob.priority] || selectedJob.priority} color={priorityColor[selectedJob.priority] || "default"} />
                </Box>
              </Box>

              {error && <Alert severity="error">{error}</Alert>}
              {successMsg && <Alert severity="success">{successMsg}</Alert>}

              {/* Date filter */}
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                <Typography variant="caption" className="muted">Filter notes:</Typography>
                <TextField label="From" type="date" size="small" value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 160 }} />
                <TextField label="To" type="date" size="small" value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 160 }} />
                {(filterFrom || filterTo) && (
                  <Button size="small" onClick={() => { setFilterFrom(""); setFilterTo(""); }}>Clear</Button>
                )}
              </Box>

              {/* Worklog bubbles */}
              <Stack spacing={1.5} className="message-list">
                {history.length ? history.map((entry) => (
                  <Box key={entry.id} className="bubble">
                    <Typography variant="body2">{entry.noteText}</Typography>
                    <Typography variant="caption" className="muted">
                      {new Date(entry.dateStamp).toLocaleString()} · <strong>{entry.currentStatus?.replace(/_/g, " ")}</strong>
                    </Typography>
                  </Box>
                )) : (
                  <Alert severity="info">No notes yet{filterFrom || filterTo ? " for this date range" : ""}.</Alert>
                )}
              </Stack>

              {/* Note form */}
              <Box component="form" className="chat-compose" onSubmit={submitNote}>
                <Typography variant="subtitle2">Add worklog note</Typography>
                <TextField
                  multiline minRows={3} label="What was done today"
                  value={noteText} onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Describe the work done…"
                />
                <TextField select label="Status" value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value)}>
                  {statusOptions.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                </TextField>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                  {statusOptions.map((s) => (
                    <Button key={s.value} variant="outlined" size="small"
                      color={s.value === "completed_today" ? "success" : s.value === "no_install" ? "error" : "primary"}
                      onClick={() => quickStatus(s.value)} disabled={busy}>
                      {s.label}
                    </Button>
                  ))}
                  <Button variant="contained" type="submit" disabled={busy || !noteText.trim()}>
                    {busy ? "Saving…" : "Save Note"}
                  </Button>
                </Stack>
              </Box>
            </>
          ) : (
            <Alert severity="warning">Select a job from the left.</Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
