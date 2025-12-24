"use client";

import Navbar from "./Navbar";
import Footer from "./Footer";
import { AuthProvider } from "../context/AuthContext";

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
