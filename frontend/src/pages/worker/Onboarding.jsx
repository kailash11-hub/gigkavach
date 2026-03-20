import React, { useState } from "react";
import {
  Box, Typography, Button, TextField, MenuItem, Grid, Card, CardContent,
  Stepper, Step, StepLabel, CircularProgress, Alert, Chip, LinearProgress
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { workersAPI } from "../../services/api";

const PERSONAS = [
  { value: "food_delivery", label: "🍔 Food Delivery", labelHi: "" },
  { value: "quick_commerce", label: "⚡ Quick Commerce", labelHi: "" },
  { value: "package_delivery", label: "📦 Package Delivery", labelHi: "" },
  { value: "rideshare_uber", label: "🚗 Uber", labelHi: "" },
  { value: "rideshare_ola", label: "🚕 Ola", labelHi: "" },
];

const PLATFORMS = {
  food_delivery: ["Zomato", "Swiggy"],
  quick_commerce: ["Zepto", "Blinkit", "Swiggy Instamart"],
  package_delivery: ["Amazon Flex", "Dunzo", "Porter", "Shadowfax"],
  rideshare_uber: ["Uber"],
  rideshare_ola: ["Ola"],
};

const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune",
  "Jaipur", "Lucknow", "Bhubaneswar", "Patna", "Kolkata", "Ahmedabad"];

const STEPS = ["Personal Info", "Work Details", "AI Risk Score"];

const RISK_COLOR = { LOW: "#00C9B1", MEDIUM: "#F5A623", HIGH: "#FF5C7A" };

export default function WorkerOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", city: "Bhubaneswar", city_tier: 2,
    persona: "food_delivery", platform: "Zomato",
    avg_weekly_income: 2500, experience_years: 1,
    active_hours_per_day: 8, historical_claim_rate: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => {
      const u = { ...f, [name]: value };
      if (name === "persona") u.platform = PLATFORMS[value][0];
      if (name === "city") {
        const tier1 = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad"];
        u.city_tier = tier1.includes(value) ? 1 : 2;
      }
      return u;
    });
  };

  const handleNext = async () => {
    if (step === 1) {
      setLoading(true);
      setError("");
      try {
        const r = await workersAPI.onboard({
          ...form,
          city_tier: Number(form.city_tier),
          avg_weekly_income: Number(form.avg_weekly_income),
          experience_years: Number(form.experience_years),
          active_hours_per_day: Number(form.active_hours_per_day),
          historical_claim_rate: Number(form.historical_claim_rate),
        });
        setResult(r.data.worker);
        setStep(2);
      } catch (e) {
        setError("");
      } finally {
        setLoading(false);
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const canNext = step === 0 ? (form.name && form.phone && form.city) :
    step === 1 ? (form.avg_weekly_income > 0) : true;

  return (
    <Box maxWidth={600} mx="auto" py={4} px={2}>
      <Typography variant="h5" fontWeight={800} color="white" mb={0.5}>
        Worker Registration
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Complete KYC to get your AI risk score and weekly premium
      </Typography>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map(s => (
          <Step key={s}>
            <StepLabel sx={{
              "& .MuiStepLabel-label": { color: "#8A9BB5", fontSize: "0.75rem" },
              "& .MuiStepLabel-label.Mui-active": { color: "#F5A623" },
              "& .MuiStepLabel-label.Mui-completed": { color: "#00C9B1" },
              "& .MuiStepIcon-root.Mui-active": { color: "#F5A623" },
              "& .MuiStepIcon-root.Mui-completed": { color: "#00C9B1" },
            }}>{s}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Step 0 - Personal */}
      {step === 0 && (
        <Card>
          <CardContent>
            <Typography fontWeight={700} color="#F5A623" mb={2}>Personal Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Full Name" name="name" value={form.name} onChange={handleChange} size="small" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Phone Number" name="phone" value={form.phone} onChange={handleChange} size="small" placeholder="+91 XXXXX XXXXX" />
              </Grid>
              <Grid item xs={8}>
                <TextField fullWidth select label="City" name="city" value={form.city} onChange={handleChange} size="small">
                  {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label="City Tier" value={`Tier ${form.city_tier}`} size="small" disabled />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Step 1 - Work */}
      {step === 1 && (
        <Card>
          <CardContent>
            <Typography fontWeight={700} color="#F5A623" mb={2}>Work Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth select label="Work Type" name="persona" value={form.persona} onChange={handleChange} size="small">
                  {PERSONAS.map(p => <MenuItem key={p.value} value={p.value}>{p.label} · {p.labelHi}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth select label="Platform" name="platform" value={form.platform} onChange={handleChange} size="small">
                  {(PLATFORMS[form.persona] || []).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Weekly Income (₹)" name="avg_weekly_income" type="number" value={form.avg_weekly_income} onChange={handleChange} size="small" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Experience (Years)" name="experience_years" type="number" value={form.experience_years} onChange={handleChange} size="small" inputProps={{ step: 0.5, min: 0 }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Active Hours/Day" name="active_hours_per_day" type="number" value={form.active_hours_per_day} onChange={handleChange} size="small" inputProps={{ min: 1, max: 24 }} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Past Claim Rate (0-1)" name="historical_claim_rate" type="number" value={form.historical_claim_rate} onChange={handleChange} size="small" inputProps={{ step: 0.01, min: 0, max: 1 }} helperText="0 if none" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Step 2 - AI Result */}
      {step === 2 && result && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
            Registration successful!
          </Alert>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography fontWeight={700} color="#F5A623" mb={2}>🤖 AI Risk Assessment Result</Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" mb={0.5}>Risk Score</Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress variant="determinate" value={result.risk_score * 100}
                    sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: "rgba(255,255,255,0.1)",
                      "& .MuiLinearProgress-bar": { bgcolor: RISK_COLOR[result.risk_level] } }} />
                  <Typography fontWeight={800} sx={{ color: RISK_COLOR[result.risk_level] }}>
                    {(result.risk_score * 100).toFixed(1)}%
                  </Typography>
                  <Chip label={result.risk_level} size="small"
                    sx={{ bgcolor: `${RISK_COLOR[result.risk_level]}20`, color: RISK_COLOR[result.risk_level], fontWeight: 700 }} />
                </Box>
              </Box>
              <Grid container spacing={2}>
                {[
                  ["Weekly Premium", `₹${result.weekly_premium_inr}`, "#F5A623"],
                  ["Max Payout", `₹${result.max_payout_inr}`, "#00C9B1"],
                  ["Worker ID", result.id?.slice(0, 8) + "...", "#8A9BB5"],
                  ["Platform", result.platform, "#8A9BB5"],
                ].map(([label, val, color]) => (
                  <Grid item xs={6} key={label}>
                    <Box sx={{ p: 1.5, bgcolor: "rgba(255,255,255,0.04)", borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography fontWeight={700} sx={{ color }}>{val}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
          <Button fullWidth variant="contained" size="large" onClick={() => onComplete(result)}>
            Continue to Buy Policy
          </Button>
        </Box>
      )}

      {step < 2 && (
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button disabled={step === 0} onClick={() => setStep(s => s - 1)} sx={{ color: "#8A9BB5" }}>
            Back
          </Button>
          <Button variant="contained" onClick={handleNext} disabled={!canNext || loading}>
            {loading ? <CircularProgress size={20} /> : step === 1 ? "Get AI Score" : "Next"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
