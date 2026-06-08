import { useEffect, useState, useRef } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip,
  Stack, Typography,
} from "@mui/material";

// In-memory store for employee locations (keyed by userId)
// Employees post their location; manager/admin reads it
const LOCATION_KEY = "resq_employee_locations";

export function saveMyLocation(userId, name, coords) {
  try {
    const all = JSON.parse(localStorage.getItem(LOCATION_KEY) || "{}");
    all[userId] = {
      userId,
      name,
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: Math.round(coords.accuracy),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCATION_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export function getAllLocations() {
  try {
    return Object.values(JSON.parse(localStorage.getItem(LOCATION_KEY) || "{}"));
  } catch { return []; }
}

// ── Employee: auto-share location silently (no UI button) ────────────────────
export function useAutoLocation(userId, name) {
  const watchRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!userId || !navigator.geolocation) return;

    const doWatch = () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          // Only save if accuracy is ≤ 2000m
          if (pos.coords.accuracy <= 2000) {
            saveMyLocation(userId, name, pos.coords);
          }
        },
        () => { /* silent fail */ },
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
      );
    };

    doWatch();
    // Re-request every 1 hour
    intervalRef.current = setInterval(doWatch, 60 * 60 * 1000);

    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, name]);
}

// ── Manager/Admin view ───────────────────────────────────────────────────────
export default function LocationView({ store }) {
  const [locations, setLocations] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = () => {
    setLocations(getAllLocations());
    setLastRefresh(new Date());
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60 * 60 * 1000); // auto-refresh every 1 hour
    return () => clearInterval(t);
  }, []);

  const employees = (store.users || []).filter((u) => u.role === "employee");

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Card elevation={0}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Box>
              <Typography variant="h6" className="section-title">📍 Employee Locations</Typography>
              <Typography variant="body2" className="muted">
                Employees share location automatically. Only locations with accuracy ≤ 2000m are shown.
                Updates every 1 hour automatically.
              </Typography>
            </Box>
            <Button variant="outlined" size="small" onClick={refresh}>Refresh Now</Button>
          </Box>
          <Typography variant="caption" className="muted" sx={{ mb: 2, display: "block" }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>

          <Stack spacing={1.5} className="table-list">
            {employees.length === 0 && <Alert severity="info">No employees found.</Alert>}
            {employees.map((emp) => {
              const loc = locations.find((l) => l.userId === emp.id);
              return (
                <Box key={emp.id} className="table-row">
                  <Box>
                    <Typography variant="subtitle2">{emp.name}</Typography>
                    <Typography variant="body2" className="muted">{emp.department || "No department"}</Typography>
                    {loc ? (
                      <>
                        <Typography variant="body2">
                          Lat: <strong>{loc.lat.toFixed(5)}</strong> · Lng: <strong>{loc.lng.toFixed(5)}</strong>
                        </Typography>
                        <Typography variant="caption" className="muted">
                          Accuracy: ±{loc.accuracy}m · Updated: {new Date(loc.updatedAt).toLocaleString()}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open in Maps
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No location shared yet
                      </Typography>
                    )}
                  </Box>
                  <Box className="right-aligned">
                    <Chip
                      size="small"
                      label={loc ? `±${loc.accuracy}m` : "offline"}
                      color={loc ? (loc.accuracy <= 100 ? "success" : loc.accuracy <= 500 ? "warning" : "default") : "error"}
                    />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
