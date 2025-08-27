import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";


type Deposit = { id: number, user_id: string, amount: number, status: string, payment_proof_url?: string };
type Withdrawal = { id: number, user_id: string, amount: number, status: string, method: string, destination: string };

const ADMIN_USER = "champagne";
const ADMIN_PASS = "@#Champagne9089";

const Admin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const { toast } = useToast();
  const { get, set, clear } = useSuperCache();

  useEffect(() => {
    if (!isAuthed) return;
    const cached = get<any[]>("admin-users");
    if (cached) {
      setUsers(cached);
      setLoading(false);
    } else {
      fetchUsers();
    }
    fetchPendingDeposits();
    fetchPendingWithdrawals();

    // Real-time listeners
    const depositSub = supabase.channel('deposits-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => {
        fetchPendingDeposits();
      })
      .subscribe();

    const withdrawalSub = supabase.channel('withdrawals-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        fetchPendingWithdrawals();
      })
      .subscribe();

    const profilesSub = supabase.channel('profiles-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(depositSub);
      supabase.removeChannel(withdrawalSub);
      supabase.removeChannel(profilesSub);
    };
    // eslint-disable-next-line
  }, [isAuthed]);
  const fetchPendingDeposits = async () => {
    const { data, error } = await supabase.from("deposits").select("*").eq("status", "pending");
    if (!error && data) setPendingDeposits(data);
  };

  const fetchPendingWithdrawals = async () => {
    const { data, error } = await supabase.from("withdrawals").select("*").eq("status", "pending");
    if (!error && data) setPendingWithdrawals(data);
  };

  const handleApproveDeposit = async (deposit: Deposit) => {
    setLoading(true);
    // Approve deposit: update status and user balance
    const { error } = await supabase.from("deposits").update({ status: "approved" }).eq("id", deposit.id);
    if (!error) {
      await supabase.from("profiles").update({ balance: supabase.rpc('increment_balance', { user_id: deposit.user_id, amount: deposit.amount }) }).eq("user_id", deposit.user_id);
      toast({ title: "Deposit approved" });
      fetchPendingDeposits();
      fetchUsers();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRejectDeposit = async (deposit: Deposit) => {
    setLoading(true);
    const { error } = await supabase.from("deposits").update({ status: "rejected" }).eq("id", deposit.id);
    if (!error) {
      toast({ title: "Deposit rejected" });
      fetchPendingDeposits();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleApproveWithdrawal = async (withdrawal: Withdrawal) => {
    setLoading(true);
    // Approve withdrawal: update status
    const { error } = await supabase.from("withdrawals").update({ status: "approved" }).eq("id", withdrawal.id);
    if (!error) {
      toast({ title: "Withdrawal approved" });
      fetchPendingWithdrawals();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRejectWithdrawal = async (withdrawal: Withdrawal) => {
    setLoading(true);
    const { error } = await supabase.from("withdrawals").update({ status: "rejected" }).eq("id", withdrawal.id);
    if (!error) {
      toast({ title: "Withdrawal rejected" });
      fetchPendingWithdrawals();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      toast({ title: "Error loading users", description: error.message, variant: "destructive" });
    } else {
      setUsers(data || []);
      set("admin-users", data || []);
    }
    setLoading(false);
  };

  const handleBalanceUpdate = async (userId: string, newBalance: number) => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ balance: newBalance }).eq("user_id", userId);
    if (error) {
      toast({ title: "Error updating balance", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Balance updated" });
      clear("admin-users");
      fetchUsers();
    }
    setLoading(false);
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <form className="bg-white/10 p-8 rounded-xl shadow-xl w-full max-w-xs space-y-6" onSubmit={e => {
          e.preventDefault();
          if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
            setIsAuthed(true);
          } else {
            toast({ title: "Access Denied", description: "Invalid admin credentials.", variant: "destructive" });
          }
        }}>
          <h2 className="text-2xl font-bold text-white text-center mb-4">Admin Login</h2>
          <div>
            <label className="block text-white/80 mb-2 font-medium">Username</label>
            <Input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} className="w-full" autoFocus required />
          </div>
          <div>
            <label className="block text-white/80 mb-2 font-medium">Password</label>
            <Input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full" required />
          </div>
          <Button type="submit" className="w-full mt-4">Login</Button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-8 space-y-8">
      {/* ...existing code for admin dashboard... */}
      <Card>
        <CardHeader>
          <CardTitle>Admin: Manage User Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading...</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1">User ID</th>
                  <th className="px-2 py-1">Name</th>
                  <th className="px-2 py-1">Email</th>
                  <th className="px-2 py-1">Phone</th>
                  <th className="px-2 py-1">Balance</th>
                  <th className="px-2 py-1">Is Admin</th>
                  <th className="px-2 py-1">Created At</th>
                  <th className="px-2 py-1">Update</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-2 py-1">{user.user_id}</td>
                    <td className="px-2 py-1">{user.full_name || '-'}</td>
                    <td className="px-2 py-1">{user.email || '-'}</td>
                    <td className="px-2 py-1">{user.phone || '-'}</td>
                    <td className="px-2 py-1">{user.balance}</td>
                    <td className="px-2 py-1">{user.is_admin ? 'Yes' : 'No'}</td>
                    <td className="px-2 py-1">{user.created_at ? new Date(user.created_at).toLocaleString() : '-'}</td>
                    <td className="px-2 py-1">
                      <form onSubmit={e => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const input = form.elements.namedItem("balance") as HTMLInputElement;
                        handleBalanceUpdate(user.user_id, Number(input.value));
                      }}>
                        <Input name="balance" type="number" defaultValue={user.balance} className="w-24 inline-block mr-2" />
                        <Button type="submit" size="sm">Update</Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pending Deposits */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1">Deposit ID</th>
                  <th className="px-2 py-1">User ID</th>
                  <th className="px-2 py-1">Amount</th>
                  <th className="px-2 py-1">Proof</th>
                  <th className="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeposits.map((dep) => (
                  <tr key={dep.id}>
                    <td className="px-2 py-1">{dep.id}</td>
                    <td className="px-2 py-1">{dep.user_id}</td>
                    <td className="px-2 py-1">${dep.amount}</td>
                    <td className="px-2 py-1">
                      {dep.payment_proof_url ? (
                        <a href={dep.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View</a>
                      ) : '—'}
                    </td>
                    <td className="px-2 py-1 space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleApproveDeposit(dep)}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectDeposit(dep)}>Reject</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pending Withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1">Withdrawal ID</th>
                  <th className="px-2 py-1">User ID</th>
                  <th className="px-2 py-1">Amount</th>
                  <th className="px-2 py-1">Method</th>
                  <th className="px-2 py-1">Destination</th>
                  <th className="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingWithdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="px-2 py-1">{w.id}</td>
                    <td className="px-2 py-1">{w.user_id}</td>
                    <td className="px-2 py-1">${w.amount}</td>
                    <td className="px-2 py-1">{w.method}</td>
                    <td className="px-2 py-1">{w.destination}</td>
                    <td className="px-2 py-1 space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleApproveWithdrawal(w)}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectWithdrawal(w)}>Reject</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default Admin;
