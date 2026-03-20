import React, { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, Chip, CircularProgress,
  Grid, Alert, LinearProgress, Container } from "@mui/material";
import { claimsAPI, policiesAPI, integrationsAPI } from "../../services/api";

const STATUS_COLOR = { APPROVED:"success", FLAGGED:"warning", REJECTED:"error" };

export default function TrackStatus({ worker }) {
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platformData, setPlatformData] = useState(null);

  useEffect(() => {
    if (!worker?.id) { setLoading(false); return undefined; }
    void Promise.all([
      claimsAPI.forWorker(worker.id).catch(() => ({ data:[] })),
      policiesAPI.forWorker(worker.id).catch(() => ({ data:[] })),
    ]).then(([c, p]) => {
      setClaims(c.data); setPolicies(p.data); setLoading(false);
    });
  }, [worker]);

  if (!worker) return (
    <Container maxWidth="sm" sx={{ py:6, textAlign:"center" }}>
      <Typography fontSize="3rem">📊</Typography>
      <Typography color="text.secondary" mt={2}>Please register to track your claims.</Typography>
    </Container>
  );

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  const totalPayout = claims.filter(c=>c.status==="APPROVED").reduce((a,c)=>a+c.payout_inr,0);
  const activePolicies = policies.filter(p=>p.status==="ACTIVE");

  return (
    <Container maxWidth="md" sx={{ py:4 }}>
      <Typography variant="h5" fontWeight={700} mb={0.5}>My Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Track your policies, claims and payouts</Typography>

      <Grid container spacing={2} mb={3}>
        {[
          ["Active Policies", activePolicies.length, "primary"],
          ["Total Claims", claims.length, "inherit"],
          ["Approved", claims.filter(c=>c.status==="APPROVED").length, "success"],
          ["Total Received", `₹${totalPayout.toFixed(0)}`, "success"],
        ].map(([label,val,color]) => (
          <Grid item xs={6} md={3} key={label}>
            <Card sx={{ p:2, textAlign:"center" }}>
              <Typography variant="h4" fontWeight={700} color={color+".main"||"text.primary"}>{val}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {platformData && (
        <Card sx={{ mb:2, bgcolor:"#F0F7FF", border:"1px solid #BBDEFB" }}>
          <CardContent sx={{ py:1.5,"&:last-child":{pb:1.5} }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" fontWeight={600}>{platformData.platform} Platform Status</Typography>
                <Typography variant="caption" color="text.secondary">
                  {platformData.active_workers_today?.toLocaleString()} active workers · Est. ₹{platformData.estimated_daily_income_inr}/day
                </Typography>
              </Box>
              <Box textAlign="right">
                <Chip label={platformData.status?.toUpperCase()} size="small" color={platformData.status==="operational"?"success":"warning"} />
                {platformData.surge_pricing_active && <Chip label="Surge Active" size="small" color="warning" sx={{ ml:0.5 }} />}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
      {activePolicies.length>0 && (
        <Box mb={3}>
          <Typography variant="subtitle1" fontWeight={600} mb={1.5}>Active Policies</Typography>
          {activePolicies.map(p => (
            <Card key={p.id} sx={{ mb:1.5 }}>
              <CardContent sx={{ py:1.5,"&:last-child":{pb:1.5} }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Policy {p.id.slice(0,8)}...</Typography>
                    <Typography variant="caption" color="text.secondary">Valid until {new Date(p.end_date).toLocaleDateString("en-IN")}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography fontWeight={700} color="primary">₹{p.weekly_premium_inr}/wk</Typography>
                    <Typography variant="caption" color="success.main">Max ₹{p.max_payout_inr}</Typography>
                  </Box>
                </Box>
                <LinearProgress variant="determinate" value={75} color="primary"
                  sx={{ height:4, borderRadius:2 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Typography variant="subtitle1" fontWeight={600} mb={1.5}>Claims History</Typography>
      {claims.length===0 ? (
        <Alert severity="info">No claims filed yet.</Alert>
      ) : (
        claims.map(c => (
          <Card key={c.id} sx={{ mb:1.5 }}>
            <CardContent sx={{ py:1.5,"&:last-child":{pb:1.5} }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="body2" fontWeight={600}>{c.disruption_subtype}</Typography>
                    <Chip label={c.status} size="small" color={STATUS_COLOR[c.status]||"default"} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(c.created_at).toLocaleDateString("en-IN")} · Hours lost: {c.hours_lost}h · Fraud score: {(c.fraud_score*100).toFixed(0)}%
                  </Typography>
                  {c.approval_probability!=null && (
                    <Box mt={0.75}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">ML approval confidence</Typography>
                        <Typography variant="caption">{(c.approval_probability*100).toFixed(0)}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={c.approval_probability*100}
                        color={STATUS_COLOR[c.status]||"primary"} sx={{ height:3, borderRadius:2 }} />
                    </Box>
                  )}
                </Box>
                <Box textAlign="right" ml={2}>
                  <Typography fontWeight={700} color={c.payout_inr>0?"success.main":"text.secondary"}>
                    {c.payout_inr>0?`₹${c.payout_inr}`:"₹0"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Container>
  );
}
