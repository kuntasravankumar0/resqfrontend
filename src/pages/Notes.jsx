import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip,
  Stack, TextField, Typography,
} from "@mui/material";
import { getAllowedJobs, roleLabel } from "../services/localBackend";

const statusColor = {
  completed_today: "success", tomorrow: "info", pending: "default",
  no_install: "error", customer_next_day: "warning",
};

export default function Notes({ store, currentUser }) {
  const today = new Date().toISOString().slice(0, 10);
  const [filterDate, setFilterDate] = useState(today);
  const [filterEmployee, setFilterEmployee] = useState("all");

  const isManager = currentUser.role === "manager";
  const isAdmin = currentUser.role === "admin";
  const canSeeAll = isManager || isAdmin;

  const employees = useMemo(
    () => (store.users || []).filter((u) => u.role === "employee"),
    [store.users]
  );

  const jobs = useMemo(
    () => getAllowedJobs(store, currentUser),
    [store, currentUser]
  );

  // Gather all logs and enrich with job + employee info
  const allNotes = useMemo(() => {
    const logs = store.jobLogs || [];
    return logs
      .filter((log) => {
        const dateMatch = filterDate ? log.dateStamp?.slice(0, 10) === filterDate : true;
        const empMatch = filterEmployee === "all" || String(log.employeeId) === String(filterEmployee);
        const jobExists = jobs.some((j) => j.id === log.jobId);
        return dateMatch && empMatch && jobExists;
      })
      .map((log) => {
        const job = jobs.find((j) => j.id === log.jobId);
        const emp = (store.users || []).find((u) => u.id === log.employeeId);
        return { ...log, job, emp };
      })
      .sort((a, b) => new Date(b.dateStamp) - new Date(a.dateStamp));
  }, [store.jobLogs, filterDate, filterEmployee, jobs, store.users]);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Card elevation={0}>
        <CardContent>
          <Typography variant="h6" className="section-title" sx={{ mb: 0.5 }}>
            Daily Worklog Notes
          </Typography>
          <Typography variant="body2" className="muted" sx={{ mb: 2 }}>
            All notes saved by employees, day by day. Default shows today.
          </Typography>

          {/* Filters */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap">
            <TextField
              type="date"
              label="Date"
              size="small"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 180 }}
            />
            {canSeeAll && (
              <TextField
                select
                label="Employee"
                size="small"
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                sx={{ width: 220 }}
                SelectProps={{ native: false }}
              >
                <option value="all" style={{ padding: "8px 16px", display: "block" }}>All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} style={{ padding: "8px 16px", display: "block" }}>
                    {emp.name}
                  </option>
                ))}
              </TextField>
            )}
            {(filterDate !== today || filterEmployee !== "all") && (
              <Button size="small" onClick={() => { setFilterDate(today); setFilterEmployee("all"); }}>
                Reset
              </Button>
            )}
          </Stack>

          <Typography variant="caption" className="muted" sx={{ mb: 1, display: "block" }}>
            {allNotes.length} note{allNotes.length !== 1 ? "s" : ""} found
          </Typography>

          {allNotes.length === 0 ? (
            <Alert severity="info">No notes found for this date{filterEmployee !== "all" ? " / employee" : ""}.</Alert>
          ) : (
            <Stack spacing={1.5} className="table-list">
              {allNotes.map((note) => (
                <Box key={note.id} className="table-row">
                  <Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5, flexWrap: "wrap" }}>
                      <Typography variant="subtitle2">
                        {note.job?.serviceNumber || `Job #${note.jobId}`}
                      </Typography>
                      <Chip
                        size="small"
                        label={note.currentStatus?.replace(/_/g, " ") || "—"}
                        color={statusColor[note.currentStatus] || "default"}
                      />
                      {canSeeAll && note.emp && (
                        <Chip size="small" label={note.emp.name} variant="outlined" />
                      )}
                    </Box>
                    <Typography variant="body2">{note.noteText}</Typography>
                    <Typography variant="caption" className="muted">
                      {note.job?.customerDetails?.name || "Unknown customer"}
                      {note.job?.customerDetails?.phone ? ` · ${note.job.customerDetails.phone}` : ""}
                    </Typography>
                  </Box>
                  <Box className="right-aligned">
                    <Typography variant="caption" className="muted">
                      {new Date(note.dateStamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Typography>
                    <Typography variant="caption" className="muted" sx={{ display: "block" }}>
                      {new Date(note.dateStamp).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
