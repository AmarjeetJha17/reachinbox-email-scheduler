import {
    LogOut,
    Mail,
    UserCircle
} from "lucide-react";

import {
    NavLink,
    Outlet,
    useNavigate
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export function DashboardLayout() {
    const {
        user,
        logout
    } = useAuth();

    const navigate =
        useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <header className="border-b border-neutral-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-white">
                            <Mail size={18} />
                        </div>

                        <div>
                            <p className="text-sm font-semibold">
                                ReachInbox
                            </p>

                            <p className="hidden text-xs text-neutral-400 sm:block">
                                Email Scheduler
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="h-9 w-9 rounded-full object-cover"
                            />
                        ) : (
                            <UserCircle
                                size={34}
                                className="text-neutral-400"
                            />
                        )}

                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium">
                                {user?.name}
                            </p>

                            <p className="max-w-48 truncate text-xs text-neutral-400">
                                {user?.email}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <nav className="mb-7 flex gap-1 rounded-xl border border-neutral-200 bg-white p-1">
                    <NavLink
                        to="/dashboard"
                        end
                        className={({ isActive }) =>
                            [
                                "rounded-lg px-4 py-2.5 text-sm font-medium transition",
                                isActive
                                    ? "bg-neutral-950 text-white"
                                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                            ].join(" ")
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/dashboard/compose"
                        className={({ isActive }) =>
                            [
                                "rounded-lg px-4 py-2.5 text-sm font-medium transition",
                                isActive
                                    ? "bg-neutral-950 text-white"
                                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                            ].join(" ")
                        }
                    >
                        Compose
                    </NavLink>
                </nav>

                <Outlet />
            </div>
        </div>
    );
}