import React from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, Button, Avatar } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import PolicyIcon from "@mui/icons-material/Policy";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate, useLocation } from "react-router-dom";

const WIDTH = 220;
const NAV = [
  { label: "Dashboard", icon: <DashboardIcon />, path: "/" },
  { label: "Workers", icon: <PeopleIcon />, path: "/workers" },
  { label: "Policies", icon: <PolicyIcon />, path: "/policies" },
  { label: "Claims", icon: <AssignmentIcon />, path: "/claims" },
  { label: "Payouts", icon: <AccountBalanceWalletIcon />, path: "/payouts" },
];

export default function Sidebar({ username, onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <Drawer variant="permanent" sx={{ width: WIDTH, flexShrink: 0,
      "& .MuiDrawer-paper": { width: WIDTH, bgcolor: "#FFFFFF", borderRight: "1px solid #E8ECF0" }}}>
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Typography variant="h6" fontWeight={700} color="primary">GigKavach</Typography>
        <Typography variant="caption" color="text.secondary">Admin Dashboard</Typography>
      </Box>
      <Divider />

      <Box sx={{ px: 1.5, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: "#1976D2", fontSize: "0.85rem" }}>
          {(username || "A")[0].toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={600}>{username || "Admin"}</Typography>
          <Typography variant="caption" color="text.secondary">Administrator</Typography>
        </Box>
      </Box>
      <Divider />

      <List dense sx={{ px: 1, mt: 1 }}>
        {NAV.map(item => {
          const active = pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton onClick={() => navigate(item.path)} sx={{
                borderRadius: 1.5,
                bgcolor: active ? "#E3F2FD" : "transparent",
                color: active ? "#1976D2" : "text.secondary",
                "&:hover": { bgcolor: active ? "#E3F2FD" : "#F5F7FA" },
              }}>
                <ListItemIcon sx={{ color: active ? "#1976D2" : "#9E9E9E", minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{
                  fontSize: "0.875rem", fontWeight: active ? 600 : 400,
                  color: active ? "#1976D2" : "#555770"
                }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: "auto", p: 2 }}>
        <Button fullWidth variant="outlined" size="small" startIcon={<LogoutIcon />}
          onClick={onLogout} color="inherit" sx={{ color: "#757575", borderColor: "#E0E0E0" }}>
          Logout
        </Button>
      </Box>
    </Drawer>
  );
}
