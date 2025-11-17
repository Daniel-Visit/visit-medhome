"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [rut, setRut] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rut.trim()) {
      setMessage("Por favor ingresa tu RUT");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rut: rut.trim() }),
      });

      const data = await response.json();

      if (data.ok) {
        localStorage.setItem("pendingRut", rut.trim());
        router.push("/login/code");
      } else {
        setMessage(data.message || "Error al solicitar el código");
      }
    } catch (error) {
      setMessage("Error de conexión. Verifica que el servidor esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  const isError = message.includes("Error");

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
          Iniciar sesión
        </h1>
        <p className="text-sm text-[#6b7280] mb-8 text-center">
          Ingresa tu RUT para recibir un código de acceso por correo
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-xs font-medium text-[#374151] mb-2">
              RUT
            </label>
            <input
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="12345678-9"
              className="w-full px-4 py-3 rounded-lg border border-[#e5e7eb] text-sm outline-none bg-white text-[#111827] transition-all focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 focus:shadow-sm"
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
            disabled={loading}
            className={`w-full py-3.5 rounded-lg border-none text-sm font-semibold text-white transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:shadow-lg hover:shadow-[#22c55e]/25 active:scale-[0.99] cursor-pointer"
            }`}
          >
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        </form>
      </div>
    </div>
  );
}

