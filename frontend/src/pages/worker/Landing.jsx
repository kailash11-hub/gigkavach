import React from "react";
import { Box, Typography, Button, Grid, Card, CardContent, Container, Chip } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import BoltIcon from "@mui/icons-material/Bolt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import VerifiedIcon from "@mui/icons-material/Verified";

const FEATURES = [
  { icon: <BoltIcon color="primary" />, title: "Instant Payout", desc: "Auto UPI transfer within minutes of a disruption event" },
  { icon: <ShieldIcon color="primary" />, title: "AI Risk Assessment", desc: "PyTorch neural network calculates your personal risk & premium" },
  { icon: <AccountBalanceWalletIcon color="primary" />, title: "Weekly Pricing", desc: "Pay weekly from just ₹35/week — matches your earnings cycle" },
  { icon: <VerifiedIcon color="primary" />, title: "Smart Fraud Detection", desc: "AI ensures only genuine claims are approved" },
];

const PERSONAS = [
  { icon: "🍔", title: "Food Delivery", platforms: "Zomato · Swiggy" },
  { icon: "⚡", title: "Quick Commerce", platforms: "Zepto · Blinkit" },
  { icon: "📦", title: "Package Delivery", platforms: "Amazon · Dunzo · Porter" },
  { icon: "🚗", title: "Rideshare", platforms: "Uber · Ola" },
];

export default function Landing({ onGetStarted }) {
  return (
    <Box sx={{ bgcolor: "#F5F7FA", minHeight: "100vh" }}>
      {/* Hero */}
      <Box sx={{ bgcolor: "#FFFFFF", borderBottom: "1px solid #E8ECF0", py: 8, textAlign: "center" }}>
        <Container maxWidth="md">
          <Chip label="Guidewire DEVTrails 2026" color="primary" size="small" variant="outlined" sx={{ mb: 2 }} />
          <Typography variant="h3" fontWeight={700} color="primary" mb={1}>GigKavach</Typography>
          <Typography variant="h6" color="text.primary" mb={1}>Income Protection for India's Gig Workers</Typography>
          <Typography color="text.secondary" mb={4} maxWidth={500} mx="auto">
            When weather, floods, or curfews stop your work — GigKavach pays you instantly via UPI.
          </Typography>
          <Button variant="contained" size="large" onClick={onGetStarted} sx={{ px: 4, py: 1.5 }}>
            Get Protected Now
          </Button>
          <Box display="flex" gap={4} justifyContent="center" mt={4} flexWrap="wrap">
            {[["40+","Workers Protected"],["₹62K+","Paid Out"],["< 5 min","Payout Speed"],["₹35/wk","Starting From"]].map(([v,l]) => (
              <Box key={l} textAlign="center">
                <Typography variant="h5" fontWeight={700} color="primary">{v}</Typography>
                <Typography variant="caption" color="text.secondary">{l}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Who */}
      <Box py={6}>
        <Container maxWidth="md">
          <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>Built for Every Gig Worker</Typography>
          <Grid container spacing={2}>
            {PERSONAS.map(p => (
              <Grid item xs={6} md={3} key={p.title}>
                <Card sx={{ textAlign: "center", p: 2 }}>
                  <Typography fontSize="2rem">{p.icon}</Typography>
                  <Typography fontWeight={600}>{p.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{p.platforms}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How it works */}
      <Box py={6} sx={{ bgcolor: "#FFFFFF" }}>
        <Container maxWidth="md">
          <Typography variant="h5" fontWeight={600} textAlign="center" mb={4}>How It Works</Typography>
          <Grid container spacing={3}>
            {[
              { n:"1", t:"Register & KYC", d:"Enter your details, platform and city" },
              { n:"2", t:"Get AI Risk Score", d:"PyTorch model calculates your personal premium" },
              { n:"3", t:"Buy Weekly Policy", d:"Pay from ₹35/week via UPI" },
              { n:"4", t:"Get Auto Payout", d:"Instant payment when a disruption is detected" },
            ].map(s => (
              <Grid item xs={6} md={3} key={s.n}>
                <Box textAlign="center">
                  <Box sx={{ width:48,height:48,borderRadius:"50%",bgcolor:"#E3F2FD",mx:"auto",mb:1,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Typography fontWeight={700} color="primary">{s.n}</Typography>
                  </Box>
                  <Typography fontWeight={600} variant="body1">{s.t}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.d}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box py={6}>
        <Container maxWidth="md">
          <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>Why GigKavach?</Typography>
          <Grid container spacing={2}>
            {FEATURES.map(f => (
              <Grid item xs={12} md={6} key={f.title}>
                <Card sx={{ p: 2, display:"flex", gap:2, alignItems:"flex-start" }}>
                  <Box mt={0.5}>{f.icon}</Box>
                  <Box>
                    <Typography fontWeight={600}>{f.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box py={6} sx={{ bgcolor:"#1976D2", textAlign:"center" }}>
        <Container maxWidth="sm">
          <Typography variant="h5" fontWeight={700} color="white" mb={1}>Ready to protect your income?</Typography>
          <Typography color="rgba(255,255,255,0.8)" mb={3}>Join thousands of gig workers already protected</Typography>
          <Button variant="contained" size="large" onClick={onGetStarted}
            sx={{ px:5, bgcolor:"white", color:"#1976D2", "&:hover":{ bgcolor:"#E3F2FD" } }}>
            Get Started
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
