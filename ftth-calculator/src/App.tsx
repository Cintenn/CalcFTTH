import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import FindRatio from "@/pages/find-ratio";
import SplitterRatio from "@/pages/splitter-ratio";
import JalurLurus from "@/pages/jalur-lurus";
import JalurPercabangan from "@/pages/jalur-percabangan";
import MixRatio from "@/pages/mix-ratio";
import History from "@/pages/history";
import AdminUsers from "@/pages/admin-users";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

// Setup Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  }
});

// Global Fetch Interceptor to inject the ftth_token seamlessly into Orval's generated client
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem("ftth_token");
  if (token) {
    init = init || {};
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  
  const response = await originalFetch(input, init);
  
  // If API returns 401 Unauthorized, clear token and push to login
  if (response.status === 401 && !input.toString().includes('/api/auth/login')) {
    localStorage.removeItem("ftth_token");
    window.location.href = "/login";
  }
  
  return response;
};

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, setLocation] = useLocation();
  const isAuthenticated = !!localStorage.getItem("ftth_token");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/find-ratio" component={() => <ProtectedRoute component={FindRatio} />} />
      <Route path="/splitter-ratio" component={() => <ProtectedRoute component={SplitterRatio} />} />
      <Route path="/jalur-lurus" component={() => <ProtectedRoute component={JalurLurus} />} />
      <Route path="/jalur-percabangan" component={() => <ProtectedRoute component={JalurPercabangan} />} />
      <Route path="/mix-ratio" component={() => <ProtectedRoute component={MixRatio} />} />
      <Route path="/history" component={() => <ProtectedRoute component={History} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsers} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
