import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("gs_user");
    const token = localStorage.getItem("gs_token");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const r = await authAPI.login(username, password);
    const data = r.data;
    localStorage.setItem("gs_token", data.access_token);
    localStorage.setItem("gs_user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const r = await authAPI.register(formData);
    const data = r.data;
    localStorage.setItem("gs_token", data.access_token);
    localStorage.setItem("gs_user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("gs_token");
    localStorage.removeItem("gs_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
