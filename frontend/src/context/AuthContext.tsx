import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import type {
    ReactNode
} from "react";

import { api } from "../services/api";
import type { User } from "../types/api";

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext =
    createContext<AuthContextValue | undefined>(
        undefined
    );

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({
    children
}: AuthProviderProps) {
    const [
        user,
        setUser
    ] = useState<User | null>(null);

    const [
        loading,
        setLoading
    ] = useState(true);

    async function refreshUser() {
        try {
            const response =
                await api.get<{
                    success: boolean;
                    data: {
                        user: User;
                    };
                }>("/auth/me");

            setUser(response.data.data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        try {
            await api.post("/auth/logout");
        } finally {
            setUser(null);
        }
    }

    useEffect(() => {
        void refreshUser();
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            refreshUser,
            logout
        }),
        [user, loading]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}