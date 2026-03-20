import React, { useEffect, useState } from "react";
import { Box, Card, Typography, Button, CircularProgress, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Grid, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { policiesAPI, workersAPI } from "../services/api";

const STATUS_COLOR = { ACTIVE: "success", EXPIRED: "default" };
const RISK_COLOR = { LOW: "success", MEDIUM: "warning", HIGH: "error" };

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ worker_id: "", persona: "food_delivery", weeks: 4 });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const load = () => {
    Promise.all([policiesAPI.list(), workersAPI.list()]).then(([p, w]) => {
      setPolicies(p.data.policies); setWorkers(w.data.workers); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const r = await policiesAPI.create({ ...form, weeks: Number(form.weeks) });
      setResult(r.data.policy); load();
    } finally { setSubmitting(false); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Policies</Typography>
          <Typography variant="body2" color="text.secondary">Weekly-priced insurance policies</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setOpen(true); setResult(null); }}>
          Create Policy
        </Button>
      </Box>

      {loading ? <CircularProgress /> : (
        <Card>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Policy ID","Worker","Platform","Status","Weeks","Premium/Wk","Total","Max Payout","Risk"].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {policies.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{p.id.slice(0,8)}</TableCell>
                  <TableCell>{p.worker_name}</TableCell>
                  <TableCell>{p.platform}</TableCell>
                  <TableCell><Chip label={p.status} size="small" color={STATUS_COLOR[p.status]||"default"} /></TableCell>
                  <TableCell>{p.weeks}w</TableCell>
                  <TableCell>₹{p.weekly_premium_inr}</TableCell>
                  <TableCell>₹{p.total_premium_inr}</TableCell>
                  <TableCell>₹{p.max_payout_inr}</TableCell>
                  <TableCell><Chip label={p.risk_level||"LOW"} size="small" color={RISK_COLOR[p.risk_level]||"success"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Policy</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {result ? (
            <Alert severity="success">
              Policy created! ₹{result.weekly_premium_inr}/wk × {result.weeks} weeks = ₹{result.total_premium_inr} total. Max payout: ₹{result.max_payout_inr}
            </Alert>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField fullWidth select label="Worker" value={form.worker_id}
                  onChange={e => { const w = workers.find(x => x.id===e.target.value); setForm(f => ({ ...f, worker_id: e.target.value, persona: w?.persona||f.persona })); }}>
                  {workers.map(w => <MenuItem key={w.id} value={w.id}>{w.name} — {w.platform} ({w.city})</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Persona" value={form.persona} onChange={e => setForm(f => ({ ...f, persona: e.target.value }))}>
                  {["food_delivery","quick_commerce","package_delivery","rideshare_uber","rideshare_ola"].map(p => (
                    <MenuItem key={p} value={p}>{p.replace(/_/g," ")}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Duration (weeks)" type="number" value={form.weeks}
                  onChange={e => setForm(f => ({ ...f, weeks: e.target.value }))} inputProps={{ min: 1, max: 52 }} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
          {!result && <Button variant="contained" onClick={handleSubmit} disabled={submitting || !form.worker_id}>
            {submitting ? <CircularProgress size={18} /> : "Create"}
          </Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
