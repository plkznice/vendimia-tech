"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen pt-20">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-surface pt-4 pb-28 lg:pt-8 lg:pb-36 border-b border-outline-variant/15">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 opacity-5 pointer-events-none select-none text-[40vw] font-black text-primary leading-none font-[family-name:var(--font-plus-jakarta)]">
          VB
        </div>

        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-12 bg-primary" />
            <span className="font-[family-name:var(--font-plus-jakarta)] font-bold uppercase tracking-[0.3em] text-primary text-sm">
              Talento · Verificado · Blockchain
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-plus-jakarta)] font-extrabold text-5xl lg:text-7xl leading-[0.9] tracking-tighter mb-10 max-w-4xl text-on-surface">
            Conectamos talento estudiantil con
            <span className="text-primary italic"> proyectos reales</span>
          </h1>

          <p className="font-[family-name:var(--font-manrope)] text-xl text-on-surface-variant mb-12 max-w-2xl leading-relaxed">
            Los estudiantes suben sus certificados verificados en blockchain. Las empresas publican proyectos con pago garantizado en escrow sobre RSK. El pago se libera automáticamente al aprobar la entrega.
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            <Link href="/auth/register">
              <button className="brand-gradient text-white px-10 py-5 font-[family-name:var(--font-plus-jakarta)] font-extrabold tracking-widest uppercase text-sm hover:brightness-110 transition-all active:scale-95 rounded-full shadow-lg w-full sm:w-auto">
                Empezar ahora
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="border border-outline-variant/30 text-primary px-10 py-5 font-[family-name:var(--font-plus-jakarta)] font-extrabold tracking-widest uppercase text-sm hover:bg-surface-container-high transition-all rounded-full w-full sm:w-auto">
                Ingresar
              </button>
            </Link>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-0 max-w-3xl border-t border-outline-variant/15 pt-10">
            <div className="p-6 hover:bg-surface-container-high transition-colors">
              <h3 className="font-[family-name:var(--font-plus-jakarta)] font-bold text-on-surface text-lg uppercase tracking-tight mb-2">
                Certificados en Cadena
              </h3>
              <p className="font-[family-name:var(--font-manrope)] text-on-surface-variant text-sm">
                Subí tus certificados y quedan registrados en blockchain. Imposibles de falsificar, verificables por cualquier empresa.
              </p>
            </div>
            <div className="p-6 hover:bg-surface-container-high transition-colors border-t sm:border-t-0 sm:border-x border-outline-variant/15">
              <h3 className="font-[family-name:var(--font-plus-jakarta)] font-bold text-on-surface text-lg uppercase tracking-tight mb-2">
                Escrow en RSK
              </h3>
              <p className="font-[family-name:var(--font-manrope)] text-on-surface-variant text-sm">
                Las empresas fondean proyectos con tRBTC bloqueados en un smart contract. El pago se libera automáticamente al aprobar la entrega.
              </p>
            </div>
            <div className="p-6 hover:bg-surface-container-high transition-colors border-t sm:border-t-0">
              <h3 className="font-[family-name:var(--font-plus-jakarta)] font-bold text-on-surface text-lg uppercase tracking-tight mb-2">
                Match con IA
              </h3>
              <p className="font-[family-name:var(--font-manrope)] text-on-surface-variant text-sm">
                La IA analiza tus certificados y calcula tu compatibilidad con cada proyecto antes de postularte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-surface-container-low">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="mb-16 max-w-2xl">
            <h2 className="font-[family-name:var(--font-plus-jakarta)] font-bold text-4xl sm:text-5xl uppercase tracking-tighter text-on-surface mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="font-[family-name:var(--font-manrope)] text-lg text-on-surface-variant">
              Un flujo simple, transparente y sin intermediarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient">
              <span className="text-xs font-black uppercase tracking-widest text-primary font-[family-name:var(--font-plus-jakarta)] mb-4 block">Para Estudiantes</span>
              <ol className="space-y-4">
                {[
                  "Registrate y subí tus certificados",
                  "Explorá proyectos disponibles de empresas",
                  "Usá la IA para ver tu compatibilidad",
                  "Postulate y esperá que te acepten",
                  "Entregá el trabajo y recibí tus tRBTC",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full brand-gradient text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="font-[family-name:var(--font-manrope)] text-on-surface-variant text-sm">{step}</span>
                  </li>
                ))}
              </ol>
              <Link href="/auth/register" className="mt-8 block">
                <button className="w-full brand-gradient text-white py-3 rounded-full text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all">
                  Soy Estudiante
                </button>
              </Link>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient">
              <span className="text-xs font-black uppercase tracking-widest text-primary font-[family-name:var(--font-plus-jakarta)] mb-4 block">Para Empresas</span>
              <ol className="space-y-4">
                {[
                  "Registrá tu empresa en la plataforma",
                  "Publicá un proyecto con descripción y monto",
                  "El pago queda bloqueado en escrow (RSK)",
                  "Revisá postulantes y su score de IA",
                  "Aceptá un candidato y aprobá la entrega",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full brand-gradient text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="font-[family-name:var(--font-manrope)] text-on-surface-variant text-sm">{step}</span>
                  </li>
                ))}
              </ol>
              <Link href="/auth/register" className="mt-8 block">
                <button className="w-full brand-gradient text-white py-3 rounded-full text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all">
                  Soy Empresa
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-surface border-t border-outline-variant/15">
        <div className="container mx-auto px-4 sm:px-8 text-center">
          <h2 className="font-[family-name:var(--font-plus-jakarta)] font-extrabold text-4xl text-on-surface mb-4">
            Construido sobre <span className="text-primary">RSK & Beexo</span>
          </h2>
          <p className="font-[family-name:var(--font-manrope)] text-on-surface-variant max-w-xl mx-auto mb-10">
            Los contratos inteligentes corren sobre Rootstock (RSK), la red Bitcoin con soporte EVM. Conectate con tu wallet Beexo o MetaMask.
          </p>
          <Link href="/auth/register">
            <button className="brand-gradient text-white px-12 py-5 rounded-full font-[family-name:var(--font-plus-jakarta)] font-extrabold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-xl active:scale-95">
              Crear cuenta gratis
            </button>
          </Link>
        </div>
      </section>

    </div>
  );
}
