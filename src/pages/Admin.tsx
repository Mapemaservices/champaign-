import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSuperCache } from "@/hooks/useSuperCache";

const Admin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { get, set, clear } = useSuperCache();

  useEffect(() => {
    const cached = get<any[]>("admin-users");
    if (cached) {
      setUsers(cached);
      setLoading(false);
    } else {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, []);

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

  return (
    <div className="container mx-auto py-8">
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
                  <th className="px-2 py-1">Balance</th>
                  <th className="px-2 py-1">Update</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-2 py-1">{user.user_id}</td>
                    <td className="px-2 py-1">{user.full_name}</td>
                    <td className="px-2 py-1">{user.balance}</td>
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
    </div>
  );
};

export default Admin;
