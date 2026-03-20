import React, { useState } from "react";
import {
  Box, Typography, TextField, Button, Card, CardContent,
  Tab, Tabs, CircularProgress, Alert, InputAdornment, IconButton, Chip
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [tab, setTab] = useState(0); // 0=worker, 1=admin
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = tab === 1;

  const handleLogin = async () => {
    if (!form.username || !form.password) { setError("Please fill all fields."); return; }
    setLoading(true); setError("");
    try {
      const data = await login(form.username, form.password);
      // Role guard
      if (isAdmin && data.role !== "admin") {
        setError("This account is not an admin. Please use the Worker login tab.");
        localStorage.removeItem("gs_token"); localStorage.removeItem("gs_user");
        setLoading(false); return;
      }
      if (!isAdmin && data.role === "admin") {
        setError("This is an admin account. Please use the Admin login tab.");
        localStorage.removeItem("gs_token"); localStorage.removeItem("gs_user");
        setLoading(false); return;
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Invalid username or password.");
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{
      minHeight: "100vh", background: "#080F1E",
      display: "flex", alignItems: "center", justifyContent: "center",
      p: 2,
    }}>
      <Box width="100%" maxWidth={420}>
        {/* Logo */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" fontWeight={800} sx={{
            background: "linear-gradient(135deg, #F5A623, #FFD07A)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>GigShield</Typography>
          <Typography variant="body2" color="text.secondary">
            AI-Powered Parametric Insurance
          </Typography>
          <Chip label="Guidewire DEVTrails 2026" size="small" sx={{
            mt: 1, bgcolor: "rgba(245,166,35,0.1)", color: "#F5A623",
            border: "1px solid rgba(245,166,35,0.25)", fontWeight: 600
          }} />
        </Box>

        <Card>
          <CardContent sx={{ p: 3 }}>
            {/* Role Tabs */}
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(""); }}
              sx={{
                mb: 3,
                "& .MuiTabs-indicator": { bgcolor: "#F5A623" },
                "& .MuiTab-root": { color: "#8A9BB5", fontWeight: 600 },
                "& .Mui-selected": { color: "#F5A623 !important" },
              }}>
              <Tab icon={<TwoWheelerIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Worker Login" sx={{ flex: 1 }} />
              <Tab icon={<AdminPanelSettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Admin Login" sx={{ flex: 1 }} />
            </Tabs>

            {/* Info banner */}
            <Box sx={{
              p: 1.5, mb: 2.5, borderRadius: 2,
              bgcolor: isAdmin ? "rgba(123,108,246,0.08)" : "rgba(0,201,177,0.08)",
              border: `1px solid ${isAdmin ? "rgba(123,108,246,0.2)" : "rgba(0,201,177,0.2)"}`,
            }}>
              <Typography variant="caption" sx={{ color: isAdmin ? "#7B6CF6" : "#00C9B1", fontWeight: 600 }}>
                {isAdmin
                  ? "🔐 Admin Portal — Full platform access, analytics & fraud monitoring"
                  : "🛵 Worker Portal — Manage your policies, claims & payouts"}
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
              fullWidth label={isAdmin ? "Admin Username" : "Worker Username"}
              value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              size="small" sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 18, color: "#8A9BB5" }} /></InputAdornment>
              }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <TextField
              fullWidth label="Password" type={showPass ? "text" : "password"}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              size="small" sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 18, color: "#8A9BB5" }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPass(s => !s)} sx={{ color: "#8A9BB5" }}>
                      {showPass ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />

            <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={loading} sx={{ mb: 2 }}>
              {loading ? <CircularProgress size={22} /> : `Sign In as ${isAdmin ? "Admin" : "Worker"}`}
            </Button>

            {!isAdmin && (
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{" "}
                  <Button size="small" onClick={onSwitchToRegister}
                    sx={{ color: "#F5A623", fontWeight: 700, p: 0, minWidth: 0, textTransform: "none", fontSize: "0.875rem" }}>
                    Register here
                  </Button>
                </Typography>
              </Box>
            )}

            {isAdmin && (
              <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Typography variant="caption" color="text.secondary" display="block" fontWeight={600} mb={0.5}>
                  Default Admin Credentials:
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Username: <strong style={{ color: "#F5A623" }}>admin</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Password: <strong style={{ color: "#F5A623" }}>admin123</strong>
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
