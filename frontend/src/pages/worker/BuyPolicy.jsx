import React, { useState } from "react";
import { Box, Typography, Button, Grid, Card, CardContent, CircularProgress,
  Alert, Divider, TextField, MenuItem, Container, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { policiesAPI, integrationsAPI } from "../../services/api";

const WEEK_OPTIONS = [
  { weeks:1, label:"1 Week", badge:"" },
  { weeks:2, label:"2 Weeks", badge:"" },
  { weeks:4, label:"4 Weeks", badge:"Most Popular" },
  { weeks:8, label:"8 Weeks", badge:"Best Value" },
  { weeks:12, label:"12 Weeks", badge:"" },
];

export default function BuyPolicy({ worker, onComplete }) {
  const [selectedWeeks, setSelectedWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState("");
  const [payMethod, setPayMethod] = useState("UPI");

  if (!worker) return (
    <Container maxWidth="sm" sx={{ py:6, textAlign:"center" }}>
      <Typography fontSize="3rem">🛡️</Typography>
      <Typography color="text.secondary" mt={2}>Please complete registration first to buy a policy.</Typography>
    </Container>
  );

  const weeklyPremium = worker.weekly_premium_inr || 55;
  const total = weeklyPremium * selectedWeeks;

  const handleBuy = async () => {
    setLoading(true); setError("");
    try {
      const r = await policiesAPI.create({ worker_id:worker.id, persona:worker.persona, weeks:selectedWeeks });
      const pol = r.data.policy;
      // Mock payment collection
      await integrationsAPI.collectPremium({
        worker_id: worker.id, policy_id: pol.id,
        amount_inr: pol.total_premium_inr, method: payMethod,
      }).catch(() => {});
      setPolicy(pol);
    } catch (e) {
      setError(e.response?.data?.detail || "Could not create policy. Please try again.");
    } finally { setLoading(false); }
  };

  if (policy) return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box textAlign="center" mb={3}>
        <CheckCircleIcon sx={{ fontSize:56, color:"success.main" }} />
        <Typography variant="h5" fontWeight={700} mt={1}>Policy Activated!</Typography>
        <Typography color="text.secondary">Your income is now protected</Typography>
      </Box>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>Policy Details</Typography>
          {[
            ["Policy ID", policy.id.slice(0,12)+"..."],
            ["Status", "ACTIVE"],
            ["Duration", policy.weeks+" weeks"],
            ["Weekly Premium", "₹"+policy.weekly_premium_inr],
            ["Total Paid", "₹"+policy.total_premium_inr],
            ["Max Payout", "₹"+policy.max_payout_inr],
            ["Valid Until", new Date(policy.end_date).toLocaleDateString("en-IN")],
          ].map(([k,v]) => (
            <Box key={k} display="flex" justifyContent="space-between" py={0.75} sx={{ borderBottom:"1px solid #F0F0F0" }}>
              <Typography variant="body2" color="text.secondary">{k}</Typography>
              <Typography variant="body2" fontWeight={600}>{v}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
      <Alert severity="success" sx={{ mt:2 }}>
        You will receive automatic UPI payouts when disruptions are detected in your area.
      </Alert>
      <Button fullWidth variant="outlined" sx={{ mt:2 }} onClick={() => onComplete(policy)}>
        Track My Policy →
      </Button>
    </Container>
  );

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} mb={0.5}>Buy Policy</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Weekly income protection for {worker.name}</Typography>

      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}

      <Card sx={{ mb:2, bgcolor:"#F0F7FF", border:"1px solid #BBDEFB" }}>
        <CardContent sx={{ py:1.5,"&:last-child":{pb:1.5} }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography fontWeight={600}>{worker.name}</Typography>
              <Typography variant="caption" color="text.secondary">{worker.platform} · {worker.city}</Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="h6" fontWeight={700} color="primary">₹{weeklyPremium}/week</Typography>
              <Chip label={worker.risk_level||"MEDIUM"} size="small" color={worker.risk_level==="LOW"?"success":worker.risk_level==="HIGH"?"error":"warning"} />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Typography fontWeight={600} mb={1.5}>Choose Duration</Typography>
      <Grid container spacing={1} mb={3}>
        {WEEK_OPTIONS.map(opt => (
          <Grid item xs={12} key={opt.weeks}>
            <Card onClick={() => setSelectedWeeks(opt.weeks)} sx={{
              cursor:"pointer", border: selectedWeeks===opt.weeks ? "2px solid #1976D2" : "1px solid #E8ECF0",
              bgcolor: selectedWeeks===opt.weeks ? "#E3F2FD" : "white",
              "&:hover":{ borderColor:"#1976D2" }, transition:"all 0.15s"
            }}>
              <CardContent sx={{ py:1.5,"&:last-child":{pb:1.5} }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontWeight={600}>{opt.label}</Typography>
                    {opt.badge && <Chip label={opt.badge} size="small" color="primary" variant="outlined" sx={{ fontSize:"0.65rem",height:20 }} />}
                  </Box>
                  <Typography fontWeight={700} color="primary">₹{weeklyPremium*opt.weeks}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb:2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>Payment Summary</Typography>
          {[["Weekly Premium","₹"+weeklyPremium],["Duration",selectedWeeks+" weeks"],["Max Coverage","₹"+(worker.max_payout_inr||1500)]].map(([k,v]) => (
            <Box key={k} display="flex" justifyContent="space-between" py={0.5}>
              <Typography variant="body2" color="text.secondary">{k}</Typography>
              <Typography variant="body2">{v}</Typography>
            </Box>
          ))}
          <Divider sx={{ my:1 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight={600}>Total</Typography>
            <Typography fontWeight={700} variant="h6" color="primary">₹{total}</Typography>
          </Box>
        </CardContent>
      </Card>

      <TextField fullWidth select label="Payment Method" value={payMethod}
        onChange={e => setPayMethod(e.target.value)} sx={{ mb:2 }}>
        <MenuItem value="UPI">UPI (Google Pay / PhonePe / Paytm)</MenuItem>
        <MenuItem value="NEFT">Net Banking</MenuItem>
        <MenuItem value="CASH">Cash (at center)</MenuItem>
      </TextField>

      <Button fullWidth variant="contained" size="large" onClick={handleBuy} disabled={loading} sx={{ py:1.5 }}>
        {loading ? <CircularProgress size={22} /> : `Pay ₹${total} & Activate Policy`}
      </Button>
    </Container>
  );
}
