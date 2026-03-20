import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Grid, Card, CardContent, TextField, MenuItem,
  CircularProgress, Alert, Slider, Container } from "@mui/material";
import { claimsAPI, policiesAPI, integrationsAPI } from "../../services/api";
import { useState as useStateExtra } from "react";

const DISRUPTIONS = {
  environmental: ["Extreme Heat","Heavy Rain","Flash Flood","Severe Pollution (AQI>400)","Cyclone Warning"],
  social: ["Unplanned Curfew","Bandh","Local Strike","Zone Closure"],
};
const STATUS_COLOR = { APPROVED:"success", FLAGGED:"warning", REJECTED:"error" };

export default function FileClaim({ worker }) {
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState({
    policy_id:"", disruption_type:"environmental", disruption_subtype:"Heavy Rain",
    weather_severity:0.6, social_disruption:0.1, claimed_loss_ratio:0.5,
    hours_reported_lost:4, location_match_score:0.9, description:"",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [trafficData, setTrafficData] = useState(null);

  useEffect(() => {
    if (worker?.city) {
      integrationsAPI.traffic(worker.city).then(r => setTrafficData(r.data)).catch(() => {});
    }
    return undefined;
  }, [worker?.city]);

  useEffect(() => {
    if (worker?.id) {
      policiesAPI.forWorker(worker.id).then(r => {
        const active = r.data.filter(p => p.status==="ACTIVE");
        setPolicies(active);
        if (active.length>0) setForm(f => ({ ...f, policy_id:active[0].id }));
      }).catch(() => {});
    }
    return undefined;
  }, [worker]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => { const u={...f,[name]:value}; if (name==="disruption_type") u.disruption_subtype=DISRUPTIONS[value][0]; return u; });
  };

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const r = await claimsAPI.file({ ...form, worker_id:worker.id, persona:worker.persona,
        weather_severity:Number(form.weather_severity), social_disruption:Number(form.social_disruption),
        claimed_loss_ratio:Number(form.claimed_loss_ratio), hours_reported_lost:Number(form.hours_reported_lost),
        location_match_score:Number(form.location_match_score),
      });
      setResult(r.data);
    } catch (e) { setError(e.response?.data?.detail || "Could not file claim."); }
    finally { setLoading(false); }
  };

  if (!worker) return (
    <Container maxWidth="sm" sx={{ py:6, textAlign:"center" }}>
      <Typography fontSize="3rem">📋</Typography>
      <Typography color="text.secondary" mt={2}>Please register and buy a policy first.</Typography>
    </Container>
  );

  if (result) {
    const c = result.claim;
    return (
      <Container maxWidth="sm" sx={{ py:4 }}>
        <Box textAlign="center" mb={3}>
          <Typography fontSize="3.5rem">{c.status==="APPROVED"?"✅":c.status==="FLAGGED"?"⚠️":"❌"}</Typography>
          <Typography variant="h5" fontWeight={700}>Claim {c.status}</Typography>
          {c.status==="APPROVED" && (
            <Typography color="success.main" fontWeight={600}>₹{c.payout_inr} will be credited to your UPI within 5 minutes</Typography>
          )}
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Fraud Check</Typography>
                <Typography variant="body2">Status: <strong>{result.fraud_analysis.flag}</strong></Typography>
                <Typography variant="body2">Score: <strong>{(result.fraud_analysis.fraud_confidence*100).toFixed(1)}%</strong></Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>ML Decision</Typography>
                <Typography variant="body2">Decision: <strong>{result.ml_decision.decision}</strong></Typography>
                <Typography variant="body2">Probability: <strong>{(result.ml_decision.approval_probability*100).toFixed(1)}%</strong></Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Button fullWidth variant="outlined" sx={{ mt:2 }} onClick={() => setResult(null)}>File Another Claim</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py:4 }}>
      <Typography variant="h5" fontWeight={700} mb={0.5}>File a Claim</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>AI processes your claim in seconds</Typography>

      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
      {policies.length===0 ? (
        <Alert severity="warning">No active policies found. Please buy a policy first.</Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth select label="Select Policy" name="policy_id" value={form.policy_id} onChange={handleChange}>
              {policies.map(p => <MenuItem key={p.id} value={p.id}>Policy {p.id.slice(0,8)}... · ₹{p.weekly_premium_inr}/wk</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Disruption Type" name="disruption_type" value={form.disruption_type} onChange={handleChange}>
              <MenuItem value="environmental">Environmental</MenuItem>
              <MenuItem value="social">Social</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="Event" name="disruption_subtype" value={form.disruption_subtype} onChange={handleChange}>
              {DISRUPTIONS[form.disruption_type].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Weather Severity: {(form.weather_severity*100).toFixed(0)}%</Typography>
            <Slider value={Number(form.weather_severity)} min={0} max={1} step={0.05}
              onChange={(_, v) => setForm(f => ({ ...f, weather_severity:v }))} size="small" />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Social Disruption: {(form.social_disruption*100).toFixed(0)}%</Typography>
            <Slider value={Number(form.social_disruption)} min={0} max={1} step={0.05}
              onChange={(_, v) => setForm(f => ({ ...f, social_disruption:v }))} size="small" color="secondary" />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="Loss Ratio (0-1)" name="claimed_loss_ratio" type="number"
              inputProps={{ step:0.05,min:0,max:1 }} value={form.claimed_loss_ratio} onChange={handleChange} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="Hours Lost" name="hours_reported_lost" type="number"
              inputProps={{ min:0,max:24 }} value={form.hours_reported_lost} onChange={handleChange} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="Location Match" name="location_match_score" type="number"
              inputProps={{ step:0.05,min:0,max:1 }} value={form.location_match_score} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Description (optional)" name="description"
              value={form.description} onChange={handleChange} />
          </Grid>
          {trafficData && (
            <Grid item xs={12}>
              <Alert severity={trafficData.congestion_level==="HIGH"?"error":trafficData.congestion_level==="MEDIUM"?"warning":"info"} sx={{ fontSize:"0.78rem" }}>
                Traffic in {worker.city}: <strong>{trafficData.congestion_level}</strong> congestion ({(trafficData.congestion_index*100).toFixed(0)}%) · {trafficData.blocked_routes} blocked routes · {trafficData.advice}
              </Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <Button fullWidth variant="contained" size="large" onClick={handleSubmit} disabled={loading||!form.policy_id}>
              {loading ? <CircularProgress size={22} /> : "Submit Claim"}
            </Button>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
