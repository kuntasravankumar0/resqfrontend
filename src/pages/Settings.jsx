import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { roleLabel } from "../services/localBackend";

export default function Settings({ currentUser }) {
  return (
    <Card elevation={0}>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5" className="section-title">
              Settings
            </Typography>
            <Typography variant="body2" className="muted">
              Account preferences and session information.
            </Typography>
          </Box>

          <Divider />

          <Typography variant="subtitle2">Current Session</Typography>
          <Box className="profile-grid">
            <Typography variant="subtitle2">Name</Typography>
            <Typography>{currentUser.name}</Typography>

            <Typography variant="subtitle2">Email</Typography>
            <Typography>{currentUser.email}</Typography>

            <Typography variant="subtitle2">Role</Typography>
            <Typography>{roleLabel(currentUser.role)}</Typography>

            <Typography variant="subtitle2">Department</Typography>
            <Typography>{currentUser.department || "N/A"}</Typography>
          </Box>

          <Divider />

          <Typography variant="body2" className="muted">
            Session is stored securely in your browser and cleared when you click Logout.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
