import { useEffect, useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { useSuperCache } from "@/hooks/useSuperCache";


const staticPackages = [
  {
    name: "Starter",
    returns_percentage: 12,
    duration_weeks: 16,
    price: 50,
    tasks: [
      { id: 1, title: "Share our platform on WhatsApp", reward: 2 },
      { id: 2, title: "Like our Facebook page", reward: 2 },
      { id: 3, title: "Follow us on Instagram @champagne_vault (we will verify)", reward: 2 },
      { id: 4, title: "Join our Telegram channel champagnevault (we will verify)", reward: 2 },
      { id: 5, title: "Answer a short questionnaire about your investment interests", reward: 2 },
    ],
  },
  {
    name: "Beginner",
    returns_percentage: 8,
    duration_weeks: 12,
    price: 20,
    tasks: [
      { id: 1, title: "Share our platform on WhatsApp", reward: 1 },
      { id: 2, title: "Like our Facebook page", reward: 1 },
      { id: 3, title: "Follow us on Instagram @champagne_vault (we will verify)", reward: 1 },
      { id: 4, title: "Join our Telegram channel champagnevault (we will verify)", reward: 1 },
      { id: 5, title: "Answer a short questionnaire about your investment goals", reward: 2 },
    ],
  },
  {
    name: "Bronze",
    returns_percentage: 15,
    duration_weeks: 24,
    price: 100,
    tasks: [
      { id: 1, title: "Refer a friend", reward: 5 },
      { id: 2, title: "Post a review on Google", reward: 3 },
      { id: 3, title: "Share on Twitter", reward: 2 },
      { id: 4, title: "Follow us on Instagram @champagne_vault (we will verify)", reward: 2 },
      { id: 5, title: "Join our Telegram channel champagnevault (we will verify)", reward: 2 },
      { id: 6, title: "Complete a short investment knowledge questionnaire", reward: 3 },
    ],
  },
  {
    name: "Silver",
    returns_percentage: 25,
    duration_weeks: 48,
    price: 500,
    tasks: [
      { id: 1, title: "Refer 3 friends", reward: 15 },
      { id: 2, title: "Create a YouTube testimonial", reward: 10 },
      { id: 3, title: "Share on LinkedIn", reward: 5 },
      { id: 4, title: "Follow us on Instagram @champagne_vault (we will verify)", reward: 3 },
      { id: 5, title: "Join our Telegram channel champagnevault (we will verify)", reward: 3 },
      { id: 6, title: "Fill out a detailed investment experience questionnaire", reward: 5 },
    ],
  },
  {
    name: "Gold",
    returns_percentage: 40,
    duration_weeks: 72,
    price: 1000,
    tasks: [
      { id: 1, title: "Refer 5 friends", reward: 25 },
      { id: 2, title: "Write a blog post about us", reward: 20 },
      { id: 3, title: "Host a webinar", reward: 15 },
      { id: 4, title: "Follow us on Instagram @champagne_vault (we will verify)", reward: 5 },
      { id: 5, title: "Join our Telegram channel champagnevault (we will verify)", reward: 5 },
      { id: 6, title: "Complete an advanced investment questionnaire", reward: 8 },
    ],
  },
  {
    name: "Platinum",
    returns_percentage: 60,
    duration_weeks: 96,
    price: 5000,
    tasks: [
      { id: 1, title: "Refer 10 friends", reward: 50 },
      { id: 2, title: "Publish a press release", reward: 40 },
      { id: 3, title: "Organize an event", reward: 30 },
      { id: 4, title: "Follow us on Instagram @champagne_vault (we will verify)", reward: 10 },
      { id: 5, title: "Join our Telegram channel champagnevault (we will verify)", reward: 10 },
      { id: 6, title: "Complete a comprehensive investment questionnaire", reward: 15 },
    ],
  },
];

const Investments = () => {
  const [packages, setPackages] = useState<any[]>(staticPackages);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userInvestments, setUserInvestments] = useState<any[]>([]);
  const [taskStatus, setTaskStatus] = useState<{ [packageId: string]: { [taskId: number]: { status: string, data?: any } } }>({});
  const [showTasks, setShowTasks] = useState<string | null>(null);
  const [questionnaireOpen, setQuestionnaireOpen] = useState<{ [packageId: string]: number | null }>({});
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<{ [packageId: string]: { [taskId: number]: any } }>({});
  const [proofModal, setProofModal] = useState<{ pkgId: string, taskId: number, open: boolean }>({ pkgId: '', taskId: 0, open: false });
  const [proofInput, setProofInput] = useState('');
  const [socialModal, setSocialModal] = useState<{ pkgId: string, taskId: number, open: boolean, platform?: string }>({ pkgId: '', taskId: 0, open: false });
  const [socialInput, setSocialInput] = useState('');
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

  useEffect(() => {
    const state = (window.history.state && window.history.state.usr) || {};
    if (state.selectedPackage) {
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
    const { error: updateError } = await supabase.from("profiles").update({ balance: balance - pkg.price }).eq("user_id", session.user.id);
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

  const getPackageColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'bronze': return 'from-amber-700 to-amber-800 border-amber-600';
      case 'silver': return 'from-gray-300 to-gray-400 border-gray-300';
      case 'gold': return 'from-yellow-400 to-yellow-500 border-yellow-400';
      case 'platinum': return 'from-gray-200 to-gray-300 border-gray-100';
      default: return 'from-blue-500 to-blue-600 border-blue-400';
    }
  };

  const getPackageTextColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'bronze': return 'text-amber-100';
      case 'silver': return 'text-gray-800';
      case 'gold': return 'text-yellow-900';
      case 'platinum': return 'text-gray-800';
      default: return 'text-white';
    }
  };

  const handleSocial = (pkgId: string, taskId: number, platform: string) => {
    setSocialModal({ pkgId, taskId, open: true, platform });
    setSocialInput('');
  };

  const submitSocial = () => {
    setTaskStatus(prev => ({
      ...prev,
      [socialModal.pkgId]: {
        ...(prev[socialModal.pkgId] || {}),
        [socialModal.taskId]: { status: 'pending', data: { username: socialInput, platform: socialModal.platform } }
      }
    }));
    setSocialModal({ pkgId: '', taskId: 0, open: false });
    setSocialInput('');
  };

  const handleProof = (pkgId: string, taskId: number) => {
    setProofModal({ pkgId, taskId, open: true });
    setProofInput('');
  };

  const submitProof = () => {
    setTaskStatus(prev => ({
      ...prev,
      [proofModal.pkgId]: {
        ...(prev[proofModal.pkgId] || {}),
        [proofModal.taskId]: { status: 'pending', data: { proof: proofInput } }
      }
    }));
    setProofModal({ pkgId: '', taskId: 0, open: false });
    setProofInput('');
  };

  const handleQuestionnaire = (pkgId: string, taskId: number) => {
    setQuestionnaireOpen(prev => ({ ...prev, [pkgId]: taskId }));
  };

  const submitQuestionnaire = (pkgId: string, taskId: number, answers: any) => {
    setTaskStatus(prev => ({
      ...prev,
      [pkgId]: {
        ...(prev[pkgId] || {}),
        [taskId]: { status: 'completed', data: { answers } }
      }
    }));
    setQuestionnaireOpen(prev => ({ ...prev, [pkgId]: null }));
    setQuestionnaireAnswers(prev => ({ ...prev, [pkgId]: { ...prev[pkgId], [taskId]: answers } }));
  };

  const handleToggleTasks = (e: React.MouseEvent, pkgId: string) => {
    e.stopPropagation();
    setShowTasks(prev => (prev === pkgId ? null : pkgId));
  };

  const handleTaskDone = (pkgId: string, taskId: number) => {
    if (balance <= 0) {
      toast({
        title: 'Add Funds Required',
        description: 'You need to deposit funds before you can complete tasks.',
        variant: 'warning',
        action: (
          <Button style={{ background: '#FFD600', color: '#222', border: 'none' }} onClick={() => navigate('/deposit')}>Deposit Now</Button>
        )
      });
      return;
    }
    setTaskStatus(prev => ({
      ...prev,
      [pkgId]: {
        ...(prev[pkgId] || {}),
        [taskId]: { status: 'completed' }
      }
    }));
  };

  const renderQuestionnaireModal = (pkgId: string, taskId: number) => {
    const questions = [
      { q: 'What is your main investment goal?', name: 'goal' },
      { q: 'How much do you plan to invest monthly? (in USD)', name: 'amount' },
      { q: 'What is your current occupation or source of income?', name: 'occupation' },
      { q: 'How would you describe your investment experience?', name: 'experience', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
      { q: 'What is your risk tolerance?', name: 'risk', type: 'select', options: ['Low', 'Medium', 'High'] },
      { q: 'What is your preferred investment duration?', name: 'duration', type: 'select', options: ['Less than 1 year', '1-3 years', '3-5 years', '5+ years'] },
      { q: 'Have you invested in digital assets (crypto, stocks, etc.) before?', name: 'digital', type: 'select', options: ['Yes', 'No'] },
      { q: 'Would you like to receive investment tips and updates via email?', name: 'tips', type: 'select', options: ['Yes', 'No'] },
      { q: 'Any additional comments or expectations?', name: 'comments', type: 'textarea' },
    ];
    
    const answers = questionnaireAnswers[pkgId]?.[taskId] || {};
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-gold/30 max-h-[90vh] overflow-y-auto relative">
          <button
            className="absolute top-2 right-2 text-gold text-xl font-bold hover:text-amber-400 focus:outline-none"
            onClick={() => setQuestionnaireOpen(prev => ({ ...prev, [pkgId]: null }))}
            aria-label="Close questionnaire"
          >
            ×
          </button>
          <h3 className="text-lg font-bold mb-4 text-gold">Questionnaire</h3>
          <form onSubmit={(e) => { e.preventDefault(); submitQuestionnaire(pkgId, taskId, answers); }}>
            {questions.map(q => (
              <div key={q.name} className="mb-4">
                <label className="block text-sm mb-1 text-gold">{q.q}</label>
                {q.type === 'select' ? (
                  <select
                    className="w-full p-2 rounded border border-gold/30 bg-black/30 text-white"
                    value={answers[q.name] || ''}
                    onChange={e => setQuestionnaireAnswers(prev => ({
                      ...prev,
                      [pkgId]: { ...prev[pkgId], [taskId]: { ...answers, [q.name]: e.target.value } }
                    }))}
                    required
                  >
                    <option value="" disabled>Select...</option>
                    {q.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : q.type === 'textarea' ? (
                  <textarea
                    className="w-full p-2 rounded border border-gold/30 bg-black/30 text-white"
                    value={answers[q.name] || ''}
                    onChange={e => setQuestionnaireAnswers(prev => ({
                      ...prev,
                      [pkgId]: { ...prev[pkgId], [taskId]: { ...answers, [q.name]: e.target.value } }
                    }))}
                    rows={3}
                  />
                ) : (
                  <input
                    className="w-full p-2 rounded border border-gold/30 bg-black/30 text-white"
                    value={answers[q.name] || ''}
                    onChange={e => setQuestionnaireAnswers(prev => ({
                      ...prev,
                      [pkgId]: { ...prev[pkgId], [taskId]: { ...answers, [q.name]: e.target.value } }
                    }))}
                    required
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setQuestionnaireOpen(prev => ({ ...prev, [pkgId]: null }))}>Cancel</Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {packages.map(pkg => {
                      const id = pkg.id || pkg.name;
                      const isSelected = selectedId === id;
                      const colorClass = getPackageColor(pkg.name);
                      const textColor = getPackageTextColor(pkg.name);
                      const pkgId = id;
                      const pkgTasks = (taskStatus[pkgId] || {});

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
                            <div className={`text-3xl font-bold mb-2 ${textColor}`}>${pkg.price}</div>
                            <div className="space-y-2 mb-2">
                              <div className="flex justify-between">
                                <span className={textColor}>Returns:</span>
                                <span className={`font-semibold ${textColor}`}>{pkg.returns_percentage}%</span>
                              </div>
                              {/* Duration removed as requested */}
                            </div>
                            {/* Toggle tasks view */}
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                type="button"
                                className="text-xs underline text-amber-300 focus:outline-none"
                                onClick={(e) => handleToggleTasks(e, pkgId)}
                              >
                                {showTasks === pkgId ? 'Hide Tasks' : 'View Tasks'}
                              </button>
                              {showTasks === pkgId && (
                                <button
                                  type="button"
                                  className="text-xs text-gold font-bold ml-2 hover:text-amber-400 focus:outline-none"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setShowTasks(null);
                                  }}
                                  aria-label="Close tasks section"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            {showTasks === pkgId && pkg.tasks && (
                              <div className="mb-2">
                                <h4 className="text-sm font-bold mb-2 text-amber-300">Tasks</h4>
                                <ul className="space-y-2">
                                  {pkg.tasks.map((task: any) => {
                                    const status = pkgTasks[task.id]?.status || 'not_started';
                                    let actionBtn = null;
                                    let disabled = status === 'completed' || status === 'pending';
                                    // Social tasks
                                    if (/instagram|telegram|facebook|twitter|linkedin/i.test(task.title)) {
                                      let platform = '';
                                      if (/instagram/i.test(task.title)) platform = 'Instagram';
                                      if (/telegram/i.test(task.title)) platform = 'Telegram';
                                      if (/facebook/i.test(task.title)) platform = 'Facebook';
                                      if (/twitter/i.test(task.title)) platform = 'Twitter';
                                      if (/linkedin/i.test(task.title)) platform = 'LinkedIn';
                                      actionBtn = (
                                        <Button size="sm" variant="outline" className="ml-2" disabled={disabled} onClick={e => {
                                          e.stopPropagation();
                                          if (balance <= 0) {
                                            toast({
                                              title: 'Add Funds Required',
                                              description: 'You need to deposit funds before you can complete tasks.',
                                              variant: 'warning',
                                              action: (
                                                <Button style={{ background: '#FFD600', color: '#222', border: 'none' }} onClick={() => navigate('/deposit')}>Deposit Now</Button>
                                              )
                                            });
                                            return;
                                          }
                                          handleSocial(pkgId, task.id, platform);
                                        }}>
                                          {status === 'completed' ? 'Completed' : status === 'pending' ? 'Pending Verification' : `Submit ${platform} Username`}
                                        </Button>
                                      );
                                    }
                                    // Questionnaire tasks
                                    else if (/questionnaire/i.test(task.title)) {
                                      actionBtn = (
                                        <Button size="sm" variant="outline" className="ml-2" disabled={disabled} onClick={e => {
                                          e.stopPropagation();
                                          if (balance <= 0) {
                                            toast({
                                              title: 'Add Funds Required',
                                              description: 'You need to deposit funds before you can complete tasks.',
                                              variant: 'warning',
                                              action: (
                                                <Button style={{ background: '#FFD600', color: '#222', border: 'none' }} onClick={() => navigate('/deposit')}>Deposit Now</Button>
                                              )
                                            });
                                            return;
                                          }
                                          handleQuestionnaire(pkgId, task.id);
                                        }}>
                                          {status === 'completed' ? 'Completed' : 'Answer'}
                                        </Button>
                                      );
                                    }
                                    // Review/blog/testimonial tasks
                                    else if (/review|blog|testimonial|proof|youtube/i.test(task.title)) {
                                      actionBtn = (
                                        <Button size="sm" variant="outline" className="ml-2" disabled={disabled} onClick={e => {
                                          e.stopPropagation();
                                          if (balance <= 0) {
                                            toast({
                                              title: 'Add Funds Required',
                                              description: 'You need to deposit funds before you can complete tasks.',
                                              variant: 'destructive',
                                              action: (
                                                <Button variant="outline" onClick={() => navigate('/deposit')}>Deposit Now</Button>
                                              )
                                            });
                                            return;
                                          }
                                          handleProof(pkgId, task.id);
                                        }}>
                                          {status === 'completed' ? 'Completed' : status === 'pending' ? 'Pending Verification' : 'Submit Proof'}
                                        </Button>
                                      );
                                    }
                                    // Referral or other tasks
                                    else if (/refer/i.test(task.title)) {
                                      actionBtn = (
                                        <Button size="sm" variant="outline" className="ml-2" disabled>
                                          Referral Required
                                        </Button>
                                      );
                                    } else {
                                      actionBtn = (
                                        <Button size="sm" variant="outline" className="ml-2" disabled={disabled} onClick={e => { e.stopPropagation(); handleTaskDone(pkgId, task.id); }}>
                                          {status === 'completed' ? 'Completed' : 'Mark as Done'}
                                        </Button>
                                      );
                                    }
                                    return (
                                      <li key={task.id} className={`flex flex-col sm:flex-row sm:items-center justify-between bg-black/30 border border-amber-300/20 rounded-lg px-2 py-1 ${status === 'completed' ? 'opacity-60 line-through' : ''}`}>
                                        <div className="flex-1">
                                          <span className="text-xs">{task.title}</span>
                                          <span className="text-amber-300 font-bold text-xs ml-2">+${task.reward}</span>
                                        </div>
                                        <div className="mt-1 sm:mt-0">
                                          {actionBtn}
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
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
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Package</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Returns</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Duration</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Start Date</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Maturity</th>
                          </tr>
                        </thead>
                        <tbody className="bg-slate-800/30 divide-y divide-slate-600/50">
                          {userInvestments.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-700/30 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`h-3 w-3 rounded-full mr-2 ${getPackageColor(inv.investment_packages?.name || '').split(' ')[0]}`}></div>
                                  <span className="font-medium">{inv.investment_packages?.name || '-'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="font-semibold text-amber-400">${inv.amount_invested}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="bg-emerald-900/30 text-emerald-400 py-1 px-2 rounded-full text-xs font-medium">
                                  {inv.investment_packages?.returns_percentage}%
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {inv.investment_packages?.duration_weeks || inv.investment_packages?.duration_months} weeks
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.status === 'active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                  {inv.status || 'active'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                                {inv.purchase_date ? new Date(inv.purchase_date).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-slate-400">
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

        {/* Social Modal */}
        {socialModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-amber-300/30">
              <h3 className="text-lg font-bold mb-2 text-amber-300">Submit {socialModal.platform} Username</h3>
              <input
                className="w-full p-3 rounded border border-amber-300/30 bg-black/30 text-white mb-4"
                placeholder={`Enter your ${socialModal.platform} username`}
                value={socialInput}
                onChange={e => setSocialInput(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSocialModal({ pkgId: '', taskId: 0, open: false })}>Cancel</Button>
                <Button onClick={submitSocial} disabled={!socialInput.trim()}>Submit</Button>
              </div>
            </div>
          </div>
        )}

        {/* Proof Modal */}
        {proofModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-amber-300/30">
              <h3 className="text-lg font-bold mb-2 text-amber-300">Submit Proof Link or Screenshot URL</h3>
              <input
                className="w-full p-3 rounded border border-amber-300/30 bg-black/30 text-white mb-4"
                placeholder="Paste your proof link here"
                value={proofInput}
                onChange={e => setProofInput(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setProofModal({ pkgId: '', taskId: 0, open: false })}>Cancel</Button>
                <Button onClick={submitProof} disabled={!proofInput.trim()}>Submit</Button>
              </div>
            </div>
          </div>
        )}

        {/* Questionnaire Modal */}
        {Object.entries(questionnaireOpen).map(([pkgId, taskId]) => {
          if (!taskId) return null;
          return renderQuestionnaireModal(pkgId, taskId);
        })}
      </div>
      </div>
    </>
  );
};

export default Investments;