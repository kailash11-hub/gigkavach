import React, { useState } from "react";
import {
  Box, Typography, Button, TextField, MenuItem, Grid, Card, CardContent,
  Slider, CircularProgress, Chip, Alert, LinearProgress, Container, Divider
} from "@mui/material";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import AirIcon from "@mui/icons-material/Air";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import axios from "axios";

const PERSONAS = [
  { value: "food_delivery",    label: "Food Delivery (Zomato/Swiggy)",  base: 45, maxPayout: 1500 },
  { value: "quick_commerce",   label: "Quick Commerce (Zepto/Blinkit)", base: 40, maxPayout: 1200 },
  { value: "package_delivery", label: "Package Delivery (Amazon/Dunzo)",base: 50, maxPayout: 1800 },
  { value: "rideshare_uber",   label: "Rideshare - Uber",               base: 60, maxPayout: 2500 },
  { value: "rideshare_ola",    label: "Rideshare - Ola",                base: 55, maxPayout: 2200 },
];
const TIER_MULT   = { 1: 1.15, 2: 1.0, 3: 0.9 };
const RISK_COLOR  = { LOW: "success", MEDIUM: "warning", HIGH: "error" };
const CITIES = ["Mumbai","Delhi","Bengaluru","Hyderabad","Chennai","Pune","Jaipur","Lucknow","Bhubaneswar","Patna","Kolkata","Ahmedabad"];

function computeRisk(weather, social, claimRate, exp, hours) {
  return Math.min(
    0.35 * weather + 0.35 * social + 0.15 * claimRate +
    0.10 * (1 - Math.min(exp / 10, 1)) +
    0.05 * (1 - Math.min(hours / 16, 1)),
    0.95
  );
}

export default function PremiumCalculator() {
  const [form, setForm] = useState({
    persona: "food_delivery", city_tier: 2,
    avg_weekly_income: 2500, experience_years: 2,
    active_hours: 8, weather_severity: 0.3,
    social_disruption: 0.1, historical_claim_rate: 0.0,
  });
  const [city, setCity] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [backendResult, setBackendResult] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherError, setWeatherError] = useState("");

  const persona = PERSONAS.find(p => p.value === form.persona);
  const riskScore   = computeRisk(form.weather_severity, form.social_disruption, form.historical_claim_rate, form.experience_years, form.active_hours);
  const riskLevel   = riskScore > 0.65 ? "HIGH" : riskScore > 0.35 ? "MEDIUM" : "LOW";
  const weeklyPremium = Math.round(persona.base * (TIER_MULT[form.city_tier] || 1) * (1 + riskScore * 0.9));
  const maxPayout     = backendResult?.max_payout_inr || persona.maxPayout;
  const estPayout     = Math.round(maxPayout * riskScore * 0.72);
  const totalPremium  = weeklyPremium * weeks;
  const returnRatio   = (maxPayout / totalPremium).toFixed(1);

  const handleSlider = (name) => (_, v) => { setForm(f => ({ ...f, [name]: v })); setBackendResult(null); };
  const handleChange = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setBackendResult(null); };

  // Fetch live weather and auto-fill sliders
  const fetchWeather = async (selectedCity) => {
    if (!selectedCity) return;
    setWeatherLoading(true); setWeatherError(""); setWeatherData(null);
    try {
      const r = await axios.get(`http://127.0.0.1:8000/weather/city/${selectedCity}`);
      const w = r.data;
      setWeatherData(w);
      // Auto-fill sliders with real weather data
      setForm(f => ({
        ...f,
        weather_severity: w.weather_severity,
      }));
      setBackendResult(null);
    } catch (e) {
      setWeatherError("Could not fetch weather. Using manual input.");
    } finally { setWeatherLoading(false); }
  };

  const fetchFromBackend = async () => {
    setLoading(true);
    try {
      const r = await axios.post("http://127.0.0.1:8000/workers/predict-risk", {
        persona: form.persona, city_tier: Number(form.city_tier),
        avg_weekly_income: Number(form.avg_weekly_income),
        experience_years: Number(form.experience_years),
        active_hours: Number(form.active_hours),
        weather_severity: Number(form.weather_severity),
        social_disruption: Number(form.social_disruption),
        aqi: weatherData?.aqi || 100,
        rain_mm: weatherData?.rain_mm || 10,
        temp_celsius: weatherData?.temp_celsius || 32,
        day_of_week: 1, time_bucket: 1,
        historical_claim_rate: Number(form.historical_claim_rate),
      });
      setBackendResult(r.data);
    } catch (e) {
      alert("Backend error: " + (e.response?.data?.detail || e.message));
    } finally { setLoading(false); }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} mb={0.5}>AI Premium Calculator</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Powered by PyTorch Neural Network + Live OpenWeatherMap API
      </Typography>

      <Grid container spacing={3}>
        {/* Left — inputs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Your Profile</Typography>

              <TextField fullWidth select label="Work Type" name="persona"
                value={form.persona} onChange={handleChange} sx={{ mb: 2 }}>
                {PERSONAS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </TextField>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField fullWidth select label="City Tier" name="city_tier"
                    value={form.city_tier} onChange={handleChange}>
                    <MenuItem value={1}>Tier 1 (Metro)</MenuItem>
                    <MenuItem value={2}>Tier 2</MenuItem>
                    <MenuItem value={3}>Tier 3</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Weekly Income (₹)" name="avg_weekly_income"
                    type="number" value={form.avg_weekly_income} onChange={handleChange} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Experience (yrs)" name="experience_years"
                    type="number" value={form.experience_years} onChange={handleChange}
                    inputProps={{ min: 0, max: 20, step: 0.5 }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Hours/Day" name="active_hours"
                    type="number" value={form.active_hours} onChange={handleChange}
                    inputProps={{ min: 1, max: 16 }} />
                </Grid>
              </Grid>

              <TextField fullWidth select label="Past Claim History"
                name="historical_claim_rate" value={form.historical_claim_rate}
                onChange={handleChange} sx={{ mb: 2 }}>
                <MenuItem value={0.0}>Never claimed before</MenuItem>
                <MenuItem value={0.05}>1–2 times this year</MenuItem>
                <MenuItem value={0.15}>3–5 times this year</MenuItem>
                <MenuItem value={0.30}>More than 5 times</MenuItem>
              </TextField>

              <Divider sx={{ my: 2 }} />

              {/* Live Weather Section */}
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <LocationOnIcon sx={{ fontSize: 16, color: "primary.main" }} />
                <Typography variant="subtitle2" fontWeight={600}>Live Weather (OpenWeatherMap)</Typography>
              </Box>

              <Box display="flex" gap={1} mb={1.5}>
                <TextField fullWidth select label="Select City" value={city}
                  onChange={e => { setCity(e.target.value); fetchWeather(e.target.value); }} size="small">
                  {CITIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
                {weatherLoading && <CircularProgress size={24} sx={{ mt: 1 }} />}
              </Box>

              {weatherData && (
                <Alert severity={weatherData.weather_severity > 0.6 ? "error" : weatherData.weather_severity > 0.35 ? "warning" : "success"}
                  icon={weatherData.weather_severity > 0.5 ? <ThunderstormIcon fontSize="small"/> : <WbSunnyIcon fontSize="small"/>}
                  sx={{ mb: 1.5, fontSize: "0.78rem" }}>
                  <strong>{weatherData.city}: {weatherData.description}</strong>
                  <br />
                  Temp: {weatherData.temp_celsius}°C · Rain: {weatherData.rain_mm}mm · AQI: {weatherData.aqi} · PM2.5: {weatherData.pm25}
                  <br />
                  <strong>{weatherData.disruption_advice}</strong>
                  {weatherData.source === "mock" && <><br /><em>Using mock data (API activating)</em></>}
                </Alert>
              )}

              {weatherError && <Alert severity="warning" sx={{ mb: 1.5, fontSize: "0.78rem" }}>{weatherError}</Alert>}

              <Box mb={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Weather Severity {weatherData ? "(auto-filled from live data)" : "(manual)"}
                  </Typography>
                  <Typography variant="caption" fontWeight={600}
                    color={form.weather_severity > 0.6 ? "error.main" : form.weather_severity > 0.3 ? "warning.main" : "text.secondary"}>
                    {Math.round(form.weather_severity * 100)}%
                  </Typography>
                </Box>
                <Slider value={form.weather_severity} min={0} max={1} step={0.01}
                  onChange={handleSlider("weather_severity")} size="small"
                  color={form.weather_severity > 0.6 ? "error" : form.weather_severity > 0.3 ? "warning" : "primary"} />
              </Box>

              <Box mb={3}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Social Disruption (manual)</Typography>
                  <Typography variant="caption" fontWeight={600}
                    color={form.social_disruption > 0.6 ? "error.main" : form.social_disruption > 0.3 ? "warning.main" : "text.secondary"}>
                    {Math.round(form.social_disruption * 100)}%
                  </Typography>
                </Box>
                <Slider value={form.social_disruption} min={0} max={1} step={0.01}
                  onChange={handleSlider("social_disruption")} size="small" color="secondary" />
              </Box>

              <Button fullWidth variant="contained" size="large" onClick={fetchFromBackend} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : backendResult ? "Recalculate with AI" : "Calculate with AI"}
              </Button>
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1}>
                Results update instantly · Button gets exact PyTorch score
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right — results */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Your Risk Profile</Typography>

              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">Risk Score</Typography>
                  <Chip label={riskLevel} size="small" color={RISK_COLOR[riskLevel]} />
                </Box>
                <LinearProgress variant="determinate" value={Math.round(riskScore * 100)}
                  color={RISK_COLOR[riskLevel]} sx={{ height: 10, borderRadius: 5, mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(riskScore * 100)}% — weather {Math.round(form.weather_severity * 100)}%,
                  disruption {Math.round(form.social_disruption * 100)}%,
                  claim history {Math.round(form.historical_claim_rate * 100)}%
                </Typography>
              </Box>

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, bgcolor: "#F0F7FF", borderRadius: 2, border: "1px solid #BBDEFB" }}>
                    <Typography variant="caption" color="text.secondary">Weekly Premium</Typography>
                    <Typography variant="h5" fontWeight={700} color="primary">₹{weeklyPremium}</Typography>
                    <Typography variant="caption" color="text.secondary">per week</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, bgcolor: "#F1F8E9", borderRadius: 2, border: "1px solid #C5E1A5" }}>
                    <Typography variant="caption" color="text.secondary">Max Payout</Typography>
                    <Typography variant="h5" fontWeight={700} color="success.main">₹{maxPayout.toLocaleString("en-IN")}</Typography>
                    <Typography variant="caption" color="text.secondary">per claim</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, bgcolor: "#F5F7FA", borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Est. Payout / Event</Typography>
                    <Typography variant="h6" fontWeight={700}>₹{estPayout.toLocaleString("en-IN")}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1.5, bgcolor: "#F5F7FA", borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Fraud Threshold</Typography>
                    <Typography variant="h6" fontWeight={700}>8%</Typography>
                  </Box>
                </Grid>
              </Grid>

              {backendResult && (
                <Alert severity={backendResult.risk_level === "HIGH" ? "error" : backendResult.risk_level === "MEDIUM" ? "warning" : "success"}
                  sx={{ mt: 2, fontSize: "0.78rem" }}>
                  PyTorch result: ₹{backendResult.weekly_premium_inr}/wk · {backendResult.risk_level} risk · Score: {(backendResult.risk_score * 100).toFixed(1)}%
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Coverage Plan</Typography>
              <Typography variant="caption" color="text.secondary">Weeks: {weeks}</Typography>
              <Slider value={weeks} min={1} max={12} step={1} marks
                onChange={(_, v) => setWeeks(v)} valueLabelDisplay="auto" sx={{ mb: 1 }} />

              <Grid container spacing={1}>
                {[
                  ["Total Premium", `₹${totalPremium.toLocaleString("en-IN")}`],
                  ["Coverage",      `₹${maxPayout.toLocaleString("en-IN")}`],
                  ["Duration",      `${weeks} weeks`],
                  ["Return Ratio",  `${returnRatio}x`],
                ].map(([l, v]) => (
                  <Grid item xs={6} key={l}>
                    <Box sx={{ p: 1, bgcolor: "#F5F7FA", borderRadius: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">{l}</Typography>
                      <Typography fontWeight={600} variant="body2">{v}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Alert severity="info" sx={{ mt: 2, fontSize: "0.78rem" }}>
                Pay ₹{weeklyPremium}/week and get up to ₹{maxPayout.toLocaleString("en-IN")} income protection.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
