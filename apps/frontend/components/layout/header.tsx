"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserCircle, ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { signOut, useSession } from "next-auth/react";

export function Header() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const user = session?.user;

  const navigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    // Add logout logic here
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Button
            variant="ghost"
            className="mr-2"
            onClick={() => navigate("/")}
          >
            Home
          </Button>
          <Button
            variant="ghost"
            className="mr-2"
            onClick={() => navigate("/calendar")}
          >
            Calendar
          </Button>
          <Button
            variant="ghost"
            className="mr-2"
            onClick={() => navigate("/teams")}
          >
            Teams
          </Button>
          <Button
            variant="ghost"
            className="mr-2"
            onClick={() => navigate("/fys-coach/programs")}
          >
            Program
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={user?.image ?? ""} alt={user?.name ?? "User avatar"} />
                    <AvatarFallback>
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
} 