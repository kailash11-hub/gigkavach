import React, { useState } from "react";
import {
  Box, Typography, Button, TextField, Card, CardContent,
  CircularProgress, Alert, Divider, MenuItem, Grid,
  InputAdornment, IconButton, Tabs, Tab, Stepper, Step, StepLabel, Chip
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeIcon from "@mui/icons-material/Badge";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { authAPI } from "../services/api";

const PERSONAS = [
  { value: "food_delivery",    label: "Food Delivery (Zomato/Swiggy)" },
  { value: "quick_commerce",   label: "Quick Commerce (Zepto/Blinkit)" },
  { value: "package_delivery", label: "Package Delivery (Amazon/Dunzo)" },
  { value: "rideshare_uber",   label: "Rideshare - Uber" },
  { value: "rideshare_ola",    label: "Rideshare - Ola" },
];
const PLATFORMS = {
  food_delivery:    ["Zomato","Swiggy"],
  quick_commerce:   ["Zepto","Blinkit","Swiggy Instamart"],
  package_delivery: ["Amazon Flex","Dunzo","Porter"],
  rideshare_uber:   ["Uber"],
  rideshare_ola:    ["Ola"],
};
const CITIES = ["Mumbai","Delhi","Bengaluru","Hyderabad","Chennai","Pune","Jaipur","Lucknow","Bhubaneswar","Patna","Kolkata","Ahmedabad"];
const ID_TYPES = ["Identity Card issued by Employer","Pay Slip","Bank Statement","Voter ID","Driving License","Passport"];

const REG_STEPS = ["Account Details", "Work Profile", "KYC Documents"];

// Validate Aadhaar (12 digits)
const validateAadhaar = (v) => /^\d{12}$/.test(v.replace(/\s/g,""));
// Validate eShram (14 chars: UW-XXXXXXXXXX-X)
const validateEShram = (v) => v.trim().length >= 12;

export default function LoginPage({ onAuth }) {
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState(0);
  const [regStep, setRegStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kycVerified, setKycVerified] = useState(false);
  const [kycVerifying, setKycVerifying] = useState(false);

  const [form, setForm] = useState({
    // Account
    username: "", password: "",
    // Work
    name: "", phone: "", email: "",
    city: "Bhubaneswar", city_tier: 2,
    persona: "food_delivery", platform: "Zomato",
    avg_weekly_income: 2500, experience_years: 1, active_hours_per_day: 8,
    // KYC
    aadhaar: "", eshram: "", id_type: "Identity Card issued by Employer",
    id_number: "", eshram_registered: "yes",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => {
      const u = { ...f, [name]: value };
      if (name === "persona") u.platform = PLATFORMS[value][0];
      if (name === "city") {
        const t1 = ["Mumbai","Delhi","Bengaluru","Hyderabad","Chennai","Kolkata","Ahmedabad"];
        u.city_tier = t1.includes(value) ? 1 : 2;
      }
      return u;
    });
    setKycVerified(false);
  };

  // Mock KYC verification
  const verifyKYC = async () => {
    setKycVerifying(true);
    setError("");
    await new Promise(r => setTimeout(r, 1500)); // simulate API call
    if (!validateAadhaar(form.aadhaar)) {
      setError("Invalid Aadhaar number. Must be 12 digits.");
      setKycVerifying(false); return;
    }
    if (form.eshram_registered === "yes" && !validateEShram(form.eshram)) {
      setError("Invalid eShram number. Please check and try again.");
      setKycVerifying(false); return;
    }
    if (!form.id_number.trim()) {
      setError("Please enter your ID/document number.");
      setKycVerifying(false); return;
    }
    setKycVerified(true);
    setKycVerifying(false);
  };

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      let r;
      if (tab === 0) {
        r = await authAPI.login({ username: form.username, password: form.password });
        if (role === "admin" && r.data.role !== "admin") { setError("This account does not have admin access."); return; }
        if (role === "worker" && r.data.role !== "worker") { setError("Please use Admin login for admin accounts."); return; }
      } else {
        if (!kycVerified) { setError("Please verify your KYC documents first."); setLoading(false); return; }
        r = await authAPI.register({
          username: form.username, password: form.password,
          email: form.email || undefined, name: form.name, phone: form.phone,
          city: form.city, city_tier: Number(form.city_tier),
          persona: form.persona, platform: form.platform,
          avg_weekly_income: Number(form.avg_weekly_income),
          experience_years: Number(form.experience_years),
          active_hours_per_day: Number(form.active_hours_per_day),
        });
      }
      const data = r.data;
      localStorage.setItem("gs_token", data.access_token);
      localStorage.setItem("gs_role", data.role);
      localStorage.setItem("gs_username", data.username);
      if (data.worker) localStorage.setItem("gs_worker", JSON.stringify(data.worker));
      onAuth(data);
    } catch (e) {
      setError(e.response?.data?.detail || "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  // Role selection screen
  if (!role) return (
    <Box sx={{ minHeight:"100vh", bgcolor:"#F5F7FA", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Box maxWidth={480} width="100%" px={3}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight={700} color="primary">GigKavach</Typography>
          <Typography color="text.secondary" mt={0.5}>AI-Powered Parametric Insurance</Typography>
          <Chip label="Guidewire DEVTrails 2026" size="small" color="primary" variant="outlined" sx={{ mt:1 }} />
        </Box>
        <Typography variant="h6" fontWeight={600} textAlign="center" mb={3}>Select your role to continue</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card onClick={() => setRole("worker")} sx={{
              cursor:"pointer", p:2, textAlign:"center", transition:"all 0.15s",
              "&:hover":{ borderColor:"#1976D2", boxShadow:"0 4px 16px rgba(25,118,210,0.15)" }
            }}>
              <LocalShippingIcon sx={{ fontSize:48, color:"#1976D2", mb:1 }} />
              <Typography fontWeight={600}>Gig Worker</Typography>
              <Typography variant="caption" color="text.secondary">Zomato · Uber · Zepto · Amazon</Typography>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card onClick={() => setRole("admin")} sx={{
              cursor:"pointer", p:2, textAlign:"center", transition:"all 0.15s",
              "&:hover":{ borderColor:"#1976D2", boxShadow:"0 4px 16px rgba(25,118,210,0.15)" }
            }}>
              <AdminPanelSettingsIcon sx={{ fontSize:48, color:"#0288D1", mb:1 }} />
              <Typography fontWeight={600}>Admin</Typography>
              <Typography variant="caption" color="text.secondary">Platform management</Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight:"100vh", bgcolor:"#F5F7FA", display:"flex", alignItems:"center", justifyContent:"center", px:2, py:4 }}>
      <Box width="100%" maxWidth={role==="worker" && tab===1 ? 600 : 420}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h5" fontWeight={700} color="primary">GigKavach</Typography>
          <Typography variant="body2" color="text.secondary">
            {role==="admin" ? "Admin Portal" : "Worker Portal"}
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p:3 }}>
            {role==="worker" && (
              <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(""); setRegStep(0); setKycVerified(false); }} sx={{ mb:2 }}>
                <Tab label="Sign In" />
                <Tab label="Register" />
              </Tabs>
            )}

            {role==="admin" && <Typography variant="h6" fontWeight={600} mb={2}>Admin Sign In</Typography>}

            {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}

            {/* ── SIGN IN ── */}
            {tab===0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Username" name="username" value={form.username} onChange={handleChange}
                    placeholder={role==="admin" ? "admin" : ""} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Password" name="password" value={form.password}
                    onChange={handleChange} type={showPass ? "text" : "password"}
                    placeholder={role==="admin" ? "admin123" : ""}
                    InputProps={{ endAdornment:(
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPass(s=>!s)}>
                          {showPass ? <VisibilityOffIcon fontSize="small"/> : <VisibilityIcon fontSize="small"/>}
                        </IconButton>
                      </InputAdornment>
                    )}} />
                </Grid>
                <Grid item xs={12}>
                  <Button fullWidth variant="contained" size="large" onClick={handleSubmit}
                    disabled={loading || !form.username || !form.password}>
                    {loading ? <CircularProgress size={20}/> : "Sign In"}
                  </Button>
                </Grid>
              </Grid>
            )}

            {/* ── REGISTER with KYC ── */}
            {tab===1 && role==="worker" && (
              <Box>
                <Stepper activeStep={regStep} sx={{ mb:3 }}>
                  {REG_STEPS.map(s => (
                    <Step key={s}>
                      <StepLabel sx={{
                        "& .MuiStepLabel-label":{ fontSize:"0.75rem" },
                        "& .MuiStepIcon-root.Mui-active":{ color:"#1976D2" },
                        "& .MuiStepIcon-root.Mui-completed":{ color:"#2E7D32" },
                      }}>{s}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Step 0 — Account */}
                {regStep===0 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Full Name" name="name" value={form.name} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth label="Phone Number" name="phone" value={form.phone} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth label="Email (optional)" name="email" value={form.email} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}><Divider /></Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Username" name="username" value={form.username} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Password" name="password" value={form.password}
                        onChange={handleChange} type={showPass?"text":"password"}
                        InputProps={{ endAdornment:(
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPass(s=>!s)}>
                              {showPass ? <VisibilityOffIcon fontSize="small"/> : <VisibilityIcon fontSize="small"/>}
                            </IconButton>
                          </InputAdornment>
                        )}} />
                    </Grid>
                    <Grid item xs={12}>
                      <Button fullWidth variant="contained" onClick={() => setRegStep(1)}
                        disabled={!form.name||!form.username||!form.password||!form.phone}>
                        Next — Work Profile →
                      </Button>
                    </Grid>
                  </Grid>
                )}

                {/* Step 1 — Work Profile */}
                {regStep===1 && (
                  <Grid container spacing={2}>
                    <Grid item xs={8}>
                      <TextField fullWidth select label="City" name="city" value={form.city} onChange={handleChange}>
                        {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField fullWidth label="Tier" value={`Tier ${form.city_tier}`} disabled />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth select label="Work Type" name="persona" value={form.persona} onChange={handleChange}>
                        {PERSONAS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth select label="Platform" name="platform" value={form.platform} onChange={handleChange}>
                        {(PLATFORMS[form.persona]||[]).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField fullWidth label="Weekly Income (₹)" name="avg_weekly_income" type="number" value={form.avg_weekly_income} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField fullWidth label="Experience (yrs)" name="experience_years" type="number" value={form.experience_years} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField fullWidth label="Hours/Day" name="active_hours_per_day" type="number" value={form.active_hours_per_day} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={6}>
                      <Button fullWidth variant="outlined" onClick={() => setRegStep(0)}>← Back</Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button fullWidth variant="contained" onClick={() => setRegStep(2)}>
                        Next — KYC Documents →
                      </Button>
                    </Grid>
                  </Grid>
                )}

                {/* Step 2 — KYC Documents */}
                {regStep===2 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ fontSize:"0.78rem" }}>
                        Documents required as per government guidelines for gig worker insurance registration.
                      </Alert>
                    </Grid>

                    {/* Aadhaar */}
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <BadgeIcon sx={{ fontSize:16, color:"primary.main" }} />
                        <Typography variant="body2" fontWeight={600}>Aadhaar Number *</Typography>
                      </Box>
                      <TextField fullWidth name="aadhaar" value={form.aadhaar} onChange={handleChange}
                        placeholder="XXXX XXXX XXXX" inputProps={{ maxLength:14 }}
                        helperText="12-digit Aadhaar number issued by UIDAI"
                        error={form.aadhaar.length>0 && !validateAadhaar(form.aadhaar)}
                        color={validateAadhaar(form.aadhaar) ? "success" : "primary"}
                      />
                    </Grid>

                    {/* eShram */}
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <AssignmentIndIcon sx={{ fontSize:16, color:"primary.main" }} />
                        <Typography variant="body2" fontWeight={600}>eShram Registration *</Typography>
                      </Box>
                      <TextField fullWidth select name="eshram_registered" value={form.eshram_registered} onChange={handleChange} sx={{ mb:1 }}>
                        <MenuItem value="yes">Yes — I have an eShram card</MenuItem>
                        <MenuItem value="no">No — I need to register</MenuItem>
                      </TextField>
                      {form.eshram_registered==="yes" ? (
                        <TextField fullWidth name="eshram" value={form.eshram} onChange={handleChange}
                          placeholder="UW-XXXXXXXXXX-X"
                          helperText="eShram registration number from your eShram card"
                          error={form.eshram.length>0 && !validateEShram(form.eshram)} />
                      ) : (
                        <Alert severity="warning" sx={{ fontSize:"0.78rem" }}>
                          eShram registration is required. Please register at{" "}
                          <a href="https://eshram.gov.in" target="_blank" rel="noreferrer" style={{ color:"#1976D2" }}>
                            eshram.gov.in
                          </a>{" "}
                          and come back with your registration number.
                        </Alert>
                      )}
                    </Grid>

                    {/* ID Proof */}
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <AccountBalanceIcon sx={{ fontSize:16, color:"primary.main" }} />
                        <Typography variant="body2" fontWeight={600}>Identity Proof *</Typography>
                      </Box>
                      <TextField fullWidth select label="Document Type" name="id_type" value={form.id_type} onChange={handleChange} sx={{ mb:1 }}>
                        {ID_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </TextField>
                      <TextField fullWidth label="Document Number" name="id_number" value={form.id_number} onChange={handleChange}
                        placeholder="Enter document/reference number"
                        helperText="Number printed on your selected document" />
                    </Grid>

                    {/* KYC Verify button */}
                    {!kycVerified ? (
                      <Grid item xs={12}>
                        <Button fullWidth variant="outlined" color="primary" onClick={verifyKYC}
                          disabled={kycVerifying || !form.aadhaar || (form.eshram_registered==="yes" && !form.eshram) || !form.id_number}>
                          {kycVerifying ? <><CircularProgress size={16} sx={{ mr:1 }}/> Verifying KYC...</> : "Verify KYC Documents"}
                        </Button>
                      </Grid>
                    ) : (
                      <Grid item xs={12}>
                        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb:1 }}>
                          KYC Verified Successfully! Aadhaar ✓ · eShram ✓ · ID Proof ✓
                        </Alert>
                      </Grid>
                    )}

                    <Grid item xs={6}>
                      <Button fullWidth variant="outlined" onClick={() => setRegStep(1)}>← Back</Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button fullWidth variant="contained" onClick={handleSubmit}
                        disabled={loading || !kycVerified || form.eshram_registered==="no"}>
                        {loading ? <CircularProgress size={20}/> : "Create Account"}
                      </Button>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}

            {role==="admin" && tab===0 && (
              <Alert severity="info" sx={{ mt:2, fontSize:"0.78rem" }}>
                Default: <strong>admin</strong> / <strong>admin123</strong>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Box textAlign="center" mt={2}>
          <Button size="small" onClick={() => { setRole(null); setError(""); setRegStep(0); setKycVerified(false); }} color="inherit">
            ← Back to role selection
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
