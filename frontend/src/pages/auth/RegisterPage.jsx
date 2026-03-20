import React, { useState } from "react";
import {
  Box, Typography, TextField, Button, Card, CardContent,
  CircularProgress, Alert, Grid, MenuItem, Stepper, Step,
  StepLabel, LinearProgress, Chip, InputAdornment, IconButton
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuth } from "../../context/AuthContext";

const PERSONAS = [
  { value: "food_delivery", label: "🍔 Food Delivery", platforms: ["Zomato", "Swiggy"] },
  { value: "quick_commerce", label: "⚡ Quick Commerce", platforms: ["Zepto", "Blinkit", "Swiggy Instamart"] },
  { value: "package_delivery", label: "📦 Package Delivery", platforms: ["Amazon Flex", "Dunzo", "Porter", "Shadowfax"] },
  { value: "rideshare_uber", label: "🚗 Uber Driver", platforms: ["Uber"] },
  { value: "rideshare_ola", label: "🚕 Ola Driver", platforms: ["Ola"] },
];

const CITIES = [
  { name: "Mumbai", tier: 1 }, { name: "Delhi", tier: 1 }, { name: "Bengaluru", tier: 1 },
  { name: "Hyderabad", tier: 1 }, { name: "Chennai", tier: 1 }, { name: "Kolkata", tier: 1 },
  { name: "Pune", tier: 2 }, { name: "Jaipur", tier: 2 }, { name: "Lucknow", tier: 2 },
  { name: "Bhubaneswar", tier: 2 }, { name: "Patna", tier: 2 }, { name: "Surat", tier: 2 },
];

const STEPS = ["Account Details", "Personal & Work Info", "AI Risk Assessment"];
const RISK_COLOR = { LOW: "#00C9B1", MEDIUM: "#F5A623", HIGH: "#FF5C7A" };

export default function RegisterPage({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(null);

  const [form, setForm] = useState({
    username: "", password: "", confirmPassword: "", email: "",
    name: "", phone: "",
    city: "Bhubaneswar", city_tier: 2,
    persona: "food_delivery", platform: "Zomato",
    avg_weekly_income: 2500, experience_years: 1,
    active_hours_per_day: 8,
  });

  const personaObj = PERSONAS.find(p => p.value === form.persona);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => {
      const u = { ...f, [name]: value };
      if (name === "persona") u.platform = PERSONAS.find(p => p.value === value)?.platforms[0] || "";
      if (name === "city") {
        const c = CITIES.find(c => c.name === value);
        u.city_tier = c?.tier || 2;
      }
      return u;
    });
  };

  const validateStep0 = () => {
    if (!form.username || !form.password || !form.confirmPassword)
      return "Please fill all required fields.";
    if (form.username.length < 3)
      return "Username must be at least 3 characters.";
    if (form.password.length < 6)
      return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
    return null;
  };

  const validateStep1 = () => {
    if (!form.name || !form.phone || !form.city)
      return "Please fill all required fields.";
    if (form.avg_weekly_income <= 0)
      return "Please enter a valid weekly income.";
    return null;
  };

  const handleNext = async () => {
    setError("");
    if (step === 0) {
      const err = validateStep0();
      if (err) { setError(err); return; }
      setStep(1);
    } else if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setLoading(true);
      try {
        const result = await register({
          username: form.username, password: form.password,
          email: form.email || undefined,
          name: form.name, phone: form.phone,
          city: form.city, city_tier: Number(form.city_tier),
          persona: form.persona, platform: form.platform,
          avg_weekly_income: Number(form.avg_weekly_income),
          experience_years: Number(form.experience_years),
          active_hours_per_day: Number(form.active_hours_per_day),
        });
        setRegistered(result);
        setStep(2);
      } catch (e) {
        setError(e.response?.data?.detail || "Registration failed. Please try again.");
      } finally { setLoading(false); }
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh", background: "#080F1E",
      display: "flex", alignItems: "center", justifyContent: "center", p: 2,
    }}>
      <Box width="100%" maxWidth={520}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h3" fontWeight={800} sx={{
            background: "linear-gradient(135deg, #F5A623, #FFD07A)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>GigShield</Typography>
          <Typography variant="body2" color="text.secondary">Create your worker account</Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stepper activeStep={step} sx={{ mb: 3 }}>
              {STEPS.map(s => (
                <Step key={s}>
                  <StepLabel sx={{
                    "& .MuiStepLabel-label": { color: "#8A9BB5", fontSize: "0.72rem" },
                    "& .MuiStepLabel-label.Mui-active": { color: "#F5A623" },
                    "& .MuiStepLabel-label.Mui-completed": { color: "#00C9B1" },
                    "& .MuiStepIcon-root.Mui-active": { color: "#F5A623" },
                    "& .MuiStepIcon-root.Mui-completed": { color: "#00C9B1" },
                  }}>{s}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Step 0 - Account */}
            {step === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Username *" name="username" value={form.username}
                    onChange={handleChange} size="small" placeholder="e.g. raju_delivery" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Email (optional)" name="email" value={form.email}
                    onChange={handleChange} size="small" type="email" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Password *" name="password" type={showPass ? "text" : "password"}
                    value={form.password} onChange={handleChange} size="small"
                    helperText="Minimum 6 characters"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPass(s => !s)} sx={{ color: "#8A9BB5" }}>
                            {showPass ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Confirm Password *" name="confirmPassword"
                    type={showPass ? "text" : "password"} value={form.confirmPassword}
                    onChange={handleChange} size="small" />
                </Grid>
              </Grid>
            )}

            {/* Step 1 - Work Details */}
            {step === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label="Full Name *" name="name" value={form.name}
                    onChange={handleChange} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Phone Number *" name="phone" value={form.phone}
                    onChange={handleChange} size="small" placeholder="+91 XXXXX XXXXX" />
                </Grid>
                <Grid item xs={8}>
                  <TextField fullWidth select label="City *" name="city" value={form.city}
                    onChange={handleChange} size="small">
                    {CITIES.map(c => (
                      <MenuItem key={c.name} value={c.name}>{c.name} (Tier {c.tier})</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth label="City Tier" value={`Tier ${form.city_tier}`} size="small" disabled />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth select label="Work Type *" name="persona" value={form.persona}
                    onChange={handleChange} size="small">
                    {PERSONAS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth select label="Platform *" name="platform" value={form.platform}
                    onChange={handleChange} size="small">
                    {(personaObj?.platforms || []).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth label="Weekly Income (₹)" name="avg_weekly_income" type="number"
                    value={form.avg_weekly_income} onChange={handleChange} size="small" />
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth label="Experience (yrs)" name="experience_years" type="number"
                    value={form.experience_years} onChange={handleChange} size="small"
                    inputProps={{ step: 0.5, min: 0 }} />
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth label="Hours/Day" name="active_hours_per_day" type="number"
                    value={form.active_hours_per_day} onChange={handleChange} size="small"
                    inputProps={{ min: 1, max: 24 }} />
                </Grid>
              </Grid>
            )}

            {/* Step 2 - AI Result */}
            {step === 2 && registered && (
              <Box>
                <Box textAlign="center" mb={2}>
                  <CheckCircleIcon sx={{ fontSize: 52, color: "#00C9B1" }} />
                  <Typography variant="h6" fontWeight={700} color="white" mt={1}>
                    Registration Successful!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Welcome to GigShield, {registered.worker?.name}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: "rgba(245,166,35,0.05)", borderRadius: 2, border: "1px solid rgba(245,166,35,0.15)", mb: 2 }}>
                  <Typography fontWeight={700} color="#F5A623" mb={1.5}>🤖 Your AI Risk Profile</Typography>
                  <Box mb={1.5}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">Risk Score</Typography>
                      <Chip label={registered.worker?.risk_level} size="small"
                        sx={{ bgcolor: `${RISK_COLOR[registered.worker?.risk_level]}20`, color: RISK_COLOR[registered.worker?.risk_level], fontWeight: 700 }} />
                    </Box>
                    <LinearProgress variant="determinate" value={(registered.worker?.risk_score || 0) * 100}
                      sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.08)",
                        "& .MuiLinearProgress-bar": { bgcolor: RISK_COLOR[registered.worker?.risk_level] } }} />
                    <Typography variant="caption" sx={{ color: RISK_COLOR[registered.worker?.risk_level] }}>
                      {((registered.worker?.risk_score || 0) * 100).toFixed(1)}% risk
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    {[
                      ["Worker ID", registered.worker?.id?.slice(0, 12) + "..."],
                      ["Platform", registered.worker?.platform],
                      ["Weekly Premium", `₹${registered.worker?.weekly_premium_inr}`],
                      ["Max Payout", `₹${registered.worker?.max_payout_inr}`],
                    ].map(([k, v]) => (
                      <Grid item xs={6} key={k}>
                        <Box sx={{ p: 1, bgcolor: "rgba(255,255,255,0.04)", borderRadius: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block">{k}</Typography>
                          <Typography variant="body2" fontWeight={700} color="white">{v}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Alert severity="success" sx={{ mb: 2 }}>
                  You are now logged in. Redirecting to your dashboard...
                </Alert>
              </Box>
            )}

            {/* Actions */}
            {step < 2 && (
              <Box display="flex" justifyContent="space-between" mt={3}>
                <Button startIcon={<ArrowBackIcon />}
                  onClick={step === 0 ? onSwitchToLogin : () => setStep(s => s - 1)}
                  sx={{ color: "#8A9BB5" }}>
                  {step === 0 ? "Back to Login" : "Back"}
                </Button>
                <Button variant="contained" onClick={handleNext} disabled={loading}>
                  {loading ? <CircularProgress size={20} /> :
                    step === 0 ? "Next" : "Register & Get AI Score"}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
