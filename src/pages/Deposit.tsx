import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSuperCache } from "@/hooks/useSuperCache";

const Deposit = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [depositType, setDepositType] = useState<'bank' | 'crypto'>('bank');
  const [cryptoType, setCryptoType] = useState<'USDT' | 'BTC' | 'ETH'>('USDT');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  const { get, set } = useSuperCache();

  useEffect(() => {
    const cachedUser = get<string>("deposit-user");
    if (cachedUser) {
      setUserId(cachedUser);
    } else {
      const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate("/auth");
        } else {
          setUserId(session.user.id);
          set("deposit-user", session.user.id);
        }
      };
      getSession();
    }
  }, [navigate, get, set]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    let imageUrl = null;
    try {
      // Upload file if present
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `deposit-proof-${userId}-${Date.now()}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage.from('deposit-proofs').upload(fileName, file);
        if (uploadError) throw uploadError;
        imageUrl = data?.path ? supabase.storage.from('deposit-proofs').getPublicUrl(data.path).publicUrl : null;
      }
      const { error } = await supabase.from("deposits").insert({
        user_id: userId,
        amount: Number(amount),
        reference_number: Math.random().toString(36).substring(2, 10),
        transaction_id: Math.random().toString(36).substring(2, 12),
        status: "pending",
        admin_notes: message || null,
        ...(imageUrl ? { payment_proof_url: imageUrl } : {}),
      });
      if (error) throw error;
      toast({ title: "Deposit submitted!", description: "Your deposit is pending approval." });
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err: any) {
      toast({ title: "Deposit failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Champagne Vault</h1>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 flex items-center gap-1"
              onClick={() => window.history.back()}
            >
              <span>←</span> Back
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all border border-amber-500"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 rounded-xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-amber-600/10">
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                    Deposit Funds
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex gap-4 mb-6">
                  <button
                    type="button"
                    className={`flex-1 py-3 rounded-xl border transition-all ${depositType === 'bank' 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
                      : 'bg-white/5 text-white/70 border-white/10 hover:border-amber-500/30'}`}
                    onClick={() => setDepositType('bank')}
                  >
                    <span className="font-medium">Bank Transfer</span>
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-3 rounded-xl border transition-all ${depositType === 'crypto' 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
                      : 'bg-white/5 text-white/70 border-white/10 hover:border-amber-500/30'}`}
                    onClick={() => setDepositType('crypto')}
                  >
                    <span className="font-medium">Crypto</span>
                  </button>
                </div>

                <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
                    How to Deposit
                  </h3>
                  
                  {depositType === 'bank' ? (
                    <ol className="space-y-4">
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">1</div>
                        <div>
                          <p className="font-medium text-white">Send your deposit via <span className="text-green-400">M-Pesa</span>:</p>
                          <div className="mt-2 pl-2 space-y-1">
                            <div className="flex gap-2"><span className="text-amber-400">Paybill:</span> <span className="text-white">123456</span></div>
                            <div className="flex gap-2"><span className="text-amber-400">Account Number:</span> <span className="text-white">your registered email or user ID</span></div>
                          </div>
                          <p className="text-sm text-white/60 mt-2">(Go to M-Pesa → Lipa na M-Pesa → Paybill → Enter details above)</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">2</div>
                        <div>
                          <p className="font-medium text-white">Take a screenshot or photo of your M-Pesa confirmation message.</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">3</div>
                        <div>
                          <p className="font-medium text-white">Forward your payment proof for instant processing:</p>
                          <ul className="mt-2 space-y-1">
                            <li className="flex items-center gap-2">
                              <span className="text-amber-400">•</span>
                              <span className="text-white">Email: </span>
                              <a href="mailto:support@champagnevault.com" className="text-amber-400 hover:underline">support@champagnevault.com</a>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-amber-400">•</span>
                              <span className="text-white">WhatsApp: </span>
                              <a href="https://wa.me/12345678901" className="text-amber-400 hover:underline" target="_blank" rel="noopener noreferrer">+1 234 567 8901</a>
                            </li>
                          </ul>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">4</div>
                        <div>
                          <p className="font-medium text-white">Fill in the amount below and submit to notify our team.</p>
                        </div>
                      </li>
                    </ol>
                  ) : (
                    <ol className="space-y-4">
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">1</div>
                        <div>
                          <p className="font-medium text-white">Select Crypto Type:</p>
                          <select
                            className="mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            value={cryptoType}
                            onChange={e => setCryptoType(e.target.value as any)}
                            disabled={loading}
                          >
                            <option value="USDT">USDT (TRC20)</option>
                            <option value="BTC">BTC (Bitcoin)</option>
                            <option value="ETH">ETH (Ethereum)</option>
                          </select>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">2</div>
                        <div>
                          <p className="font-medium text-white">Send your crypto deposit to:</p>
                          <div className="mt-2 p-3 bg-black/20 rounded-lg border border-white/10">
                            {cryptoType === 'USDT' && (
                              <div className="break-all font-mono text-amber-400">TQ2vXJ7f9sP3mK8tR6hG2uS5wE1zL4dN0cV8bA7jM9pQ3tY6uH</div>
                            )}
                            {cryptoType === 'BTC' && (
                              <div className="break-all font-mono text-amber-400">1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</div>
                            )}
                            {cryptoType === 'ETH' && (
                              <div className="break-all font-mono text-amber-400">0xAbC123DeF456gHiJ789kLmNoPqRsTuVwXyZ012</div>
                            )}
                          </div>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">3</div>
                        <div>
                          <p className="font-medium text-white">Take a screenshot of your transaction confirmation.</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">4</div>
                        <div>
                          <p className="font-medium text-white">Upload your payment proof below and submit to notify our team.</p>
                        </div>
                      </li>
                    </ol>
                  )}

                  <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg border border-green-500/20">
                    <p className="text-green-400 font-semibold">
                      Deposits are processed within <span className="underline">2-8 minutes</span> during business hours.
                    </p>
                    <p className="text-white/70 text-sm mt-2">
                      You will receive a confirmation by email or SMS once your balance is updated. For urgent or large deposits, contact our admin directly after payment.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleDeposit} className="space-y-6">
                  <div>
                    <label className="block text-white/80 mb-2 font-medium">Amount (USD)</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder={depositType === 'crypto' ? 'Enter amount (USD equivalent)' : 'Enter amount (USD)'}
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/5 border-white/10 text-white py-3 px-4 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2 font-medium">
                      Upload Payment Proof {depositType === 'crypto' ? '' : '(optional)'}
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer 
                        ${file ? 'border-amber-500 bg-amber-500/10' : 'border-white/20 hover:border-amber-500/50 bg-white/5'} transition-all`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-3 text-white/60" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                          </svg>
                          <p className="mb-2 text-sm text-white/60"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-white/40">PNG, JPG, PDF (MAX. 5MB)</p>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*,application/pdf" 
                          onChange={e => setFile(e.target.files?.[0] || null)} 
                          className="hidden" 
                          disabled={loading}
                          required={depositType === 'crypto'}
                        />
                      </label>
                    </div>
                    {file && (
                      <div className="mt-3 flex items-center gap-2 text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{file.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2 font-medium">Message to Admin (optional)</label>
                    <textarea
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      rows={3}
                      placeholder={depositType === 'crypto' ? 'E.g. Crypto transaction hash, extra info, etc.' : 'E.g. Transaction reference, extra info, etc.'}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-lg shadow-amber-500/20 transition-all"
                    disabled={loading || !userId}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      "Submit Deposit"
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center text-white/60 text-sm">
                  <p>Need help? Contact support at <a href="mailto:support@champagnevault.com" className="text-amber-400 hover:underline">support@champagnevault.com</a></p>
                  <p className="mt-1">Minimum deposit: $10 | Maximum per transaction: $10,000</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1 space-y-6">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 rounded-xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-amber-600/10">
                <CardTitle className="text-lg font-bold text-white">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-center py-8 text-white/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No recent deposits</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10 rounded-xl shadow-xl overflow-hidden">
              <CardHeader className="border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-amber-600/10">
                <CardTitle className="text-lg font-bold text-white">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/investments')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">View Investments</p>
                      <p className="text-xs text-white/60">Explore investment opportunities</p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/withdraw')}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">Withdraw Funds</p>
                      <p className="text-xs text-white/60">Request a withdrawal</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposit;