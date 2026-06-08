import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#030712 0%,#0f172a 40%,#1e293b 100%)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background Glow Effects */}
      <Box
        sx={{
          position: "fixed",
          top: -200,
          left: -200,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "#f59e0b22",
          filter: "blur(120px)",
          animation: "pulseGlow 8s ease infinite",
        }}
      />

      <Box
        sx={{
          position: "fixed",
          bottom: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "#ef444422",
          filter: "blur(150px)",
          animation: "pulseGlow 10s ease infinite",
        }}
      />

      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          background: "rgba(5,10,20,0.65)",
          backdropFilter: "blur(15px)",
          boxShadow: "none",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            maxWidth: "1400px",
            width: "100%",
            mx: "auto",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: "#fff",
              letterSpacing: 3,
            }}
          >
            RESQ
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button
              sx={{
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Home
            </Button>

            <Button
              variant="contained"
              onClick={() => navigate("/login")}
              sx={{
                background:
                  "linear-gradient(90deg,#f59e0b,#ef4444)",
                borderRadius: "12px",
                px: 3,
                fontWeight: 700,
                boxShadow:
                  "0 10px 30px rgba(245,158,11,.35)",
              }}
            >
              Login
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container
        maxWidth="xl"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          pt: 12,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          {/* Left Side */}
          <Box
            sx={{
              flex: 1,
              minWidth: 320,
              animation: "fadeUp 1s ease",
            }}
          >
            <Typography
              sx={{
                color: "#f59e0b",
                fontWeight: 800,
                letterSpacing: 2,
                mb: 2,
              }}
            >
              WELCOME TO RESQ
            </Typography>

            <Typography
              sx={{
                color: "#fff",
                fontWeight: 900,
                lineHeight: 1,
                fontSize: {
                  xs: "3rem",
                  md: "5.5rem",
                },
                mb: 3,
              }}
            >
              Best
              <br />
              Service Center
            </Typography>

            <Typography
              sx={{
                color: "rgba(255,255,255,.75)",
                fontSize: "1.15rem",
                lineHeight: 1.9,
                maxWidth: "650px",
                mb: 5,
              }}
            >
              RESQ is a powerful service management platform built
              for repair centers, technicians and support teams.
              Track jobs, manage customers, monitor technicians,
              communicate instantly and streamline your entire
              service workflow from a single dashboard.
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/login")}
                sx={{
                  background:
                    "linear-gradient(90deg,#f59e0b,#ef4444)",
                  px: 5,
                  py: 1.7,
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                Get Started
              </Button>

              <Button
                variant="outlined"
                size="large"
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,.25)",
                  px: 5,
                  py: 1.7,
                  borderRadius: "14px",
                }}
              >
                Learn More
              </Button>
            </Stack>
          </Box>

          {/* Right Side */}
          <Box
            sx={{
              flex: 1,
              minWidth: 350,
              position: "relative",
              height: 750,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Rotating Ring */}
            <Box
              sx={{
                position: "absolute",
                width: 650,
                height: 650,
                borderRadius: "50%",
                border:
                  "1px solid rgba(255,255,255,.08)",
                animation: "spin 30s linear infinite",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                width: 500,
                height: 500,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle,#f59e0b44,transparent)",
                filter: "blur(40px)",
                animation: "pulseGlow 6s ease infinite",
              }}
            />

            {/* Image 1 */}
            <Box
              component="img"
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9X9U1E5HdE4qwdioZeKVZFwkJrDUwTaLXsQ&s"
              sx={{
                width: 800,
                height: 200,
                borderRadius: "20%",
                objectFit: "cover",
                border: "px solid #f59e0b",
                position: "absolute",
                top: 0,
                left: 10,
                zIndex: 2,
                animation:
                  "floatOne 6s ease-in-out infinite",
                boxShadow:
                  "0 30px 80px rgba(245,158,11,.4)",
              }}
            />

            {/* Image 2 */}
            <Box
              component="img"
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgSIVa_c9SMY7Qbq7s-CWJbDkysD17ecRI6Q&s"
              sx={{
                width: 360,
                height: 360,
                borderRadius: "50%",
                objectFit: "cover",
                border: "8px solid #ef4444",
                position: "absolute",
                right: 10,
                bottom: 60,
                zIndex: 3,
                animation:
                  "floatTwo 7s ease-in-out infinite",
                boxShadow:
                  "0 30px 80px rgba(239,68,68,.4)",
              }}
            />

            {/* Floating Badge */}
            <Box
              sx={{
                position: "absolute",
                top: 20,
                right: 30,
                background:
                  "rgba(255,255,255,.08)",
                backdropFilter: "blur(20px)",
                border:
                  "1px solid rgba(255,255,255,.1)",
                borderRadius: "18px",
                px: 3,
                py: 2,
                color: "#fff",
                animation:
                  "floatOne 5s ease-in-out infinite",
              }}
            >
              ⭐ Trusted Service Center
            </Box>

            <Box
              sx={{
                position: "absolute",
                bottom: 10,
                left: 20,
                background:
                  "rgba(255,255,255,.08)",
                backdropFilter: "blur(20px)",
                border:
                  "1px solid rgba(255,255,255,.1)",
                borderRadius: "18px",
                px: 3,
                py: 2,
                color: "#fff",
                animation:
                  "floatTwo 6s ease-in-out infinite",
              }}
            >
              🚀 Fast Repair Solutions
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          borderTop:
            "1px solid rgba(255,255,255,.08)",
          py: 4,
          textAlign: "center",
          background: "#020617",
        }}
      >
        <Typography
          sx={{
            color: "rgba(255,255,255,.5)",
          }}
        >
          © 2026 RESQ Service Center Management System
        </Typography>
      </Box>

      {/* Animations */}
      <style>
        {`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes floatOne {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-30px);
            }
            100% {
              transform: translateY(0px);
            }
          }

          @keyframes floatTwo {
            0% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(25px);
            }
            100% {
              transform: translateY(0px);
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes pulseGlow {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.15);
            }
            100% {
              transform: scale(1);
            }
          }
        `}
      </style>
    </Box>
  );
}