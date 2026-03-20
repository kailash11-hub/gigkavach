
import React, { useState, useEffect } from "react";
import { ThemeProvider, CssBaseline, Box, Button, AppBar, Toolbar,
  Typography, Tabs, Tab, Avatar, Chip } from "@mui/material";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import theme from "./theme";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages/Workers";
import Policies from "./pages/Policies";
import Claims from "./pages/Claims";
import Payouts from "./pages/Payouts";
import Landing from "./pages/worker/Landing";
import PremiumCalculator from "./pages/worker/PremiumCalculator";
import BuyPolicy from "./pages/worker/BuyPolicy";
import FileClaim from "./pages/worker/FileClaim";
import TrackStatus from "./pages/worker/TrackStatus";
const API = "https://gigkavach-1.onrender.com";


const WORKER_TABS = [
  { label:"Home", value:"home" },
  { label:"Calculator", value:"calculator" },
  { label:"Buy Policy", value:"buy-policy" },
  { label:"File Claim", value:"file-claim" },
  { label:"Track", value:"track" },
];

function WorkerApp({ authData, onLogout }) {
  const [tab, setTab] = useState("home");
  const worker = authData.worker || JSON.parse(localStorage.getItem("gs_worker")||"null");

  return (
    <Box sx={{ bgcolor:"#F5F7FA", minHeight:"100vh" }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor:"white", borderBottom:"1px solid #E8ECF0" }}>
        <Toolbar sx={{ gap:2, minHeight:"56px!important" }}>
          <Typography variant="h6" fontWeight={700} color="primary" sx={{ flexShrink:0 }}>GigKavach</Typography>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ flexGrow:1, "& .MuiTab-root":{ fontSize:"0.82rem", minHeight:56, textTransform:"none", fontWeight:500 } }}>
            {WORKER_TABS.map(t => <Tab key={t.value} label={t.label} value={t.value} />)}
          </Tabs>
          <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
            {worker && <Chip label={worker.name?.split(" ")[0]} size="small" color="primary" variant="outlined" />}
            <Button size="small" startIcon={<LogoutIcon fontSize="small"/>} onClick={onLogout}
              sx={{ color:"#757575", textTransform:"none" }}>Logout</Button>
          </Box>
        </Toolbar>
      </AppBar>

      {tab==="home" && <Landing onGetStarted={() => setTab("calculator")} />}
      {tab==="calculator" && <PremiumCalculator />}
      {tab==="buy-policy" && <BuyPolicy worker={worker} onComplete={() => setTab("track")} />}
      {tab==="file-claim" && <FileClaim worker={worker} />}
      {tab==="track" && <TrackStatus worker={worker} />}
    </Box>
  );
}

function AdminApp({ authData, onLogout }) {
  return (
    <BrowserRouter>
      <Box display="flex" minHeight="100vh">
        <Sidebar username={authData.username} onLogout={onLogout} />
        <Box component="main" flexGrow={1} p={3} sx={{ bgcolor:"#F5F7FA", overflowY:"auto" }}>
          <Routes>
            <Route path="/*" element={<Dashboard />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/claims" element={<Claims />} />
            <Route path="/payouts" element={<Payouts />} />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default function App() {
  const [authData, setAuthData] = useState(null);

  useEffect(() => {
   fetch(`${API}/health`)
  .then(res => res.json())
  .then(data => console.log(data));
  }, []);

  const handleAuth = (data) => setAuthData(data);
  const handleLogout = () => { localStorage.clear(); setAuthData(null); };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!authData && <LoginPage onAuth={handleAuth} />}
      {authData?.role==="worker" && <WorkerApp authData={authData} onLogout={handleLogout} />}
      {authData?.role==="admin" && <AdminApp authData={authData} onLogout={handleLogout} />}
    </ThemeProvider>
  );
}
