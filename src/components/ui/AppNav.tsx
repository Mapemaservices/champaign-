import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/investments", label: "Investments" },
  { to: "/deposit", label: "Deposit" },
  { to: "/withdrawal", label: "Withdraw" },
  { to: "/profile", label: "Profile" },
  
];

export default function AppNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="w-full bg-slate-900/80 border-b border-slate-800 px-4 py-2 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold text-amber-400">Champagne Vault</Link>
      <div className="hidden md:flex gap-4">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-3 py-2 rounded hover:bg-amber-500/10 transition-colors font-medium ${location.pathname === link.to ? 'text-amber-400' : 'text-white/80'}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <button className="md:hidden p-2 text-amber-400" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu className="h-7 w-7" />
      </button>
      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex">
          <div className="w-64 bg-slate-900 h-full p-6 flex flex-col gap-6 animate-slideInLeft relative">
            <button className="absolute top-4 right-4 text-amber-400" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="h-7 w-7" />
            </button>
            <Link to="/" className="text-xl font-bold text-amber-400 mb-4" onClick={() => setOpen(false)}>Champagne Vault</Link>
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-3 py-2 rounded hover:bg-amber-500/10 transition-colors font-medium ${location.pathname === link.to ? 'text-amber-400' : 'text-white/80'}`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex-1" onClick={() => setOpen(false)} />
        </div>
      )}
    </nav>
  );
}
