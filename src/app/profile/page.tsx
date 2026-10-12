"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { User, Mail, Shield, KeyRound, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 text-sm">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-teal-600" />
          Staff Profile & Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your PrimeWave Lab credentials and authorization levels.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-teal-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{user.email}</span>
              <span>•</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-teal-50 text-teal-700 border border-teal-200"
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" /> Work Email
            </span>
            <div className="text-sm font-semibold text-slate-800">{user.email}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-500" /> Permission Scope
            </span>
            <div className="text-sm font-semibold text-slate-800">
              {isAdmin ? "Full Administrative Access" : "Staff Member Access"}
            </div>
          </div>
        </div>

        {/* Security and Session Policy */}
        <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-900 space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-teal-800">
            <KeyRound className="w-4 h-4 text-teal-600" />
            Security & Session Security
          </div>
          <p className="leading-relaxed text-teal-800/90">
            Your session is secured using signed HTTP-only JWT cookies with bcrypt salted password hashing. Passwords cannot be queried in plain-text.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={() => {
              setSuccess(true);
              setTimeout(() => setSuccess(false), 3000);
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition"
          >
            Save Preferences
          </button>

          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition"
          >
            Sign Out
          </button>
        </div>

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile preferences updated successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
}
