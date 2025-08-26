import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wine, TrendingUp, Shield, Award, Users, Star, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSuperCache } from "@/hooks/useSuperCache";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "High Returns",
      description: "Earn up to 60% returns on your investments with our premium packages"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure Platform",
      description: "Bank-level security with encrypted transactions and secure storage"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Instant Bonuses",
      description: "Get 5% bonus on every deposit automatically added to your balance"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Expert Management",
      description: "Professional team managing your investments with proven track record"
    }
  ];

  // Static packages for all users (before login/signup)
  const staticPackages = [
    { name: "Bronze", returns_percentage: 15, duration_months: 6, price: 100 },
    { name: "Silver", returns_percentage: 25, duration_months: 12, price: 500 },
    { name: "Gold", returns_percentage: 40, duration_months: 18, price: 1000 },
    { name: "Platinum", returns_percentage: 60, duration_months: 24, price: 5000 }
  ];

  const [packages, setPackages] = useState<any[]>(staticPackages);
  const [balance, setBalance] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { get, set, clear } = useSuperCache();

  useEffect(() => {
    const cachedPackages = get<any[]>("investment-packages");
    const cachedBalance = get<number>("user-balance");
    fetchUser();
    if (cachedPackages && userId) setPackages(cachedPackages);
    else if (userId) fetchPackages();
    setLoading(false);
    // eslint-disable-next-line
  }, [userId]);

  const fetchPackages = async () => {
    const { data, error } = await supabase.from("investment_packages").select("*").eq("is_active", true);
    if (!error) {
      setPackages(data || staticPackages);
      set("investment-packages", data || staticPackages);
    }
  };

  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      const { data, error } = await supabase.from("profiles").select("balance").eq("user_id", session.user.id).single();
      if (!error && data) {
        setBalance(data.balance);
        set("user-balance", data.balance);
      }
    }
  };

  const handleInvest = async (pkg: any) => {
    if (!userId) {
      // Not logged in: prompt to register/login and go to investments page with package selection
      navigate("/auth", { state: { selectedPackage: pkg.name } });
      return;
    }
    if (balance < pkg.price) {
      toast({ title: "Insufficient balance", description: "Deposit more funds to invest.", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Deduct balance
    const { error: updateError } = await supabase.from("profiles").update({ balance: balance - pkg.price }).eq("user_id", userId);
    // Add investment
    const { error: investError } = await supabase.from("investments").insert({ user_id: userId, package_id: pkg.id, amount: pkg.price, status: "active" });
    if (updateError || investError) {
      toast({ title: "Investment failed", description: (updateError || investError)?.message, variant: "destructive" });
    } else {
      toast({ title: "Investment successful!" });
      setBalance(balance - pkg.price);
      set("user-balance", balance - pkg.price);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#2A2A2A] text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-champagne/5 rounded-full blur-3xl animate-pulse-slower"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-28 px-4">
        <div className="container mx-auto text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-gold to-champagne p-6 rounded-full relative">
              <Wine className="h-20 w-20 text-white" />
              <Sparkles className="h-6 w-6 text-white absolute -top-2 -right-2 animate-spin-slow" />
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-gold via-champagne to-gold bg-clip-text text-transparent animate-gradient">
            Champagne Vault
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Premium investment platform offering exclusive opportunities with guaranteed returns. 
            Join thousands of investors building wealth through our sophisticated investment strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="text-lg px-10 py-6 bg-gradient-to-r from-gold to-champagne hover:from-champagne hover:to-gold text-black font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-gold/30"
            >
              Start Investing Today
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 border-gold text-gold hover:bg-gold/10 rounded-full transition-all duration-300"
            >
              Learn More
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-20 max-w-4xl mx-auto">
            {[
              { value: "$2.5M+", label: "Total Invested" },
              { value: "1,200+", label: "Active Investors" },
              { value: "98%", label: "Satisfaction Rate" }
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 bg-black/30 backdrop-blur-sm rounded-xl border border-gold/20 hover:border-gold/40 transition-all duration-500 hover:scale-105">
                <div className="text-4xl font-bold text-gold mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-gold to-champagne bg-clip-text text-transparent">
              Why Choose Champagne Vault?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Our platform combines cutting-edge technology with proven investment strategies to deliver exceptional results.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="text-center border-gold/20 bg-black/30 backdrop-blur-md hover:border-gold/40 transition-all duration-500 hover:scale-105 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative z-10">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-gold to-champagne rounded-full text-black">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-gold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-400">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Packages */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-gold to-champagne bg-clip-text text-transparent">
              Investment Packages
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Choose from our range of carefully crafted investment packages designed to maximize your returns.
            </p>
          </div>
          
          <div className="mb-8 text-center">
            {userId && (
              <div className="inline-flex items-center bg-black/30 backdrop-blur-sm px-6 py-3 rounded-full border border-gold/20">
                Your Balance: <span className="font-bold text-gold ml-2">${balance.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {packages.map((pkg, index) => (
              <Card 
                key={pkg.name || pkg.id || index} 
                className="border-gold/20 bg-black/30 backdrop-blur-md hover:border-gold/40 transition-all duration-500 hover:scale-105 group overflow-hidden relative"
              >
                {index === 3 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-gold to-champagne text-black font-bold px-4 py-1 rounded-full">
                      <Sparkles className="h-3 w-3 mr-1" /> Most Popular
                    </Badge>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="text-center relative z-10 pt-8">
                  <CardTitle className="text-2xl text-gold">{pkg.name}</CardTitle>
                  <div className="text-4xl font-bold mt-4 bg-gradient-to-r from-gold to-champagne bg-clip-text text-transparent">
                    ${pkg.price?.toLocaleString?.() || pkg.price}
                  </div>
                </CardHeader>
                
                <CardContent className="text-center space-y-6 relative z-10 pb-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gold/10">
                      <span className="text-gray-400">Returns:</span>
                      <span className="font-bold text-gold">{pkg.returns_percentage}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gold/10">
                      <span className="text-gray-400">Duration:</span>
                      <span className="font-bold text-gold">{pkg.duration_months} months</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-gold to-champagne hover:from-champagne hover:to-gold text-black font-bold py-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-gold/20"
                    onClick={() => handleInvest(pkg)}
                  >
                    {!userId ? "Choose This Package" : (balance < pkg.price ? "Insufficient Balance" : "Invest Now")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-gradient-to-b from-black/50 to-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-gold to-champagne bg-clip-text text-transparent">
              What Our Investors Say
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Business Owner",
                content: "Champagne Vault has exceeded my expectations. The returns are consistent and the platform is incredibly user-friendly.",
                rating: 5
              },
              {
                name: "Michael Chen",
                role: "Investment Advisor",
                content: "As a financial professional, I appreciate the transparency and security measures. Highly recommended.",
                rating: 5
              },
              {
                name: "Emily Rodriguez",
                role: "Entrepreneur",
                content: "The 5% deposit bonus and high returns make this platform unbeatable. I've been investing for 8 months now.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-gold/20 bg-black/30 backdrop-blur-md overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="pt-8 relative z-10">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic relative before:content-['“'] before:text-6xl before:text-gold/20 before:absolute before:-top-4 before:-left-2 before:font-serif">
                    {testimonial.content}
                  </p>
                  <div className="border-t border-gold/10 pt-4">
                    <div className="font-semibold text-gold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center">
          <Card className="max-w-3xl mx-auto border-gold/20 bg-black/30 backdrop-blur-md overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-champagne/10 opacity-50"></div>
            <CardContent className="pt-16 pb-12 px-8 relative z-10">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-gold to-champagne bg-clip-text text-transparent">
                Ready to Start Investing?
              </h2>
              <p className="text-gray-300 mb-10 text-lg max-w-2xl mx-auto">
                Join thousands of successful investors and start building your wealth today with our premium investment platform.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")} 
                className="text-lg px-12 py-7 bg-gradient-to-r from-gold to-champagne hover:from-champagne hover:to-gold text-black font-bold rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-gold/30"
              >
                Create Your Account
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gold/10 bg-black/30 backdrop-blur-md">
        <div className="container mx-auto text-center">
          <div className="flex justify-center items-center mb-6">
            <div className="bg-gradient-to-br from-gold to-champagne p-2 rounded-full mr-3">
              <Wine className="h-6 w-6 text-black" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-gold to-champagne bg-clip-text text-transparent">
              Champagne Vault
            </span>
          </div>
          <p className="text-gray-500 text-sm">© 2024 Champagne Vault. All rights reserved. Premium investment platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;