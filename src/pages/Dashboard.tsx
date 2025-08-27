import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSuperCache } from "@/hooks/useSuperCache";
import { 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  LogOut, 
  Plus,
  Wine,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  balance: number;
  is_admin: boolean;
}

interface InvestmentPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  returns_percentage: number;
  duration_months: number;
  is_active: boolean;
}

interface Deposit {
  id: string;
  amount: number;
  status: string;
  bonus_amount: number;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { get, set, clear } = useSuperCache();

  useEffect(() => {
    let unsub: any = null;
    const cachedUser = get<User>("dashboard-user");
    const cachedProfile = get<Profile>("dashboard-profile");
    const cachedPackages = get<InvestmentPackage[]>("dashboard-packages");
    const cachedDeposits = get<Deposit[]>("dashboard-deposits");
    const cachedWithdrawals = get<Withdrawal[]>("dashboard-withdrawals");
    // Show cached data immediately if available
    if (cachedUser) setUser(cachedUser);
    if (cachedProfile) setProfile(cachedProfile);
    if (cachedPackages) setPackages(cachedPackages);
    if (cachedDeposits) setDeposits(cachedDeposits);
    if (cachedWithdrawals) setWithdrawals(cachedWithdrawals);
    setLoading(!(cachedUser && cachedProfile && cachedPackages && cachedDeposits && cachedWithdrawals));

    // Always fetch fresh data in background
    const getSessionAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        set("dashboard-user", session.user);
        fetchUserDataParallel(session.user.id);
      } else {
        navigate("/auth");
      }
    };
    getSessionAndFetch();

    unsub = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          set("dashboard-user", session.user);
          fetchUserDataParallel(session.user.id);
        } else {
          navigate("/auth");
        }
      }
    );
    return () => {
      if (unsub && unsub.data && unsub.data.subscription) unsub.data.subscription.unsubscribe();
    };
    // eslint-disable-next-line
  }, [navigate]);

  // Fetch all user data in parallel for speed
  const fetchUserDataParallel = async (userId: string) => {
    setLoading(true);
    try {
      const [profileRes, packagesRes, depositsRes, withdrawalsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("investment_packages").select("*").eq("is_active", true).order("price", { ascending: true }),
        supabase.from("deposits").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
        supabase.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      ]);
      if (!profileRes.error && profileRes.data) {
        setProfile(profileRes.data);
        set("dashboard-profile", profileRes.data);
      }
      if (!packagesRes.error && packagesRes.data) {
        setPackages(packagesRes.data);
        set("dashboard-packages", packagesRes.data);
      }
      if (!depositsRes.error && depositsRes.data) {
        setDeposits(depositsRes.data);
        set("dashboard-deposits", depositsRes.data);
      }
      if (!withdrawalsRes.error && withdrawalsRes.data) {
        setWithdrawals(withdrawalsRes.data);
        set("dashboard-withdrawals", withdrawalsRes.data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData);
      set("dashboard-profile", profileData);

      // Fetch investment packages
      const { data: packagesData, error: packagesError } = await supabase
        .from("investment_packages")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      if (packagesError) throw packagesError;
      setPackages(packagesData || []);
      set("dashboard-packages", packagesData || []);

      // Fetch recent deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from("deposits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (depositsError) throw depositsError;
      setDeposits(depositsData || []);
      set("dashboard-deposits", depositsData || []);

      // Fetch recent withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (withdrawalsError) throw withdrawalsError;
      setWithdrawals(withdrawalsData || []);
      set("dashboard-withdrawals", withdrawalsData || []);

    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-champagne/5 via-burgundy/5 to-gold/5">
        <div className="text-center space-y-4">
          <div className="relative">
            <Wine className="h-16 w-16 text-gold mx-auto animate-pulse" />
            <Sparkles className="h-6 w-6 text-gold absolute -top-2 -right-2 animate-ping" />
          </div>
          <p className="text-muted-foreground font-light">Loading your champagne portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-champagne/5 via-burgundy/5 to-gold/5">
        {/* Header */}
        <header className="bg-gradient-to-r from-burgundy/90 to-burgundy-dark/90 backdrop-blur-md border-b border-gold/20 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Wine className="h-10 w-10 text-gold" />
                <Sparkles className="h-4 w-4 text-gold absolute -top-1 -right-1" />
              </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-gold">Champagne Vault</h1>
              <p className="text-sm text-champagne/80 font-light">Premium Investments</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gold font-bold">Welcome, {profile?.full_name}</span>
            <Button variant="gold" size="sm" onClick={handleSignOut} className="flex items-center gap-1 text-gold">
              <LogOut className="h-4 w-4 text-gold" />
              <span className="text-gold font-bold">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">

        
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-gold/30 bg-gradient-to-br from-champagne/5 to-burgundy/5 backdrop-blur-sm shadow-md overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -translate-y-16 translate-x-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-burgundy-dark">Available Balance</CardTitle>
              <div className="p-2 bg-gold/10 rounded-full">
                <Wallet className="h-5 w-5 text-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif font-bold text-gold mb-1">
                ${profile?.balance?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-burgundy/70 font-light">Ready for investment</p>
            </CardContent>
          </Card>

          <Card className="border-gold/30 bg-gradient-to-br from-champagne/5 to-burgundy/5 backdrop-blur-sm shadow-md overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-burgundy-dark">Total Deposits</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-full">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif font-bold text-green-600 mb-1">
                ${deposits.reduce((sum, d) => d.status === 'approved' ? sum + Number(d.amount) : sum, 0).toFixed(2)}
              </div>
              <p className="text-xs text-burgundy/70 font-light">+5% bonus applied</p>
            </CardContent>
          </Card>

          <Card className="border-gold/30 bg-gradient-to-br from-champagne/5 to-burgundy/5 backdrop-blur-sm shadow-md overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-burgundy-dark">Active Investments</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif font-bold text-blue-600 mb-1">0</div>
              <p className="text-xs text-burgundy/70 font-light">Investment packages</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-gold/30 bg-gradient-to-br from-champagne/10 to-burgundy/10 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="text-burgundy-dark">Quick Actions</CardTitle>
            <CardDescription className="text-burgundy/70">Manage your investments and account</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button onClick={() => navigate("/deposit")} className="flex items-center gap-2 rounded-full px-6 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold shadow-md transition-all">
              <Plus className="h-5 w-5" />
              Make Deposit
            </Button>
            <Button variant="outline" onClick={() => navigate("/withdrawal")} className="flex items-center gap-2 rounded-full px-6 border-burgundy/30 text-burgundy hover:bg-burgundy/5">  
              <ArrowDownLeft className="h-5 w-5" />
              Request Withdrawal
            </Button>
            <Button onClick={() => navigate('/investments')} variant="gold" className="flex items-center gap-2 rounded-full px-6 py-3 shadow-lg hover:shadow-gold/20 transition-all">
              <Wine className="w-5 h-5" />
              <span>Explore Investments</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            {profile?.is_admin && (
              <Button variant="secondary" onClick={() => navigate("/admin")} className="rounded-full px-6 bg-burgundy/10 text-burgundy hover:bg-burgundy/20">
                Admin Panel
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Investment Packages */}
        <Card className="border-gold/30 bg-gradient-to-br from-champagne/10 to-burgundy/10 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="text-burgundy-dark">Available Investment Packages</CardTitle>
            <CardDescription className="text-burgundy/70">Choose from our premium investment opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="border-gold/20 bg-white/80 backdrop-blur-sm hover:border-gold/40 transition-all duration-300 hover:shadow-lg overflow-hidden group">
                  <div className="h-2 bg-gradient-to-r from-gold to-gold-dark"></div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-burgundy-dark group-hover:text-burgundy transition-colors">{pkg.name}</CardTitle>
                    <CardDescription className="text-sm text-burgundy/70">{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-serif font-bold text-gold">${pkg.price}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-burgundy/70">Returns:</span>
                        <span className="font-semibold text-green-600">{pkg.returns_percentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-burgundy/70">Duration:</span>
                        <span className="font-semibold text-burgundy">{pkg.duration_months} months</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full rounded-full mt-2 bg-gradient-to-r from-gold to-gold-dark shadow-md hover:shadow-gold/20 transition-all" 
                      size="sm"
                      disabled={!profile?.balance || profile.balance < pkg.price}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Invest Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Deposits */}
          <Card className="border-gold/30 bg-gradient-to-br from-champagne/10 to-burgundy/10 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="text-burgundy-dark">Recent Deposits</CardTitle>
              <CardDescription className="text-burgundy/70">Your latest deposit transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {deposits.length > 0 ? (
                <div className="space-y-3">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gold/10 hover:border-gold/30 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium text-burgundy">${deposit.amount}</p>
                        <p className="text-sm text-burgundy/60">
                          {new Date(deposit.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(deposit.status)} className="rounded-full px-3 py-1">
                        {deposit.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-champagne/20 rounded-full flex items-center justify-center mb-3">
                    <DollarSign className="h-8 w-8 text-burgundy/40" />
                  </div>
                  <p className="text-burgundy/50">No deposits yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Withdrawals */}
          <Card className="border-gold/30 bg-gradient-to-br from-champagne/10 to-burgundy/10 backdrop-blur-sm shadow-md">
            <CardHeader>
              <CardTitle className="text-burgundy-dark">Recent Withdrawals</CardTitle>
              <CardDescription className="text-burgundy/70">Your latest withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals.length > 0 ? (
                <div className="space-y-3">
                  {withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gold/10 hover:border-gold/30 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium text-burgundy">${withdrawal.amount}</p>
                        <p className="text-sm text-burgundy/60">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(withdrawal.status)} className="rounded-full px-3 py-1">
                        {withdrawal.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-champagne/20 rounded-full flex items-center justify-center mb-3">
                    <ArrowDownLeft className="h-8 w-8 text-burgundy/40" />
                  </div>
                  <p className="text-burgundy/50">No withdrawals yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add some custom styles for the color scheme */}
      <style jsx>{`
        :global(.bg-burgundy) { background-color: #7B003F; }
        :global(.bg-burgundy-dark) { background-color: #5A002F; }
        :global(.text-burgundy) { color: #7B003F; }
        :global(.text-burgundy-dark) { color: #5A002F; }
        :global(.border-burgundy) { border-color: #7B003F; }
        
        :global(.bg-gold) { background-color: #D4AF37; }
        :global(.bg-gold-dark) { background-color: #B8860B; }
        :global(.text-gold) { color: #D4AF37; }
        :global(.border-gold) { border-color: #D4AF37; }
        
        :global(.bg-champagne) { background-color: #F7E7CE; }
        :global(.text-champagne) { color: #F7E7CE; }
        
        :global(.bg-gradient-gold) { background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); }
      `}</style>
      </div>
    </>
  );
};

export default Dashboard;