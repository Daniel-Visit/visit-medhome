"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginCodePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [rut, setRut] = useState("");
  const router = useRouter();

  useEffect(() => {
    const pendingRut = localStorage.getItem("pendingRut");
    if (!pendingRut) {
      router.push("/login");
      return;
    }
    setRut(pendingRut);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) {
      setMessage("Por favor ingresa el código de 6 dígitos");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ rut, code: code.trim() }),
      });

      const data = await response.json();

      if (data.ok) {
        localStorage.removeItem("pendingRut");
        router.push("/visits");
      } else {
        setMessage(data.message || "Código inválido");
      }
    } catch (error) {
      setMessage("Error de conexión. Verifica que el servidor esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  const isError = message.includes("inválido") || message.includes("Error");
  const isDisabled = loading || code.length !== 6;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f4f4f5] to-[#e5e7eb] p-4">
      <div className="w-full max-w-[430px] bg-white rounded-2xl p-8 shadow-lg border border-[#e5e7eb]/50">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.svg"
            alt="MEDHOME"
            width={132}
            height={28}
            className="h-7 w-auto"
            priority
          />
        </div>
        <div className="border-b border-[#e5e7eb] mb-8"></div>
        <h1 className="text-2xl font-semibold mb-2 text-[#111827] text-center">
          Verificar código
        </h1>
        <p className="text-sm text-[#6b7280] mb-6 text-center">
          Ingresa el código que recibiste en tu correo
        </p>

        <div className="mb-6 p-3 bg-gradient-to-r from-[#f9fafb] to-[#f0fdf4] rounded-lg text-xs text-[#6b7280] border border-[#e5e7eb]">
          RUT: <strong className="font-semibold text-[#374151]">{rut}</strong>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-xs font-medium text-[#374151] mb-2">
              Código de acceso
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(value);
              }}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-4 rounded-lg border border-[#e5e7eb] text-xl text-center tracking-[0.5em] outline-none bg-white text-[#111827] font-mono transition-all focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 focus:shadow-sm"
              disabled={loading}
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg mb-5 text-xs transition-all ${
                isError
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-green-50 text-green-800 border border-green-200"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isDisabled}
            className={`w-full py-3.5 rounded-lg border-none text-sm font-semibold text-white transition-all ${
              isDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:shadow-lg hover:shadow-[#22c55e]/25 active:scale-[0.99] cursor-pointer"
            }`}
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

