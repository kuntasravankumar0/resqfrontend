import { useEffect, useRef, useState, Suspense, lazy } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, MeshDistortMaterial } from "@react-three/drei";
import { useNavigate } from "react-router-dom";

/* ─── 3D Scene Components ─────────────────────────────────────────────────── */

function AnimatedSphere({ position, color, speed = 1, distort = 0.4, scale = 1 }) {
  const meshRef = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.4;
    meshRef.current.rotation.y = Math.cos(t * 0.2) * 0.4;
    meshRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.3;
  });
  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        color={color}
        distort={distort}
        speed={2}
        roughness={0.1}
        metalness={0.8}
        emissive={color}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

function FloatingRing({ position, rotation, color, scale = 1 }) {
  const meshRef = useRef();
  useFrame((state) => {
    meshRef.current.rotation.x = rotation[0] + state.clock.getElapsedTime() * 0.3;
    meshRef.current.rotation.y = rotation[1] + state.clock.getElapsedTime() * 0.2;
  });
  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <torusGeometry args={[1.5, 0.05, 16, 100]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} metalness={1} roughness={0} />
    </mesh>
  );
}

function FloatingCube({ position, color, scale = 0.6 }) {
  const meshRef = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.5;
    meshRef.current.rotation.y = t * 0.3;
    meshRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.2;
  });
  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} wireframe metalness={0.9} roughness={0.1} />
    </mesh>
  );
}

function GridPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[40, 40, 40, 40]} />
      <meshStandardMaterial color="#0f172a" wireframe opacity={0.15} transparent />
    </mesh>
  );
}

function ParticleField() {
  const count = 200;
  const positions = useRef(new Float32Array(count * 3));
  const meshRef = useRef();

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      positions.current[i * 3]     = (Math.random() - 0.5) * 30;
      positions.current[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions.current[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#f59e0b" sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#f59e0b" />
      <pointLight position={[-10, -10, -10]} intensity={1.5} color="#6366f1" />
      <pointLight position={[0, 5, -5]} intensity={1} color="#ef4444" />
      <spotLight position={[0, 15, 0]} intensity={1} angle={0.5} penumbra={1} color="#fff" />

      <Stars radius={80} depth={50} count={3000} factor={4} saturation={0} fade speed={1.5} />
      <ParticleField />
      <GridPlane />

      {/* Main center sphere */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
        <AnimatedSphere position={[0, 0, 0]} color="#f59e0b" speed={0.8} distort={0.5} scale={1.8} />
      </Float>

      {/* Orbiting spheres */}
      <Float speed={1.5} floatIntensity={1}>
        <AnimatedSphere position={[-5, 1, -2]} color="#6366f1" speed={1.2} distort={0.3} scale={0.8} />
      </Float>
      <Float speed={2.5} floatIntensity={0.6}>
        <AnimatedSphere position={[5, -1, -1]} color="#ef4444" speed={0.9} distort={0.6} scale={0.6} />
      </Float>
      <Float speed={1.8} floatIntensity={1.2}>
        <AnimatedSphere position={[3, 3, -3]} color="#10b981" speed={1.1} distort={0.4} scale={0.5} />
      </Float>

      {/* Rings */}
      <FloatingRing position={[0, 0, 0]} rotation={[Math.PI / 3, 0, 0]} color="#f59e0b" scale={2.5} />
      <FloatingRing position={[0, 0, 0]} rotation={[Math.PI / 5, Math.PI / 4, 0]} color="#6366f1" scale={3.2} />
      <FloatingRing position={[0, 0, 0]} rotation={[0, Math.PI / 3, Math.PI / 6]} color="#ef4444" scale={4} />

      {/* Floating wireframe cubes */}
      <FloatingCube position={[-7, 2, -3]} color="#f59e0b" scale={0.5} />
      <FloatingCube position={[7, -2, -2]} color="#6366f1" scale={0.4} />
      <FloatingCube position={[-4, -3, -1]} color="#ef4444" scale={0.35} />
      <FloatingCube position={[4, 4, -4]} color="#10b981" scale={0.45} />
    </>
  );
}

/* ─── Stats Counter ──────────────────────────────────────────────────────── */
function Counter({ target, label, suffix = "+" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let start = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(timer); }
        else setCount(Math.floor(start));
      }, 25);
      observer.disconnect();
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontSize: "3rem", fontWeight: 900, background: "linear-gradient(90deg,#f59e0b,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {count}{suffix}
      </div>
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ─── Feature Card ───────────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect(); }
    }, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20,
      padding: "28px 24px",
      backdropFilter: "blur(20px)",
      transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.95)",
      cursor: "default",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
        e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)";
        e.currentTarget.style.boxShadow = "0 20px 60px rgba(245,158,11,0.15)";
        e.currentTarget.style.background = "rgba(255,255,255,0.07)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>{title}</div>
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", lineHeight: 1.7 }}>{desc}</div>
    </div>
  );
}

/* ─── PWA Install Button ──────────────────────────────────────────────────── */
function InstallButton() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 12, padding: "10px 20px", color: "#10b981", fontSize: "0.9rem", fontWeight: 600 }}>
      ✅ App Installed
    </div>
  );

  if (!prompt) return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 20px", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
      📱 Open in browser → Share → Add to Home Screen
    </div>
  );

  return (
    <button
      onClick={async () => { prompt.prompt(); const { outcome } = await prompt.userChoice; if (outcome === "accepted") setInstalled(true); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
        border: "none", borderRadius: 14, padding: "14px 28px",
        color: "#fff", fontSize: "1rem", fontWeight: 700,
        cursor: "pointer", boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
        transition: "all 0.3s ease",
        animation: "installPulse 2s ease infinite",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(99,102,241,0.6)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.4)"; }}
    >
      📲 Install App
    </button>
  );
}

/* ─── Main Home Component ─────────────────────────────────────────────────── */
const features = [
  { icon: "🔧", title: "Service  Tracking", desc: "Manage 30+ daily repair and installation jobs with real-time status updates and priority tagging." },
  
];

export default function Home() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: "#030712", minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif", overflowX: "hidden" }}>

      {/* ── CSS Keyframes ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(60px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseGlow {
          0%,100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes rotateRing {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes installPulse {
          0%,100% { box-shadow: 0 8px 32px rgba(99,102,241,0.4); }
          50%      { box-shadow: 0 8px 40px rgba(99,102,241,0.8); }
        }
        @keyframes navFade {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes textShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes borderFlow {
          0%   { border-color: rgba(245,158,11,0.3); }
          50%  { border-color: rgba(239,68,68,0.6); }
          100% { border-color: rgba(245,158,11,0.3); }
        }
        @keyframes floatBadge {
          0%,100% { transform: translateY(0px) rotate(-2deg); }
          50%      { transform: translateY(-12px) rotate(2deg); }
        }

        html { scroll-behavior: smooth; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #030712; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(#f59e0b, #ef4444); border-radius: 3px; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 50 ? "rgba(3,7,18,0.9)" : "transparent",
        backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
        borderBottom: scrollY > 50 ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.4s ease",
        padding: "0 5%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 70,
        animation: "navFade 0.8s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg,#f59e0b,#ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "0 4px 20px rgba(245,158,11,0.5)",
            animation: "pulseGlow 3s ease infinite",
          }}>🔩</div>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: "1.4rem", letterSpacing: 3 }}>RESQ</span>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "linear-gradient(90deg,#f59e0b,#ef4444)",
              border: "none", borderRadius: 12, padding: "10px 24px",
              color: "#fff", fontWeight: 700, fontSize: "0.95rem",
              cursor: "pointer", boxShadow: "0 4px 20px rgba(245,158,11,0.4)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 6px 30px rgba(245,158,11,0.6)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,158,11,0.4)"; }}
          >
            Sign In →
          </button>
        </div>
      </nav>

      {/* ── Hero Section with 3D Canvas ── */}
      <section style={{ position: "relative", height: "100vh", overflow: "hidden" }}>

        {/* 3D Canvas — full background */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Canvas camera={{ position: [0, 0, 10], fov: 55 }} dpr={[1, 2]}>
            <Suspense fallback={null}>
              <Scene3D />
            </Suspense>
          </Canvas>
        </div>

        {/* Dark gradient overlay over canvas */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(to right, rgba(3,7,18,0.92) 0%, rgba(3,7,18,0.6) 50%, rgba(3,7,18,0.3) 100%)",
          pointerEvents: "none",
        }} />

        {/* Hero text content */}
        <div style={{
          position: "relative", zIndex: 2,
          height: "100%", display: "flex", alignItems: "center",
          padding: "0 8%", paddingTop: 70,
        }}>
          <div style={{
            maxWidth: 700,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(50px)",
            transition: "all 1s cubic-bezier(0.16,1,0.3,1)",
          }}>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 50, padding: "8px 18px", marginBottom: 24,
              color: "#f59e0b", fontSize: "0.85rem", fontWeight: 600,
              animation: "borderFlow 3s ease infinite",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block", boxShadow: "0 0 10px #f59e0b", animation: "pulseGlow 1.5s ease infinite" }} />
              Service Center
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
              fontWeight: 900, lineHeight: 1.05,
              color: "#fff", marginBottom: 24,
              letterSpacing: "-0.02em",
            }}>
              Best
              <br />
              <span style={{
                background: "linear-gradient(90deg,#f59e0b,#ef4444,#f59e0b)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                animation: "textShimmer 3s linear infinite",
              }}>
                Service Center
              </span>
              <br />
              <span style={{ color: "rgba(255,255,255,0.85)" }}>Management</span>
            </h1>

            <p style={{
              color: "rgba(255,255,255,0.65)", fontSize: "1.1rem", lineHeight: 1.8,
              marginBottom: 40, maxWidth: 580,
            }}>
              RESQ is a powerful service management platform built for repair centers, technicians and support teams. Track jobs, manage customers, monitor technicians and streamline your entire workflow from a single dashboard.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: "linear-gradient(90deg,#f59e0b,#ef4444)",
                  border: "none", borderRadius: 16, padding: "16px 36px",
                  color: "#fff", fontWeight: 800, fontSize: "1.05rem",
                  cursor: "pointer", boxShadow: "0 8px 32px rgba(245,158,11,0.45)",
                  transition: "all 0.3s ease", letterSpacing: "0.02em",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(245,158,11,0.6)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(245,158,11,0.45)"; }}
              >
                🚀 Get Started
              </button>
              <InstallButton />
            </div>

            {/* Floating badges */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["⭐ Trusted Platform", "🔒 Secure & Fast", "📱 Installable App"].map((badge, i) => (
                <div key={badge} style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 50, padding: "7px 16px",
                  color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", fontWeight: 500,
                  animation: `floatBadge ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}>
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          opacity: scrollY < 100 ? 1 : 0, transition: "opacity 0.3s",
        }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", letterSpacing: 2 }}>SCROLL</span>
          <div style={{
            width: 24, height: 36, border: "2px solid rgba(255,255,255,0.2)",
            borderRadius: 12, display: "flex", justifyContent: "center", paddingTop: 6,
          }}>
            <div style={{
              width: 4, height: 8, background: "#f59e0b", borderRadius: 2,
              animation: "fadeUp 1.5s ease infinite",
            }} />
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section style={{
        padding: "80px 8%",
        background: "linear-gradient(180deg, #030712 0%, #0a0f1e 100%)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 32, maxWidth: 900, margin: "0 auto",
        }}>
          <Counter target={30} label=" Tracked Daily" />
          <Counter target={99} label="Uptime %" suffix="%" />
          <Counter target={20} label=" total Technician" />
          <Counter target={5} label=" Supported" suffix="" />
        </div>
      </section>

      {/* ── Features Section ── */}
      <section style={{ padding: "80px 8%", background: "#0a0f1e" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-block", background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.3)", borderRadius: 50,
            padding: "7px 18px", color: "#818cf8", fontSize: "0.82rem",
            fontWeight: 600, marginBottom: 18,
          }}>
            FEATURES
          </div>
          <h2 style={{
            fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, color: "#fff",
            lineHeight: 1.2, marginBottom: 16,
          }}>
            Everything you need to
            <br />
            <span style={{ background: "linear-gradient(90deg,#f59e0b,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              run your service center
            </span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: 500, margin: "0 auto", fontSize: "1rem", lineHeight: 1.7 }}>
            From job tracking to live technician locations — every tool your team needs in one place.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20, maxWidth: 1200, margin: "0 auto",
        }}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ── Roles Section ── */}
      <section style={{ padding: "80px 8%", background: "linear-gradient(180deg,#0a0f1e 0%,#030712 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#fff", marginBottom: 16 }}>
            Built for every
            <span style={{ background: "linear-gradient(90deg,#f59e0b,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> role</span>
          </h2>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20, maxWidth: 1000, margin: "0 auto",
        }}>
          {[
         
            { role: "Technician", icon: "🔧", color: "#6366f1", desc: "See assigned data, add daily notes, update data status.", perks: ["View assigned tasks by day", "Add worklog notes", "Update daily status instantly"] },
          ].map((r, i) => (
            <FeatureCard key={r.role} icon={r.icon} title={r.role} desc={r.desc} delay={i * 100} />
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section style={{
        padding: "100px 8%", textAlign: "center",
        background: "radial-gradient(ellipse at center, rgba(245,158,11,0.08) 0%, transparent 70%), #030712",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        <h2 style={{
          fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900,
          color: "#fff", lineHeight: 1.1, marginBottom: 20,
        }}>
          Ready to transform your
          <br />
          <span style={{ background: "linear-gradient(90deg,#f59e0b,#ef4444,#f59e0b)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "textShimmer 3s linear infinite" }}>
            service center?
          </span>
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem", marginBottom: 48, maxWidth: 500, margin: "0 auto 48px" }}>
          Log in now and start managing jobs, technicians and customers all from one dashboard.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "linear-gradient(90deg,#f59e0b,#ef4444)",
              border: "none", borderRadius: 16, padding: "18px 48px",
              color: "#fff", fontWeight: 800, fontSize: "1.1rem",
              cursor: "pointer", boxShadow: "0 8px 40px rgba(245,158,11,0.5)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px) scale(1.04)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(245,158,11,0.7)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(245,158,11,0.5)"; }}
          >
            🚀 Launch Dashboard
          </button>
          <InstallButton />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "32px 8%",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "#020610",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔩</div>
          <span style={{ color: "#fff", fontWeight: 700, letterSpacing: 2, fontSize: "0.9rem" }}>RESQ</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>
          © 2026 RESQ Service  · All rights reserved
        </span>
        <div style={{ display: "flex", gap: 20 }}>
          {["Manager", "Admin", "Technician"].map((r) => (
            <span key={r} style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.82rem" }}>{r}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
