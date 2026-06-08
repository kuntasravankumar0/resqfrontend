import { useEffect, useRef, useState, useMemo } from "react";
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip,
  MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { fetchChatMessages, sendChatMessage, roleColor, roleLabel } from "../services/localBackend";

export default function Messaging({ store, currentUser, onChange }) {
  const employees = useMemo(() => (store.users || []).filter((u) => u.role === "employee"), [store.users]);
  const admins = useMemo(() => (store.users || []).filter((u) => u.role === "admin"), [store.users]);
  const manager = useMemo(() => (store.users || []).find((u) => u.role === "manager"), [store.users]);

  // Determine selectable contacts based on role
  const contacts = useMemo(() => {
    if (currentUser.role === "manager") {
      return [...admins, ...employees];
    }
    if (currentUser.role === "admin") {
      return employees; // admin chats with employees via dropdown
    }
    // employee chats with admin + manager
    return [...admins, ...(manager ? [manager] : [])].filter((u) => u.id !== currentUser.id);
  }, [currentUser, admins, employees, manager]);

  const [selectedContactId, setSelectedContactId] = useState(() => contacts[0]?.id || "");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const selectedContact = contacts.find((c) => c.id === Number(selectedContactId)) || contacts[0] || null;

  const loadMessages = async () => {
    if (!selectedContact) return;
    try {
      const msgs = await fetchChatMessages(currentUser.id, selectedContact.id);
      setMessages(msgs);
    } catch {
      // fallback to store snapshot
      const id = [currentUser.id, selectedContact.id].sort().join(":");
      const conv = (store.chats || []).find((c) => c.id === id);
      setMessages(conv?.messages || []);
    }
  };

  useEffect(() => {
    loadMessages();
    // Poll every 5 seconds for new messages
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedContact?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedContact) return;
    setBusy(true);
    setError("");
    try {
      await sendChatMessage({ senderId: currentUser.id, recipientId: selectedContact.id, text: text.trim() });
      setText("");
      await loadMessages();
      await onChange?.();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Failed to send.");
    } finally {
      setBusy(false);
    }
  };

  if (contacts.length === 0) {
    return <Alert severity="info">No contacts available to chat with yet.</Alert>;
  }

  return (
    <Card elevation={0} className="chat-shell">
      <CardContent className="chat-layout" sx={{ padding: "0 !important" }}>
        {/* Sidebar */}
        <Box className="chat-sidebar">
          <Typography variant="h6" className="section-title" sx={{ mb: 1 }}>
            {currentUser.role === "admin" ? "Chat with Technicians" : "Messages"}
          </Typography>

          {/* Admin: dropdown to select employee */}
          {currentUser.role === "admin" ? (
            <TextField
              select
              fullWidth
              size="small"
              label="Select technician"
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              sx={{ mb: 1 }}
            >
              {contacts.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Stack spacing={1}>
              {contacts.map((c) => {
                const isSelected = c.id === Number(selectedContactId);
                const convId = [currentUser.id, c.id].sort().join(":");
                const conv = (store.chats || []).find((ch) => ch.id === convId);
                const lastMsg = conv?.messages?.slice(-1)[0];
                return (
                  <Box
                    key={c.id}
                    className={`job-card${isSelected ? " selected" : ""}`}
                    onClick={() => setSelectedContactId(c.id)}
                    role="button" tabIndex={0}
                    onKeyDown={(ev) => ev.key === "Enter" && setSelectedContactId(c.id)}
                  >
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: "#6366f1", fontSize: 14 }}>
                        {c.name.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>{c.name}</Typography>
                        <Chip size="small" label={roleLabel(c.role)} color={roleColor(c.role)} sx={{ height: 18, fontSize: "0.68rem" }} />
                        {lastMsg && (
                          <Typography variant="caption" className="muted" noWrap sx={{ display: "block" }}>
                            {lastMsg.text.slice(0, 30)}{lastMsg.text.length > 30 ? "…" : ""}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* Thread */}
        <Box className="chat-thread">
          {selectedContact ? (
            <>
              <Box className="chat-header">
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: "#6366f1" }}>
                    {selectedContact.name.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{selectedContact.name}</Typography>
                    <Typography variant="caption" className="muted">{roleLabel(selectedContact.role)} · {selectedContact.department || "No dept"}</Typography>
                  </Box>
                </Box>
              </Box>

              {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}

              {/* Message thread */}
              <Stack spacing={1.5} className="message-list">
                {messages.length === 0 && (
                  <Alert severity="info">No messages yet. Start the conversation.</Alert>
                )}
                {messages.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <Box key={msg.id} sx={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                      <Box className={`bubble${isMine ? " mine" : ""}`}>
                        <Typography variant="body2">{msg.text}</Typography>
                        <Typography variant="caption" className="muted">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
                <div ref={bottomRef} />
              </Stack>

              {/* Compose */}
              <Box component="form" onSubmit={send} sx={{ display: "flex", gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={`Message ${selectedContact.name}…`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
                />
                <Button type="submit" variant="contained" disabled={busy || !text.trim()} sx={{ px: 3 }}>
                  {busy ? "…" : "Send"}
                </Button>
              </Box>
            </>
          ) : (
            <Alert severity="info">Select a contact to start chatting.</Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
