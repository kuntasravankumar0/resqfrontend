import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip,
  CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import {
  deleteJob, fetchGoogleSheetFromUrl, getAllowedJobs,
  importSheetRows, roleLabel, updateJob,
} from "../services/localBackend";

const priorityColor = { high: "error", medium: "warning", low: "default" };
const priorityLabel = { high: "Express", medium: "Medium", low: "Low" };
const statusColor = { completed_today: "success", tomorrow: "info", pending: "default", no_install: "error", customer_next_day: "warning" };

export default function DataCenter({ store, currentUser, onChange }) {
  // ── Sheet fetch state ──────────────────────────────────────────────────────
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState("");
  const [sheetHeaders, setSheetHeaders] = useState([]);     // column names from sheet
  const [sheetRows, setSheetRows] = useState([]);           // raw rows from sheet
  const [filterCol, setFilterCol] = useState("");           // which column to search
  const [filterValue, setFilterValue] = useState("");       // value to search in that column
  const [matchedRows, setMatchedRows] = useState([]);       // rows that matched
  const [sendEmployeeId, setSendEmployeeId] = useState(""); // employee to assign matched rows

  // ── Search board state ─────────────────────────────────────────────────────
  const [searchQ, setSearchQ] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ── Edit / delete ──────────────────────────────────────────────────────────
  const [editJob, setEditJob] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editBusy, setEditBusy] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const employees = useMemo(() => (store.users || []).filter((u) => u.role === "employee"), [store.users]);

  const filteredJobs = useMemo(() => {
    return getAllowedJobs(store, currentUser).filter((job) => {
      if (searchQ) {
        const q = searchQ.toLowerCase();
        if (!job.serviceNumber.toLowerCase().includes(q) &&
            !(job.customerDetails?.name || "").toLowerCase().includes(q) &&
            !(job.customerDetails?.phone || "").includes(q)) return false;
      }
      if (fromDate && new Date(job.createdAt) < new Date(fromDate)) return false;
      if (toDate) {
        const end = new Date(toDate); end.setHours(23, 59, 59, 999);
        if (new Date(job.createdAt) > end) return false;
      }
      return true;
    });
  }, [currentUser, fromDate, searchQ, store, toDate]);

  // ── Load sheet ─────────────────────────────────────────────────────────────
  const loadSheet = async () => {
    if (!googleSheetUrl.trim()) return;
    setSheetLoading(true);
    setSheetError(""); setSheetHeaders([]); setSheetRows([]); setMatchedRows([]);
    try {
      const data = await fetchGoogleSheetFromUrl(googleSheetUrl.trim());
      if (!data.headers?.length) { setSheetError("Sheet loaded but no header row found."); return; }
      setSheetHeaders(data.headers);
      setSheetRows(data.rows || []);
      setFilterCol(data.headers[0] || "");
      setMessage(`Sheet loaded: ${data.rows.length} rows, ${data.headers.length} columns.`);
    } catch (err) {
      setSheetError(err?.response?.data?.detail || err.message || "Failed to load sheet.");
    } finally {
      setSheetLoading(false);
    }
  };

  // ── Filter rows by column+value ────────────────────────────────────────────
  const applyFilter = () => {
    if (!filterCol || !filterValue.trim()) {
      setMatchedRows(sheetRows);
      return;
    }
    const q = filterValue.trim().toLowerCase();
    const matched = sheetRows.filter((row) => String(row[filterCol] || "").toLowerCase().includes(q));
    setMatchedRows(matched);
    if (matched.length === 0) setSheetError("No rows matched. Try a different column or value.");
    else setSheetError("");
  };

  // ── Send matched rows to employee ──────────────────────────────────────────
  const sendToEmployee = async () => {
    if (!sendEmployeeId || matchedRows.length === 0) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const rows = matchedRows.map((row, i) => {
        // auto-detect fields from any column names
        const get = (...keys) => {
          for (const k of keys) {
            const found = Object.entries(row).find(([key]) => key.toLowerCase().replace(/\s/g, "_") === k);
            if (found) return found[1];
          }
          return "";
        };
        return {
          serviceNumber: get("service_number", "servicenumber", "job_no", "id", "job_number") || `SV-SHEET-${i + 1}`,
          customerName: get("customer_name", "name", "customer", "client") || "Unknown",
          customerPhone: get("phone", "mobile", "contact", "customer_phone") || "",
          customerEmail: get("email", "customer_email") || "",
          googleSheetRowId: String(row._row || i + 2),
          assignedTo: Number(sendEmployeeId),
          priority: "medium",
          currentStatus: "pending",
        };
      });
      const result = await importSheetRows({ googleSheetUrl, rows });
      setMessage(`Sent ${matchedRows.length} rows to employee. Created: ${result.created}, Updated: ${result.updated}.`);
      setMatchedRows([]);
      await onChange?.();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Send failed.");
    } finally {
      setBusy(false);
    }
  };

  // ── Edit job ────────────────────────────────────────────────────────────────
  const openEdit = (job) => {
    setEditJob(job);
    setEditForm({
      serviceNumber: job.serviceNumber, customerName: job.customerDetails?.name || "",
      customerPhone: job.customerDetails?.phone || "", customerEmail: job.customerDetails?.email || "",
      assignedTo: job.assignedTo || "", priority: job.priority, currentStatus: job.currentStatus,
    });
  };
  const saveEdit = async () => {
    if (!editJob) return;
    setEditBusy(true);
    try {
      await updateJob(editJob.id, { ...editForm, assignedTo: editForm.assignedTo ? Number(editForm.assignedTo) : null });
      setEditJob(null); setMessage("Job updated."); await onChange?.();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Update failed."); setEditJob(null);
    } finally { setEditBusy(false); }
  };
  const handleDelete = async (jobId) => {
    if (!window.confirm("Delete this service job?")) return;
    try {
      await deleteJob(jobId); setMessage("Job deleted."); await onChange?.();
    } catch (err) { setError(err?.response?.data?.detail || err.message || "Delete failed."); }
  };

  if (currentUser.role === "employee") {
    return <Alert severity="warning">This section is for Admin and Manager only.</Alert>;
  }

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>}

      {/* ── Google Sheet Workflow ── */}
      <Card elevation={0}>
        <CardContent>
          <Typography variant="h6" className="section-title">Google Sheet Import</Typography>
          <Typography variant="body2" className="muted" sx={{ mb: 2 }}>
            Paste a public Google Sheet URL → Load it → Select a column and enter a value to filter rows →
            Pick an employee → Send. The system auto-detects column names regardless of sheet size.
          </Typography>

          {/* Step 1: Load sheet */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Step 1 — Load Sheet</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              fullWidth size="small" label="Google Sheet URL"
              value={googleSheetUrl} onChange={(e) => setGoogleSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
            />
            <Button variant="outlined" onClick={loadSheet}
              disabled={sheetLoading || !googleSheetUrl.trim()} sx={{ minWidth: 130 }}>
              {sheetLoading ? <CircularProgress size={18} /> : "Load Sheet"}
            </Button>
          </Stack>
          {sheetError && <Alert severity="error" sx={{ mb: 2 }}>{sheetError}</Alert>}
          {sheetHeaders.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>{sheetRows.length} rows</strong> · Columns: {sheetHeaders.join(", ")}
            </Alert>
          )}

          {/* Step 2: Filter by column+value */}
          {sheetHeaders.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Step 2 — Filter Rows (optional)</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
                <TextField
                  select size="small" label="Column to search" value={filterCol}
                  onChange={(e) => setFilterCol(e.target.value)} sx={{ minWidth: 200 }}>
                  {sheetHeaders.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                </TextField>
                <TextField
                  size="small" label="Value to match" value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder="e.g. a customer name or job ID"
                />
                <Button variant="outlined" onClick={applyFilter}>Filter</Button>
                <Button variant="text" onClick={() => { setMatchedRows(sheetRows); setFilterValue(""); }}>
                  Show All
                </Button>
              </Stack>

              {matchedRows.length > 0 && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {matchedRows.length} row{matchedRows.length !== 1 ? "s" : ""} selected
                </Alert>
              )}

              {/* Preview matched rows */}
              {matchedRows.length > 0 && (
                <Box sx={{ overflowX: "auto", mb: 2 }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.82rem" }}>
                    <thead>
                      <tr>{sheetHeaders.map((h) => (
                        <th key={h} style={{ padding: "6px 10px", borderBottom: "1px solid #e2e8f0", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {matchedRows.slice(0, 20).map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                          {sheetHeaders.map((h) => (
                            <td key={h} style={{ padding: "5px 10px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                              {String(row[h] || "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {matchedRows.length > 20 && (
                    <Typography variant="caption" className="muted" sx={{ mt: 1, display: "block" }}>
                      Showing first 20 of {matchedRows.length} rows.
                    </Typography>
                  )}
                </Box>
              )}

              {/* Step 3: Assign & Send */}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Step 3 — Assign to Employee & Send</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
                <TextField
                  select size="small" label="Assign to technician"
                  value={sendEmployeeId} onChange={(e) => setSendEmployeeId(e.target.value)} sx={{ minWidth: 220 }}>
                  <MenuItem value="">Select employee</MenuItem>
                  {employees.map((emp) => <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>)}
                </TextField>
                <Button
                  variant="contained" disabled={busy || !sendEmployeeId || matchedRows.length === 0}
                  onClick={sendToEmployee}>
                  {busy ? "Sending…" : `Send ${matchedRows.length} Row${matchedRows.length !== 1 ? "s" : ""} →`}
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Search Board ── */}
      <Card elevation={0}>
        <CardContent>
          <Typography variant="h6" className="section-title">Search Board</Typography>
          <Typography variant="body2" className="muted" sx={{ mb: 2 }}>
            Search any service job by number, customer name, or phone. Filter by date.
            {currentUser.role === "manager" ? " Managers can edit or delete." : ""}
          </Typography>

          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              size="small" label="Search by service #, customer name or phone"
              value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              placeholder="e.g. SV-10001 or Jordan or +1 555…"
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="From" type="date" size="small" value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="To" type="date" size="small" value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} />
              {(fromDate || toDate) && (
                <Button size="small" onClick={() => { setFromDate(""); setToDate(""); }}>Clear dates</Button>
              )}
            </Stack>
          </Stack>

          <Typography variant="caption" className="muted" sx={{ mb: 1, display: "block" }}>
            {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
          </Typography>

          <Stack spacing={1.5} className="table-list">
            {filteredJobs.length === 0 && <Alert severity="info">No jobs match the current filters.</Alert>}
            {filteredJobs.map((job) => {
              const assignee = (store.users || []).find((u) => u.id === job.assignedTo);
              return (
                <Box key={job.id} className="table-row">
                  <Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5, flexWrap: "wrap" }}>
                      <Typography variant="subtitle2">{job.serviceNumber}</Typography>
                      <Chip size="small" label={priorityLabel[job.priority] || job.priority} color={priorityColor[job.priority] || "default"} />
                      <Chip size="small" label={job.currentStatus.replace(/_/g, " ")} color={statusColor[job.currentStatus] || "default"} />
                    </Box>
                    <Typography variant="body2">
                      {job.customerDetails?.name}{job.customerDetails?.phone ? ` · ${job.customerDetails.phone}` : ""}
                    </Typography>
                    <Typography variant="body2" className="muted">
                      Assigned: {assignee ? `${assignee.name} (${roleLabel(assignee.role)})` : "Unassigned"}
                      {" · "}Row: {job.googleSheetRowId || "N/A"}
                      {" · "}{new Date(job.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {currentUser.role === "manager" && (
                    <Stack direction="row" spacing={0.5} sx={{ alignSelf: "center" }}>
                      <Button size="small" variant="outlined" onClick={() => openEdit(job)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleDelete(job.id)}>Delete</Button>
                    </Stack>
                  )}
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      {/* ── Edit Job Dialog ── */}
      <Dialog open={!!editJob} onClose={() => setEditJob(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Job #{editForm.serviceNumber}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Service #" value={editForm.serviceNumber || ""} onChange={(e) => setEditForm((f) => ({ ...f, serviceNumber: e.target.value }))} required />
            <TextField label="Customer name" value={editForm.customerName || ""} onChange={(e) => setEditForm((f) => ({ ...f, customerName: e.target.value }))} required />
            <TextField label="Phone" value={editForm.customerPhone || ""} onChange={(e) => setEditForm((f) => ({ ...f, customerPhone: e.target.value }))} />
            <TextField label="Email" value={editForm.customerEmail || ""} onChange={(e) => setEditForm((f) => ({ ...f, customerEmail: e.target.value }))} />
            <TextField select label="Assign to" value={editForm.assignedTo || ""} onChange={(e) => setEditForm((f) => ({ ...f, assignedTo: e.target.value }))}>
              <MenuItem value="">Unassigned</MenuItem>
              {employees.map((emp) => <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>)}
            </TextField>
            <TextField select label="Priority" value={editForm.priority || "medium"} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">Express</MenuItem>
            </TextField>
            <TextField select label="Status" value={editForm.currentStatus || "pending"} onChange={(e) => setEditForm((f) => ({ ...f, currentStatus: e.target.value }))}>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="completed_today">Completed Today</MenuItem>
              <MenuItem value="tomorrow">Tomorrow</MenuItem>
              <MenuItem value="no_install">No Install</MenuItem>
              <MenuItem value="customer_next_day">Customer Next Day</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditJob(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit} disabled={editBusy}>{editBusy ? "Saving…" : "Save"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
