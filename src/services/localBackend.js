import { api, setToken } from "./api";

const SESSION_KEY = "employee-management-session-v2";

const emptyStore = {
  users: [],
  chats: [],
  sheetItems: [],
  serviceJobs: [],
  jobLogs: [],
  inventory: [],
  partRequests: [],
  webhookLogs: [],
  activities: [],
  managerMetrics: {
    pendingJobs: 0,
    completedToday: 0,
    scheduledTomorrow: 0,
    pendingPartRequests: 0,
    employeeMetrics: [],
    recentLogs: [],
  },
};

let storeSnapshot = emptyStore;

function readJson(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function cloneStore(store) {
  const next = { ...emptyStore, ...(store || {}) };
  next.sheetItems = next.sheetItems?.length ? next.sheetItems : next.serviceJobs || [];
  return next;
}

function now() {
  return new Date().toISOString();
}

function saveSession(user, accessToken, refreshToken) {
  const session = {
    userId: user.id,
    role: user.role,
    token: accessToken,
    refreshToken,
    loginAt: now(),
  };
  writeJson(SESSION_KEY, session);
  setToken(accessToken);
  return session;
}

function ensureSessionToken() {
  const session = readJson(SESSION_KEY);
  if (session?.token) {
    setToken(session.token);
  } else {
    setToken(null);
  }
}

export async function initStore() {
  ensureSessionToken();
  try {
    const response = await api.get("/api/state");
    storeSnapshot = cloneStore(response.data);
  } catch {
    storeSnapshot = cloneStore(emptyStore);
  }
  return storeSnapshot;
}

export function getStoreSnapshot() {
  return cloneStore(storeSnapshot);
}

export function getCurrentSession() {
  return readJson(SESSION_KEY);
}

export function loadSession() {
  const session = getCurrentSession();
  if (session?.token) {
    setToken(session.token);
  } else {
    setToken(null);
  }
  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  setToken(null);
}

export async function hashSecret(value) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoded = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return `sha256_${btoa(value)}`;
}

export function roleLabel(role) {
  return { admin: "Admin", manager: "Manager", employee: "Employee" }[role] || role;
}

export function roleColor(role) {
  return { admin: "warning", manager: "success", employee: "info" }[role] || "default";
}

export function getAllowedContacts(users, currentUser) {
  if (!currentUser) return [];
  return users.filter((user) => {
    if (user.id === currentUser.id) return false;
    if (currentUser.role === "employee") return user.role !== "employee";
    if (currentUser.role === "manager") return user.role === "admin" || user.role === "employee";
    return true;
  });
}

export function getAllowedJobs(store, currentUser) {
  const jobs = store.serviceJobs || [];
  if (!currentUser) return [];
  if (currentUser.role === "employee") {
    return jobs.filter((job) => job.assignedTo === currentUser.id);
  }
  return jobs;
}

export function getAssignedSheets(store, userId) {
  return (store.serviceJobs || store.sheetItems || []).filter((item) => item.assignedTo === userId);
}

export function getConversationMessages(store, currentUserId, otherUserId) {
  const conversationId = [currentUserId, otherUserId].sort().join(":");
  return store.chats.find((chat) => chat.id === conversationId)?.messages || [];
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function authenticateUser(email, password) {
  const response = await api.post("/api/auth/login", { email, password });
  const { access_token: accessToken, refresh_token: refreshToken, user } = response.data;
  saveSession(user, accessToken, refreshToken);
  return { user, session: getCurrentSession() };
}

export async function registerUser(payload) {
  const response = await api.post("/api/auth/register", { ...payload, role: "employee" });
  const { access_token: accessToken, refresh_token: refreshToken, user } = response.data;
  saveSession(user, accessToken, refreshToken);
  return user;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function createEmployee(payload) {
  const response = await api.post("/api/users", { ...payload, role: "employee" });
  return response.data;
}

export async function createAdmin(payload) {
  const response = await api.post("/api/users", { ...payload, role: "admin" });
  return response.data;
}

export async function updateUserProfile(userId, payload) {
  const response = await api.put(`/api/users/${userId}`, payload);
  return response.data;
}

export async function deleteUser(userId) {
  const response = await api.delete(`/api/users/${userId}`);
  return response.data;
}

// ── Chat messages ─────────────────────────────────────────────────────────────

export async function sendChatMessage({ senderId, recipientId, text }) {
  await api.post("/api/chat/messages", { senderId, recipientId, text });
}

export async function fetchChatMessages(currentUserId, otherUserId) {
  const response = await api.get("/api/chat/messages", {
    params: { currentUserId, otherUserId },
  });
  return response.data;
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

export async function fetchJobs(params = {}) {
  const response = await api.get("/api/jobs", { params });
  return response.data;
}

export async function searchJob(serviceNumber) {
  const response = await api.get(`/api/jobs/search/${encodeURIComponent(serviceNumber)}`);
  return response.data;
}

export async function importSheetRows({ googleSheetUrl, rows }) {
  const response = await api.post("/api/jobs/import-sheet", { googleSheetUrl, rows });
  return response.data;
}

export async function addJobNote(jobId, payload) {
  const response = await api.post(`/api/jobs/${jobId}/notes`, payload);
  return response.data;
}

export async function updateJobStatus(jobId, currentStatus) {
  const response = await api.patch(`/api/jobs/${jobId}/status`, { currentStatus });
  return response.data;
}

export async function updateJob(jobId, payload) {
  const response = await api.put(`/api/jobs/${jobId}`, payload);
  return response.data;
}

export async function deleteJob(jobId) {
  const response = await api.delete(`/api/jobs/${jobId}`);
  return response.data;
}

export async function requestPart(jobId, payload) {
  const response = await api.post(`/api/jobs/${jobId}/parts-request`, payload);
  return response.data;
}

export async function getJobHistory(jobId) {
  const response = await api.get(`/api/jobs/${jobId}/history`);
  return response.data;
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export async function getInventory() {
  const response = await api.get("/api/inventory");
  return response.data;
}

export async function createInventoryItem(payload) {
  const response = await api.post("/api/inventory", payload);
  return response.data;
}

export async function updateInventoryItem(itemId, payload) {
  const response = await api.put(`/api/inventory/${itemId}`, payload);
  return response.data;
}

export async function deleteInventoryItem(itemId) {
  const response = await api.delete(`/api/inventory/${itemId}`);
  return response.data;
}

// ── Manager approvals / metrics / webhooks ────────────────────────────────────

export async function getManagerApprovals() {
  const response = await api.get("/api/manager/approvals");
  return response.data;
}

export async function decideApproval(requestId, decision) {
  const response = await api.post(`/api/manager/approvals/${requestId}`, { decision });
  return response.data;
}

export async function getManagerMetrics() {
  const response = await api.get("/api/manager/metrics");
  return response.data;
}

export async function getWebhookLogs() {
  const response = await api.get("/api/manager/webhooks");
  return response.data;
}

// ── Google Sheet fetch via backend proxy ──────────────────────────────────────

export async function fetchGoogleSheetFromUrl(url) {
  const response = await api.post("/api/google-sheet/fetch", {
    url,
    apiKey: import.meta.env.VITE_SHEETS_API_KEY || "",
  });
  return response.data; // { headers, rows, spreadsheetId }
}

// ── Dashboard summary ─────────────────────────────────────────────────────────

export function getDashboardSummary(store, currentUser) {
  const metrics = store.managerMetrics || emptyStore.managerMetrics;
  const jobs = getAllowedJobs(store, currentUser);
  const assigned = jobs.filter((job) => job.assignedTo === currentUser?.id);
  return {
    totalUsers: store.users.length,
    admins: store.users.filter((u) => u.role === "admin").length,
    managers: store.users.filter((u) => u.role === "manager").length,
    employees: store.users.filter((u) => u.role === "employee").length,
    jobs: store.serviceJobs.length,
    pendingJobs: metrics.pendingJobs,
    completedToday: metrics.completedToday,
    scheduledTomorrow: metrics.scheduledTomorrow,
    pendingPartRequests: metrics.pendingPartRequests,
    assignedToCurrent: assigned.length,
    completedForCurrent: assigned.filter((item) => item.currentStatus === "completed_today").length,
  };
}

export function formatHash(input) {
  if (!input) return "";
  return `${input.slice(0, 12)}...${input.slice(-12)}`;
}

export function describeUser(user) {
  if (!user) return "Unknown";
  return `${user.name} (${roleLabel(user.role)})`;
}
