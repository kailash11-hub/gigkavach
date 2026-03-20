import React, { useEffect, useState } from "react";
import { Box, Card, Typography, CircularProgress, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, Grid } from "@mui/material";
import { analyticsAPI } from "../services/api";

export default function Payouts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
 void analyticsAPI.payouts().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false)); }, []);
  if (loading) return <CircularProgress />;
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>Payouts</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Instant UPI payouts</Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">Total Payouts</Typography>
            <Typography variant="h4" fontWeight={700} color="primary">{data.total_payouts}</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">Total Amount</Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">₹{data.total_amount_inr?.toFixed(0)}</Typography>
          </Card>
        </Grid>
      </Grid>
      <Card>
        <Table size="small">
          <TableHead>
            <TableRow>
              {["Claim ID","Worker ID","Amount","Method","Status","Processed At"].map(h => (
                <TableCell key={h}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.payouts.map(p => (
              <TableRow key={p.claim_id} hover>
                <TableCell sx={{ fontFamily:"monospace", fontSize:"0.75rem" }}>{p.claim_id.slice(0,8)}</TableCell>
                <TableCell sx={{ fontFamily:"monospace", fontSize:"0.75rem" }}>{p.worker_id.slice(0,8)}</TableCell>
                <TableCell sx={{ fontWeight:600 }}>₹{p.amount_inr}</TableCell>
                <TableCell><Chip label={p.method} size="small" color="primary" variant="outlined" /></TableCell>
                <TableCell><Chip label={p.status} size="small" color="success" /></TableCell>
                <TableCell>{new Date(p.processed_at).toLocaleDateString("en-IN")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}
