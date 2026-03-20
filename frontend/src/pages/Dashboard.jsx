import React, { useEffect, useState } from "react";
import { Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, LinearProgress, Alert } from "@mui/material";
import { analyticsAPI } from "../services/api";

const PERSONA_LABEL = {
  food_delivery: "Food Delivery", quick_commerce: "Quick Commerce",
  package_delivery: "Package Delivery", rideshare_uber: "Uber", rideshare_ola: "Ola",
};
const STATUS_COLOR = { APPROVED: "success", REJECTED: "error", FLAGGED: "warning" };

function KpiCard({ label, value, color = "primary.main" }) {
  return (
    <Card>
      <CardContent sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary" mb={0.5}>{label}</Typography>
        <Typography variant="h4" fontWeight={700} sx={{ color }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    analyticsAPI.dashboard()
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { setError("Cannot connect to backend on port 8000."); setLoading(false); });
    return undefined;
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const s = data.summary;
  const risk = data.risk_distribution;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Platform overview</Typography>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={2}><KpiCard label="Workers" value={s.total_workers} /></Grid>
        <Grid item xs={6} md={2}><KpiCard label="Active Policies" value={s.active_policies} /></Grid>
        <Grid item xs={6} md={2}><KpiCard label="Total Claims" value={s.total_claims} /></Grid>
        <Grid item xs={6} md={2}><KpiCard label="Approval Rate" value={`${s.claim_approval_rate}%`} color="success.main" /></Grid>
        <Grid item xs={6} md={2}><KpiCard label="Fraud Rate" value={`${s.fraud_rate_percent}%`} color="error.main" /></Grid>
        <Grid item xs={6} md={2}><KpiCard label="Total Payout" value={`₹${(s.total_payout_inr/1000).toFixed(1)}K`} color="primary.main" /></Grid>
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Risk Distribution</Typography>
              {[["LOW", risk.LOW, "success"], ["MEDIUM", risk.MEDIUM, "warning"], ["HIGH", risk.HIGH, "error"]].map(([l, v, c]) => (
                <Box key={l} mb={1.5}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">{l}</Typography>
                    <Typography variant="body2" color="text.secondary">{v} workers</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={(v / s.total_workers) * 100}
                    color={c} sx={{ height: 6, borderRadius: 3 }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Persona Breakdown</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Persona", "Workers", "Policies", "Claims", "Payout (₹)"].map(h => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(data.persona_breakdown).map(([p, v]) => (
                    <TableRow key={p} hover>
                      <TableCell>{PERSONA_LABEL[p] || p}</TableCell>
                      <TableCell>{v.workers}</TableCell>
                      <TableCell>{v.policies}</TableCell>
                      <TableCell>{v.claims}</TableCell>
                      <TableCell>₹{v.payout?.toFixed(0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>Recent Claims</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["ID", "Persona", "Disruption", "Fraud Score", "Payout", "Status"].map(h => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recent_claims.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{c.id.slice(0, 8)}</TableCell>
                  <TableCell>{PERSONA_LABEL[c.persona] || c.persona}</TableCell>
                  <TableCell>{c.disruption}</TableCell>
                  <TableCell>{(c.fraud_score * 100).toFixed(0)}%</TableCell>
                  <TableCell>₹{c.payout_inr}</TableCell>
                  <TableCell>
                    <Chip label={c.status} size="small" color={STATUS_COLOR[c.status] || "default"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
