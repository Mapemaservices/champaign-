import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      if (!error && data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="flex justify-center items-center min-h-screen text-white">Loading...</div>;
  if (!profile) return <div className="flex justify-center items-center min-h-screen text-red-400">Profile not found.</div>;

  return (
    <>
      <div className="container mx-auto py-8">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-slate-800">
              <div><span className="font-semibold">Full Name:</span> {profile.full_name || '-'}</div>
              <div><span className="font-semibold">Email:</span> {profile.email || '-'}</div>
              <div><span className="font-semibold">Phone:</span> {profile.phone || '-'}</div>
              <div><span className="font-semibold">Balance:</span> ${profile.balance?.toLocaleString() || '0'}</div>
              <div><span className="font-semibold">Admin:</span> {profile.is_admin ? 'Yes' : 'No'}</div>
              <div><span className="font-semibold">Created At:</span> {profile.created_at ? new Date(profile.created_at).toLocaleString() : '-'}</div>
            </div>
            <div className="mt-8 flex gap-2">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>Dashboard</Button>
              <Button variant="outline" onClick={() => navigate("/investments")}>Investments</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Profile;
