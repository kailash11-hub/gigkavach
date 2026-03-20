import React, { useEffect, useState } from "react";
import { Box, Card, Typography, Button, CircularProgress, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Grid, Alert, Slider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { claimsAPI, policiesAPI } from "../services/api";
import axios from "axios";

const STATUS_COLOR = { APPROVED: "success", REJECTED: "error", FLAGGED: "warning" };

export default function Claims() {
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);
  const [form, setForm] = useState({
    policy_id: "", worker_id: "", persona: "food_delivery",
    disruption_type: "environmental", disruption_subtype: "Heavy Rain",
    weather_severity: 0.6, social_disruption: 0.2,
    claimed_loss_ratio: 0.5, hours_reported_lost: 4,
    location_match_score: 0.9, description: "",
  });

  const DISRUPTIONS = {
    environmental: ["Extreme Heat","Heavy Rain","Flash Flood","Severe Pollution","Cyclone"],
    social: ["Curfew","Bandh","Local Strike","Zone Closure"],
  };

  const load = () => {
    Promise.all([claimsAPI.list(), policiesAPI.list(0,50,"ACTIVE")]).then(([c, p]) => {
      setClaims(c.data.claims); setPolicies(p.data.policies); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleAutoTrigger = async () => {
    setTriggering(true); setTriggerResult(null);
    try {
      const r = await claimsAPI.autoTrigger();
      setTriggerResult(r.data);
      load();
    } catch(e) { console.error(e); }
    finally { setTriggering(false); }
  };

  const handlePolicyChange = (pid) => {
    const pol = policies.find(p => p.id === pid);
    if (pol) setForm(f => ({ ...f, policy_id: pid, worker_id: pol.worker_id, persona: pol.persona }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => { const u = { ...f, [name]: value }; if (name==="disruption_type") u.disruption_subtype = DISRUPTIONS[value][0]; return u; });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const r = await claimsAPI.file({ ...form,
        weather_severity: Number(form.weather_severity), social_disruption: Number(form.social_disruption),
        claimed_loss_ratio: Number(form.claimed_loss_ratio), hours_reported_lost: Number(form.hours_reported_lost),
        location_match_score: Number(form.location_match_score),
      });
      setResult(r.data); load();
    } finally { setSubmitting(false); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Claims</Typography>
          <Typography variant="body2" color="text.secondary">AI fraud detection & auto-approval</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" color="warning" onClick={handleAutoTrigger} disabled={triggering}>
            {triggering ? <CircularProgress size={18}/> : "Auto-Trigger Parametric"}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setOpen(true); setResult(null); }}>
            File Claim
          </Button>
        </Box>
      </Box>

      {triggerResult && (
        <Alert severity="info" sx={{ mb:2 }} onClose={() => setTriggerResult(null)}>
          Auto-trigger complete: <strong>{triggerResult.triggered_claims}</strong> claims initiated. {triggerResult.message}
        </Alert>
      )}
      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["ID","Persona","Disruption","Hours","Fraud Score","Approval %","Payout","Status"].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {claims.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontFamily:"monospace", fontSize:"0.75rem" }}>{c.id.slice(0,8)}</TableCell>
                  <TableCell>{c.persona?.replace(/_/g," ")}</TableCell>
                  <TableCell>{c.disruption_subtype}</TableCell>
                  <TableCell>{c.hours_lost}h</TableCell>
                  <TableCell sx={{ color: c.fraud_score>0.5?"error.main":"success.main" }}>
                    {(c.fraud_score*100).toFixed(0)}%
                  </TableCell>
                  <TableCell>{c.approval_probability ? `${(c.approval_probability*100).toFixed(0)}%` : "—"}</TableCell>
                  <TableCell>₹{c.payout_inr}</TableCell>
                  <TableCell><Chip label={c.status} size="small" color={STATUS_COLOR[c.status]||"default"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>File Claim</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {result ? (
            <Box>
              <Alert severity={result.claim.status==="APPROVED"?"success":result.claim.status==="FLAGGED"?"warning":"error"} sx={{ mb: 2 }}>
                Claim {result.claim.status}{result.claim.status==="APPROVED"?` — ₹${result.claim.payout_inr} payout processed`:""}
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>Fraud Analysis</Typography>
                  <Typography variant="body2">Status: <strong>{result.fraud_analysis.flag}</strong></Typography>
                  <Typography variant="body2">Confidence: <strong>{(result.fraud_analysis.fraud_confidence*100).toFixed(1)}%</strong></Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>ML Decision</Typography>
                  <Typography variant="body2">Decision: <strong>{result.ml_decision.decision}</strong></Typography>
                  <Typography variant="body2">Probability: <strong>{(result.ml_decision.approval_probability*100).toFixed(1)}%</strong></Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField fullWidth select label="Active Policy" value={form.policy_id} onChange={e => handlePolicyChange(e.target.value)}>
                  {policies.map(p => <MenuItem key={p.id} value={p.id}>{p.worker_name} — {p.platform} (₹{p.weekly_premium_inr}/wk)</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Disruption Type" name="disruption_type" value={form.disruption_type} onChange={handleChange}>
                  <MenuItem value="environmental">Environmental</MenuItem>
                  <MenuItem value="social">Social</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Disruption" name="disruption_subtype" value={form.disruption_subtype} onChange={handleChange}>
                  {(DISRUPTIONS[form.disruption_type]||[]).map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Weather Severity: {form.weather_severity}</Typography>
                <Slider value={Number(form.weather_severity)} min={0} max={1} step={0.05}
                  onChange={(_, v) => setForm(f => ({ ...f, weather_severity: v }))} color="primary" size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Social Disruption: {form.social_disruption}</Typography>
                <Slider value={Number(form.social_disruption)} min={0} max={1} step={0.05}
                  onChange={(_, v) => setForm(f => ({ ...f, social_disruption: v }))} color="secondary" size="small" />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label="Loss Ratio (0-1)" name="claimed_loss_ratio" type="number" value={form.claimed_loss_ratio} onChange={handleChange} inputProps={{ step:0.05,min:0,max:1 }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label="Hours Lost" name="hours_reported_lost" type="number" value={form.hours_reported_lost} onChange={handleChange} inputProps={{ min:0,max:24 }} />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label="Location Match" name="location_match_score" type="number" value={form.location_match_score} onChange={handleChange} inputProps={{ step:0.05,min:0,max:1 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Description (optional)" name="description" value={form.description} onChange={handleChange} multiline rows={2} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
          {!result && <Button variant="contained" onClick={handleSubmit} disabled={submitting || !form.policy_id}>
            {submitting ? <CircularProgress size={18} /> : "Submit & Analyze"}
          </Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
