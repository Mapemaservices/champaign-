import * as React from "react";
import { Menu, X } from "lucide-react";

interface MobileNavProps {
  children: React.ReactNode;
}

export function MobileNav({ children }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="md:hidden relative">
      <button
        className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col py-2">{children}</div>
        </div>
      )}
    </div>
  );
}
