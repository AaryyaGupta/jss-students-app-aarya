import { NavLink } from "react-router-dom";
import { Home, Calendar, User } from "lucide-react";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </NavLink>
        
        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <Calendar className="h-6 w-6" />
          <span className="text-xs mt-1">Calendar</span>
        </NavLink>
        
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
