import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSuperCache } from "@/hooks/useSuperCache";

const Withdrawal = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [method, setMethod] = useState("mpesa");
  const [destination, setDestination] = useState("");
  const [bankName, setBankName] = useState("");
  const [cryptoType, setCryptoType] = useState("USDT");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const { get, set } = useSuperCache();

  useEffect(() => {
    const cachedUser = get<string>("withdrawal-user");
    const cachedBalance = get<number>("user-balance");
    const cachedWithdrawals = get<any[]>("withdrawal-history");
    if (cachedUser) setUserId(cachedUser);
    else {
      const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) navigate("/auth");
        else {
          setUserId(session.user.id);
          set("withdrawal-user", session.user.id);
        }
      };
      getSession();
    }
    if (cachedBalance !== undefined) setBalance(cachedBalance);
    else fetchBalance();
    if (cachedWithdrawals) setWithdrawals(cachedWithdrawals);
    else fetchWithdrawals();
    // eslint-disable-next-line
  }, [navigate, get, set]);

  const fetchBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data, error } = await supabase.from("profiles").select("balance").eq("user_id", session.user.id).single();
    if (!error && data) {
      setBalance(data.balance);
      set("user-balance", data.balance);
    }
  };

  const fetchWithdrawals = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data, error } = await supabase.from("withdrawals").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
    if (!error && data) {
      setWithdrawals(data);
      set("withdrawal-history", data);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const amt = Number(amount);
    if (amt < 1) {
      toast({ title: "Invalid amount", description: "Enter a valid withdrawal amount.", variant: "destructive" });
      return;
    }
    if (amt > balance) {
      toast({ title: "Insufficient balance", description: "You cannot withdraw more than your available balance.", variant: "destructive" });
      return;
    }
    if (method === 'bank' && !bankName) {
      toast({ title: "Bank name required", description: "Please enter your bank name for bank withdrawals." });
      return;
    }
    if (method === 'crypto' && !cryptoType) {
      toast({ title: "Crypto type required", description: "Please select the crypto type (USDT, BTC, ETH)." });
      return;
    }
    if (!destination) {
      let msg = '';
      if (method === 'crypto') msg = 'Enter your crypto wallet address.';
      else if (method === 'bank') msg = 'Enter your bank account number.';
      else msg = 'Enter the phone number to withdraw to.';
      toast({ title: "Destination required", description: msg });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("withdrawals").insert({
        user_id: userId,
        amount: amt,
        status: "pending",
        method,
        destination,
        bank_name: method === 'bank' ? bankName : null,
        crypto_type: method === 'crypto' ? cryptoType : null,
      });
      if (error) throw error;
      toast({ title: "Withdrawal submitted!", description: "Your withdrawal is pending approval." });
      set("user-balance", balance - amt);
      setBalance(balance - amt);
      fetchWithdrawals();
      setAmount("");
      setDestination("");
      setBankName("");
      setCryptoType("USDT");
    } catch (err: any) {
      toast({ title: "Withdrawal failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Withdraw Funds
            </h1>
            <p className="text-slate-300 mt-2">Access your earnings quickly and securely</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              className="bg-transparent border-slate-700 hover:bg-slate-800 text-white"
              onClick={() => window.history.back()}
            >
              ← Back
            </Button>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-0"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0"
              onClick={() => navigate('/deposit')}
            >
              Make Deposit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdrawal Form Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"></div>
                Withdraw Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6 p-4 bg-slate-900/50 rounded-lg">
                <div>
                  <p className="text-slate-400 text-sm">Available Balance</p>
                  <p className="text-2xl font-bold text-white">${balance.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="mb-6 text-slate-300 text-sm p-3 bg-slate-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Withdrawals are processed within 2-8 minutes. Minimum withdrawal is $1.
              </div>
              
              <form onSubmit={handleWithdraw} className="space-y-5">
                <div>
                  <label className="block mb-2 font-medium text-slate-300">Withdrawal Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${method === 'mpesa' ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                      onClick={() => setMethod("mpesa")}
                    >
                      M-Pesa
                    </button>
                    <button
                      type="button"
                      className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${method === 'bank' ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                      onClick={() => setMethod("bank")}
                    >
                      Bank Transfer
                    </button>
                    <button
                      type="button"
                      className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${method === 'crypto' ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                      onClick={() => setMethod("crypto")}
                    >
                      Crypto
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block mb-2 font-medium text-slate-300">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-8 py-3 bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                {method === 'mpesa' && (
                  <div>
                    <label className="block mb-2 font-medium text-slate-300">M-Pesa Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="e.g. 0712 345 678"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      required
                      disabled={loading}
                      className="py-3 bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
                
                {method === 'bank' && (
                  <>
                    <div>
                      <label className="block mb-2 font-medium text-slate-300">Bank Name</label>
                      <Input
                        type="text"
                        placeholder="Enter bank name (e.g. Equity, KCB, etc)"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        required
                        disabled={loading}
                        className="py-3 bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-medium text-slate-300">Account Number</label>
                      <Input
                        type="text"
                        placeholder="Enter bank account number"
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                        required
                        disabled={loading}
                        className="py-3 bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}
                
                {method === 'crypto' && (
                  <>
                    <div>
                      <label className="block mb-2 font-medium text-slate-300">Crypto Type</label>
                      <select
                        className="w-full border border-slate-700 rounded-lg px-4 py-3 bg-slate-800 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        value={cryptoType}
                        onChange={e => setCryptoType(e.target.value)}
                        disabled={loading}
                      >
                        <option value="USDT">USDT (Tether)</option>
                        <option value="BTC">BTC (Bitcoin)</option>
                        <option value="ETH">ETH (Ethereum)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 font-medium text-slate-300">Wallet Address</label>
                      <Input
                        type="text"
                        placeholder={`Enter ${cryptoType} wallet address`}
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                        required
                        disabled={loading}
                        className="py-3 bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-base shadow-lg transition-all duration-200 transform hover:-translate-y-0.5" 
                  disabled={loading || !userId}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Withdraw Funds
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Withdrawal History Card */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-xl h-fit">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-orange-400 rounded-full"></div>
                Withdrawal History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {withdrawals.length === 0 ? (
                <div className="text-slate-400 text-center py-8 flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No withdrawals yet</p>
                  <p className="text-sm mt-1">Your withdrawal history will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Amount</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Method</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {withdrawals.map((w, i) => (
                        <tr key={w.id || i} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">${w.amount}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${w.method === 'mpesa' ? 'bg-green-500/20' : w.method === 'bank' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                                {w.method === 'mpesa' ? (
                                  <span className="text-xs font-medium text-green-400">M</span>
                                ) : w.method === 'bank' ? (
                                  <span className="text-xs font-medium text-blue-400">B</span>
                                ) : (
                                  <span className="text-xs font-medium text-purple-400">C</span>
                                )}
                              </span>
                              <span className="capitalize">{w.method || 'mpesa'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${w.status === 'approved' ? 'bg-green-500/20 text-green-400' : w.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {w.created_at ? new Date(w.created_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-sm text-slate-400 max-w-2xl mx-auto text-center p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Withdrawals are only possible if you have sufficient balance. For help, contact <a href="mailto:support@champagnevault.com" className="text-purple-400 hover:underline">support@champagnevault.com</a>
        </div>
      </div>
    </div>
  );
};

export default Withdrawal;