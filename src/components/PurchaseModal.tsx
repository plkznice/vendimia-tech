"use client";

import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useAccount } from 'wagmi';
import { CheckCircle2, ShieldAlert, Circle } from 'lucide-react';

const TX_STEPS = [
  'Iniciando transacción en la red...',
  'Esperando confirmación del bloque...',
  'Registrando en el contrato...',
];

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  datasetName: string;
  tokenPrice: number;
  tokensAvailable: number;
}

export function PurchaseModal({ isOpen, onClose, datasetId, datasetName, tokenPrice, tokensAvailable }: PurchaseModalProps) {
  const { isConnected } = useAccount();
  const { buyTokens } = useMarketplace();
  
  const [amount, setAmount] = useState<number>(1);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [txStep, setTxStep] = useState(0);

  useEffect(() => {
    if (status === 'processing') {
      const t1 = setTimeout(() => setTxStep(1), 700);
      const t2 = setTimeout(() => setTxStep(2), 1400);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [status]);

  const handlePurchase = async () => {
    if (!isConnected) return;
    setTxStep(0);
    setStatus('processing');
    await buyTokens(datasetId, amount);
    setStatus('success');
  };

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setStatus('idle');
      setAmount(1);
    }, 500);
  };

  if (!isConnected) {
    return (
      <Modal isOpen={isOpen} onClose={resetAndClose} title="Conectá tu wallet">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <ShieldAlert className="mb-4 h-12 w-12 text-blue-500" />
          <p className="text-slate-600 mb-6">
            Necesitás conectar tu wallet para continuar con la compra.
          </p>
          <Button onClick={resetAndClose}>Entendido</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={status === 'processing' ? () => {} : resetAndClose} title={status === 'processing' ? 'Confirmando transacción' : `Financiar: ${datasetName}`}>
      {status === 'processing' ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-50 animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-6 font-mono">
            Por favor no cierres esta ventana
          </p>
          <div className="w-full space-y-3 text-left">
            {TX_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {i < txStep ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : i === txStep ? (
                  <svg className="animate-spin h-5 w-5 text-blue-600 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Circle className="h-5 w-5 text-slate-300 shrink-0" />
                )}
                <span className={`text-sm font-medium ${i < txStep ? 'text-green-600' : i === txStep ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : status === 'success' ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
          <h4 className="text-2xl font-bold text-slate-900 mb-2">¡Transacción exitosa!</h4>
          <p className="text-slate-600 mb-6">
            Adquiriste {amount} token(s). Tu panel fue actualizado.
          </p>
          <Button onClick={resetAndClose} className="w-full">Volver al catálogo</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex justify-between mb-2">
              <span className="text-slate-500">Precio por token:</span>
              <span className="font-semibold text-slate-900">${tokenPrice} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tokens disponibles:</span>
              <span className="font-semibold text-slate-900">{tokensAvailable}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cantidad de tokens
            </label>
            <input
              type="number"
              min="1"
              max={tokensAvailable}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-shadow"
            />
          </div>

          <div className="flex justify-between items-end border-t border-slate-100 pt-5 mt-2">
            <div>
              <span className="block text-sm text-slate-500 mb-1">Total estimado</span>
              <span className="text-3xl font-bold text-slate-900">${amount * tokenPrice}</span>
            </div>
            <Button 
              size="lg"
              onClick={handlePurchase} 
              disabled={amount < 1 || amount > tokensAvailable || isNaN(amount)}
            >
              Comprar tokens
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
