import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Button } from "@/components/ui";
import { Calculator, AlertCircle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

function generateBasicFingerprint() {
  const str = navigator.userAgent + window.screen.width + window.screen.height + navigator.language;
  return btoa(str).substring(0, 32);
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const deviceInfo = {
    browser: navigator.userAgent.split(' ')[0],
    os: navigator.platform,
    resolution: `${window.screen.width}x${window.screen.height}`,
    ip: "Client IP"
  };

  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    loginMutation.mutate({
      data: {
        username,
        password,
        deviceFingerprint: generateBasicFingerprint(),
        deviceInfo
      }
    }, {
      onSuccess: (res) => {
        localStorage.setItem("ftth_token", res.token);
        window.location.href = "/";
      },
      onError: (err: any) => {
        setErrorMsg(err?.message || "Invalid credentials or device blocked.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar relative overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/login-bg.png`} 
          alt="Tech Background" 
          className="w-full h-full object-cover opacity-20"
          onError={(e) => e.currentTarget.style.display = 'none'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/95 to-sidebar/40" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 px-4"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-red-900 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/30 mb-6">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">FTTH Calculator</h1>
          <p className="text-sidebar-foreground/70">Optical Power Budget Engineering Tool</p>
        </div>

        <Card className="border-sidebar-border bg-card/95 backdrop-blur shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Secure Login</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access the tool.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  type="text" 
                  required 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/50"
                />
              </div>

              <div className="bg-muted/50 rounded-xl p-4 border border-border mt-4">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  Device Binding Active
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">OS:</span>
                  <span className="font-mono text-foreground text-right truncate">{deviceInfo.os}</span>
                  <span className="text-muted-foreground">Screen:</span>
                  <span className="font-mono text-foreground text-right">{deviceInfo.resolution}</span>
                </div>
              </div>

              <Button type="submit" className="w-full text-lg h-12 mt-2" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Authenticating..." : "Login to System"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
