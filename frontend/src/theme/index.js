import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976D2", light: "#42A5F5", dark: "#1565C0" },
    secondary: { main: "#0288D1", light: "#29B6F6", dark: "#01579B" },
    background: { default: "#F5F7FA", paper: "#FFFFFF" },
    error: { main: "#D32F2F" },
    success: { main: "#2E7D32" },
    warning: { main: "#ED6C02" },
    text: { primary: "#1A1A2E", secondary: "#555770" },
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          border: "1px solid #E8ECF0",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
        containedPrimary: {
          background: "#1976D2",
          "&:hover": { background: "#1565C0" },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { "& .MuiTableCell-root": { backgroundColor: "#F5F7FA", fontWeight: 600, color: "#555770" } },
      },
    },
  },
});

export default theme;
