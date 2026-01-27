
import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onQuickInquiry: (text: string) => void;
}

const NeuralCore = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere args={[1.5, 64, 64]} ref={meshRef}>
        <MeshDistortMaterial
          color="#e4d8cc"
          speed={3}
          distort={0.4}
          radius={1}
          metalness={0.2}
          roughness={0.1}
          emissive="#2d3436"
          emissiveIntensity={0.05}
        />
      </Sphere>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.5, 0.01, 16, 100]} />
        <meshBasicMaterial color="#d4c8bc" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2.5, Math.PI / 4, 0]}>
        <torusGeometry args={[2.8, 0.005, 16, 100]} />
        <meshBasicMaterial color="#d4c8bc" transparent opacity={0.2} />
      </mesh>
    </Float>
  );
};

const BackgroundElements = () => {
  return (
    <group>
      <Stars radius={100} depth={50} count={500} factor={4} saturation={0} fade speed={1} />
      {Array.from({ length: 15 }).map((_, i) => (
        <Float key={i} speed={Math.random() * 2} rotationIntensity={2} floatIntensity={1}>
          <mesh position={[
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10 - 5
          ]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color="#e4d8cc" transparent opacity={0.4} />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, onSignup, onQuickInquiry }) => {
  return (
    <div className="relative bg-[#fcfaf2] text-[#2d3436] selection:bg-[#e4d8cc]">
      {/* Navigation UI Overlay */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-24 px-8 md:px-16 flex items-center justify-between border-b border-stone-200/20 backdrop-blur-sm bg-white/5">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="w-10 h-10 rounded-2xl bg-[#2d3436] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12">
            <i className="fa-solid fa-feather text-white text-sm"></i>
          </div>
          <span className="font-bold text-2xl tracking-tight transition-colors group-hover:text-stone-600">Lumina</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a href="#about" className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 hover:text-[#2d3436] transition-all">About</a>
          <a href="#features" className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 hover:text-[#2d3436] transition-all">Features</a>
          <button 
            onClick={onLogin}
            className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 hover:text-[#2d3436]"
          >
            Login
          </button>
          <button 
            onClick={onSignup}
            className="px-8 py-3 bg-[#2d3436] text-[#fcfaf2] rounded-full text-xs font-black uppercase tracking-[0.2em] hover:scale-110 hover:shadow-2xl active:scale-95 transition-all"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Canvas shadows gl={{ antialias: true }}>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#fff" />
            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#e4d8cc" />
            <Suspense fallback={null}>
              <NeuralCore />
              <BackgroundElements />
              <Environment preset="studio" />
            </Suspense>
          </Canvas>
        </div>

        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center pointer-events-none">
          <div className="landing-animate-in">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/50 backdrop-blur-md border border-stone-200 shadow-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-stone-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500">Neural Engine Active</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-light tracking-tighter leading-[0.85] mb-8 max-w-6xl mx-auto drop-shadow-sm pointer-events-auto">
              Where <span className="font-bold italic">thought</span> meets <span className="text-stone-400/80">form.</span>
            </h1>
            
            <p className="max-w-xl mx-auto text-lg md:text-xl text-stone-600 font-medium mb-12 leading-relaxed opacity-90 drop-shadow-sm pointer-events-auto">
              Experience the future of intelligent synthesis. Now grounded in real-time web and spatial data.
            </p>
            
            <div className="flex flex-col items-center gap-10 pointer-events-auto">
              <button 
                onClick={onStart}
                className="group w-full sm:w-auto px-12 py-6 bg-[#2d3436] text-white rounded-full text-sm font-black uppercase tracking-[0.3em] hover:scale-105 hover:bg-black active:scale-95 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center gap-4"
              >
                Start Conversation
                <i className="fa-solid fa-arrow-right-long text-xs transition-transform group-hover:translate-x-2"></i>
              </button>

              <div className="flex flex-wrap justify-center gap-4">
                {[
                  "Nearby Italian restaurants?",
                  "Latest tech breakthroughs?",
                  "Current weather in London?",
                  "Top hotels in Tokyo?"
                ].map((txt, i) => (
                  <button 
                    key={i}
                    onClick={() => onQuickInquiry(txt)}
                    className="px-6 py-3 rounded-2xl bg-white/40 backdrop-blur-md border border-stone-200 text-xs font-bold text-stone-600 hover:bg-white hover:border-[#2d3436] hover:text-[#2d3436] transition-all"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </section>

      {/* Sections 2, 3, 4 and Footer remain unchanged for design consistency */}
      <section id="about" className="py-32 px-8 md:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl md:text-6xl font-light tracking-tight leading-tight">
                Designed for <br/> <span className="font-bold italic">deep focus.</span>
              </h2>
              <p className="text-xl text-stone-500 leading-relaxed font-medium">
                Traditional AI tools are noisy. Lumina is built for clarity. Now with native Search and Maps grounding to provide the most accurate real-world data.
              </p>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#fcfaf2] border border-stone-200 flex items-center justify-center">
                  <i className="fa-solid fa-brain text-stone-400"></i>
                </div>
                <div>
                  <h4 className="font-bold text-stone-600">Advanced Reasoning</h4>
                  <p className="text-sm text-stone-400">High-budget internal thinking for complex queries.</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[3rem] bg-[#fcfaf2] shadow-inner flex items-center justify-center overflow-hidden">
                <div className="w-2/3 h-2/3 border-2 border-stone-200 rounded-full animate-spin-slow opacity-50"></div>
                <div className="absolute w-1/2 h-1/2 border-2 border-dashed border-stone-300 rounded-full animate-reverse-spin opacity-30"></div>
                <i className="fa-solid fa-compass-drafting text-6xl text-stone-200 absolute"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-8 md:px-24 py-16 border-t border-stone-200/20 backdrop-blur-sm bg-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#2d3436] flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-feather text-white text-sm"></i>
          </div>
          <span className="font-bold text-xl tracking-tight">Lumina</span>
        </div>
        <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
          <a href="#" className="hover:text-[#2d3436]">Privacy</a>
          <a href="#" className="hover:text-[#2d3436]">Terms</a>
          <a href="#" className="hover:text-[#2d3436]">Contact</a>
        </div>
        <span className="text-[10px] font-black tracking-[0.2em] text-stone-300">© 2025 LUMINA AI PROTOCOL</span>
      </footer>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .animate-reverse-spin {
          animation: reverse-spin 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
