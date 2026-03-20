import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Button, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { workersAPI } from "../services/api";

const PERSONAS = [
  { value: "food_delivery", label: "Food Delivery" },
  { value: "quick_commerce", label: "Quick Commerce" },
  { value: "package_delivery", label: "Package Delivery" },
  { value: "rideshare_uber", label: "Rideshare - Uber" },
  { value: "rideshare_ola", label: "Rideshare - Ola" },
];
const PLATFORMS = {
  food_delivery: ["Zomato","Swiggy"], quick_commerce: ["Zepto","Blinkit"],
  package_delivery: ["Amazon Flex","Dunzo","Porter"],
  rideshare_uber: ["Uber"], rideshare_ola: ["Ola"],
};
const RISK_COLOR = { LOW: "success", MEDIUM: "warning", HIGH: "error" };

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    name: "", phone: "", city: "Delhi", city_tier: 1,
    persona: "food_delivery", platform: "Zomato",
    avg_weekly_income: 2500, experience_years: 1, active_hours_per_day: 8, historical_claim_rate: 0,
  });

  const load = () => { workersAPI.list().then(r => { setWorkers(r.data.workers); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => { const u = { ...f, [name]: value }; if (name === "persona") u.platform = PLATFORMS[value][0]; return u; });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const r = await workersAPI.onboard({ ...form,
        city_tier: Number(form.city_tier), avg_weekly_income: Number(form.avg_weekly_income),
        experience_years: Number(form.experience_years), active_hours_per_day: Number(form.active_hours_per_day),
        historical_claim_rate: Number(form.historical_claim_rate),
      });
      setResult(r.data.worker); load();
    } finally { setSubmitting(false); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Workers</Typography>
          <Typography variant="body2" color="text.secondary">All registered gig workers</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setOpen(true); setResult(null); }}>
          Add Worker
        </Button>
      </Box>

      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Name","City","Platform","Persona","Weekly Income","Risk Score","Risk","Premium/Wk"].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {workers.map(w => (
                <TableRow key={w.id} hover>
                  <TableCell fontWeight={600}>{w.name}</TableCell>
                  <TableCell>{w.city}</TableCell>
                  <TableCell>{w.platform}</TableCell>
                  <TableCell>{w.persona?.replace(/_/g," ")}</TableCell>
                  <TableCell>₹{w.avg_weekly_income}</TableCell>
                  <TableCell>{(w.risk_score*100).toFixed(1)}%</TableCell>
                  <TableCell><Chip label={w.risk_level||"LOW"} size="small" color={RISK_COLOR[w.risk_level]||"success"} /></TableCell>
                  <TableCell>₹{w.weekly_premium_inr}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Worker</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {result ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>Worker added! Risk: {result.risk_level} — Premium: ₹{result.weekly_premium_inr}/wk</Alert>
              <Typography variant="body2">AI Risk Score: <strong>{(result.risk_score*100).toFixed(1)}%</strong></Typography>
              <Typography variant="body2">Max Payout: <strong>₹{result.max_payout_inr}</strong></Typography>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}><TextField fullWidth label="Name" name="name" value={form.name} onChange={handleChange} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Phone" name="phone" value={form.phone} onChange={handleChange} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="City" name="city" value={form.city} onChange={handleChange} /></Grid>
              <Grid item xs={6}><TextField fullWidth select label="City Tier" name="city_tier" value={form.city_tier} onChange={handleChange}>
                {[1,2,3].map(t => <MenuItem key={t} value={t}>Tier {t}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={6}><TextField fullWidth select label="Persona" name="persona" value={form.persona} onChange={handleChange}>
                {PERSONAS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={6}><TextField fullWidth select label="Platform" name="platform" value={form.platform} onChange={handleChange}>
                {(PLATFORMS[form.persona]||[]).map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={6}><TextField fullWidth label="Weekly Income (₹)" name="avg_weekly_income" type="number" value={form.avg_weekly_income} onChange={handleChange} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Experience (yrs)" name="experience_years" type="number" value={form.experience_years} onChange={handleChange} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Active Hours/Day" name="active_hours_per_day" type="number" value={form.active_hours_per_day} onChange={handleChange} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Claim Rate (0-1)" name="historical_claim_rate" type="number" value={form.historical_claim_rate} onChange={handleChange} inputProps={{ step: 0.01, min: 0, max: 1 }} /></Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
          {!result && <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={18} /> : "Add & Assess Risk"}
          </Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
