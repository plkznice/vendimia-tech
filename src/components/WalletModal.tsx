"use client";

import { Wallet, X, Smartphone, Monitor } from "lucide-react";
import { useXO } from "@/context/XOProvider";

export function WalletModal({ onClose }: { onClose: () => void }) {
  const { isBeexo, connect, connectMetaMask } = useXO();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "vendimia-tech.vercel.app";

  async function handleBeexo() {
    if (isBeexo) {
      await connect();
      onClose();
    }
  }

  async function handleMetaMask() {
    await connectMetaMask();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Wallet className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Conectar Wallet</h2>
            <p className="text-xs text-slate-500">Elegí cómo conectarte</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Beexo */}
          <button
            onClick={handleBeexo}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-sm">Beexo Wallet</p>
              <p className="text-xs text-slate-500">
                {isBeexo ? "✓ Detectado — click para conectar" : "Abrí esta URL en el browser de Beexo"}
              </p>
            </div>
            {isBeexo && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Activo</span>
            )}
          </button>

          {!isBeexo && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-xs text-slate-600 font-medium mb-1">¿Cómo conectar con Beexo?</p>
              <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
                <li>Abrí la app <strong>Beexo</strong> en tu celular</li>
                <li>Tocá el ícono de <strong>browser/explorar</strong></li>
                <li>Ingresá esta URL:</li>
              </ol>
              <div className="mt-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <p className="text-xs font-mono text-blue-600 break-all">{siteUrl}</p>
              </div>
            </div>
          )}

          {/* MetaMask */}
          <button
            onClick={handleMetaMask}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
              <Monitor className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">MetaMask</p>
              <p className="text-xs text-slate-500">Extensión de escritorio</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
