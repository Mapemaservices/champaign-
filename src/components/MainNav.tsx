import { Link, useLocation } from "react-router-dom";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/MobileNav";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/auth", label: "Sign In" },
];

export function MainNav() {
  const location = useLocation();
  return (
    <nav className="w-full flex items-center justify-between py-4 px-4 border-b bg-background/80 backdrop-blur z-20 sticky top-0">
      {/* Logo or Brand */}
      <Link to="/" className="text-xl font-bold text-gold tracking-tight">Champagne Vault</Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex">
        <NavigationMenu>
          <NavigationMenuList>
            {navLinks.map((link) => (
              <NavigationMenuItem key={link.to}>
                <NavigationMenuLink asChild>
                  <Link
                    to={link.to}
                    className={cn(
                      "px-4 py-2 text-base font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      location.pathname === link.to ? "bg-accent/50" : ""
                    )}
                  >
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "px-4 py-2 text-base font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left",
                location.pathname === link.to ? "bg-accent/50" : ""
              )}
            >
              {link.label}
            </Link>
          ))}
        </MobileNav>
      </div>
    </nav>
  );
}
