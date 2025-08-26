import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSuperCache } from "@/hooks/useSuperCache";

const staticPackages = [
  { name: "Beginer", returns_percentage: 8, duration_weeks: 12, price: 20 },
  { name: "Bronze", returns_percentage: 15, duration_weeks: 24, price: 100 },
  { name: "Silver", returns_percentage: 25, duration_weeks: 48, price: 500 },
  { name: "Gold", returns_percentage: 40, duration_weeks: 72, price: 1000 },
  { name: "Platinum", returns_percentage: 60, duration_weeks: 96, price: 5000 }
];

const Investments = () => {
  const [packages, setPackages] = useState<any[]>(staticPackages);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userInvestments, setUserInvestments] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { get, set, clear } = useSuperCache();

  useEffect(() => {
    const cachedPackages = get<any[]>("investment-packages");
    const cachedBalance = get<number>("user-balance");
    if (cachedPackages && cachedPackages.length > 0) setPackages(cachedPackages);
    if (cachedBalance !== undefined) setBalance(cachedBalance);
    fetchBalance();
    fetchUserInvestments();
    setLoading(false);
    // eslint-disable-next-line
  }, []);

  // If user navigated with a selected package name, pre-select it
  useEffect(() => {
    const state = (window.history.state && window.history.state.usr) || {};
    if (state.selectedPackage) {
      // Try to find by name (case-insensitive)
      const pkg = packages.find(p => p.name?.toLowerCase() === state.selectedPackage.toLowerCase());
      if (pkg) setSelectedId(pkg.id || pkg.name);
    }
  }, [packages]);

  const fetchPackages = async () => {
    const { data, error } = await supabase.from("investment_packages").select("*").eq("is_active", true);
    if (error) toast({ title: "Error loading investments", description: error.message, variant: "destructive" });
    setPackages(data || []);
    set("investment-packages", data || []);
  };

  const fetchBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data, error } = await supabase.from("profiles").select("balance").eq("user_id", session.user.id).single();
    if (!error && data) {
      setBalance(data.balance);
      set("user-balance", data.balance);
    }
  };

  const fetchUserInvestments = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data, error } = await supabase.from("user_investments").select("* , investment_packages(*)").eq("user_id", session.user.id).order("purchase_date", { ascending: false });
    if (!error && data) setUserInvestments(data);
  };

  const handleInvest = async () => {
    if (!selectedId) {
      toast({ title: "Select an investment package first." });
      return;
    }
    const pkg = packages.find(p => p.id === selectedId);
    if (!pkg) return;
    if (balance < pkg.price) {
      toast({ title: "Insufficient balance", description: "Deposit more funds to invest.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    // Deduct balance
    const { error: updateError } = await supabase.from("profiles").update({ balance: balance - pkg.price }).eq("user_id", session.user.id);
    // Add investment
    const { error: investError } = await supabase.from("user_investments").insert({ user_id: session.user.id, package_id: pkg.id, amount_invested: pkg.price, status: "active" });
    if (updateError || investError) {
      toast({ title: "Investment failed", description: (updateError || investError)?.message, variant: "destructive" });
    } else {
      toast({ title: "Investment successful!" });
      setBalance(balance - pkg.price);
      set("user-balance", balance - pkg.price);
      fetchUserInvestments();
    }
    setLoading(false);
  };

  // Function to get package color based on name
  const getPackageColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'bronze': return 'from-amber-700 to-amber-800 border-amber-600';
      case 'silver': return 'from-gray-300 to-gray-400 border-gray-300';
      case 'gold': return 'from-yellow-400 to-yellow-500 border-yellow-400';
      case 'platinum': return 'from-gray-200 to-gray-300 border-gray-100';
      default: return 'from-blue-500 to-blue-600 border-blue-400';
    }
  };

  // Function to get package text color based on name
  const getPackageTextColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'bronze': return 'text-amber-100';
      case 'silver': return 'text-gray-800';
      case 'gold': return 'text-yellow-900';
      case 'platinum': return 'text-gray-800';
      default: return 'text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Navigation */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            type="button"
            className="px-4 py-3 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-600 backdrop-blur-sm transition-all duration-300 hover:shadow-lg flex items-center gap-2"
            onClick={() => window.history.back()}
          >
            <span>←</span> Back
          </button>
          <button
            type="button"
            className="px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30 flex items-center gap-2"
            onClick={() => navigate('/dashboard')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Dashboard
          </button>
          <button
            type="button"
            className="px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2"
            onClick={() => navigate('/deposit')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Make Deposit
          </button>
        </div>

        {/* Main Card */}
        <Card className="bg-slate-800/70 border-slate-600 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          <CardHeader className="border-b border-slate-600/50">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
              Premium Investment Packages
            </CardTitle>
            <div className="mt-2 text-slate-300 text-md">
              Select an investment package below and click Invest. Our expert team manages all investments with guaranteed returns.
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Balance Display */}
            <div className="flex items-center justify-between p-4 mb-6 rounded-xl bg-slate-700/50 backdrop-blur-sm border border-slate-600/50">
              <div className="text-lg font-medium">Your Available Balance:</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                ${balance.toLocaleString()}
              </div>
            </div>

            {balance === 0 && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 text-red-100 rounded-xl text-center backdrop-blur-sm">
                You have no balance. Please <button className="underline font-bold text-amber-400 hover:text-amber-300 transition-colors" onClick={() => navigate('/deposit')}>deposit funds</button> to invest.
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
              </div>
            ) : (
              <>
                {/* Investment Packages Grid */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-slate-200">Select a Package</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {packages.map(pkg => {
                      const id = pkg.id || pkg.name;
                      const isSelected = selectedId === id;
                      const colorClass = getPackageColor(pkg.name);
                      const textColor = getPackageTextColor(pkg.name);
                      
                      return (
                        <div 
                          key={id} 
                          className={`relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer transform ${isSelected ? 'scale-105 shadow-xl ring-2 ring-amber-400' : 'hover:scale-105'}`}
                          onClick={() => setSelectedId(id)}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-90`}></div>
                          <div className="relative z-10 p-6 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                              <span className={`text-xl font-bold ${textColor}`}>{pkg.name}</span>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-white' : 'bg-white/30'}`}>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-auto">
                              <div className={`text-3xl font-bold mb-2 ${textColor}`}>${pkg.price}</div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className={textColor}>Returns:</span>
                                  <span className={`font-semibold ${textColor}`}>{pkg.returns_percentage}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={textColor}>Duration:</span>
                                  <span className={`font-semibold ${textColor}`}>{pkg.duration_weeks || pkg.duration_months} weeks</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Invest Button */}
                <div className="flex justify-center mb-10">
                  <Button 
                    onClick={handleInvest} 
                    disabled={loading || !selectedId || (selectedId && balance < (packages.find(p => p.id === selectedId)?.price || 0))}
                    className="px-8 py-3 rounded-xl text-lg font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Invest Now"
                    )}
                  </Button>
                </div>

                {/* User Investments Section */}
                <div className="mt-12 pt-8 border-t border-slate-600/50">
                  <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">Your Investment Portfolio</h3>
                  {userInvestments.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-lg">You haven't made any investments yet.</p>
                      <p className="mt-2">Select a package above to start building your portfolio.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-600/50 backdrop-blur-sm">
                      <table className="min-w-full divide-y divide-slate-600/50">
                        <thead className="bg-slate-700/50">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Package</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Returns</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Duration</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Start Date</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Maturity</th>
                          </tr>
                        </thead>
                        <tbody className="bg-slate-800/30 divide-y divide-slate-600/50">
                          {userInvestments.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`h-3 w-3 rounded-full mr-2 ${getPackageColor(inv.investment_packages?.name || '').split(' ')[0]}`}></div>
                                  <span className="font-medium">{inv.investment_packages?.name || '-'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-semibold text-amber-400">${inv.amount_invested}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="bg-emerald-900/30 text-emerald-400 py-1 px-2 rounded-full text-xs font-medium">
                                  {inv.investment_packages?.returns_percentage}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {inv.investment_packages?.duration_weeks || inv.investment_packages?.duration_months} weeks
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.status === 'active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                  {inv.status || 'active'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                {inv.purchase_date ? new Date(inv.purchase_date).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                                {inv.maturity_date ? new Date(inv.maturity_date).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 text-sm text-slate-400 max-w-3xl mx-auto text-center backdrop-blur-sm bg-slate-800/30 p-6 rounded-2xl border border-slate-600/50">
          <p className="mb-3">All investments are managed by our expert team. Returns and durations are guaranteed as per package details. You can track your investments and maturity dates here.</p>
          <p>Need help? Contact our support team at <a href="mailto:support@champagnevault.com" className="text-amber-400 hover:text-amber-300 underline transition-colors">support@champagnevault.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default Investments;