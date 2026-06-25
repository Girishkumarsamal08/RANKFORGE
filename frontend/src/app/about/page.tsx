'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { 
  Trophy, 
  Target, 
  HelpCircle, 
  Mail, 
  Phone, 
  User, 
  ChevronRight, 
  CheckCircle,
  FileText,
  Bot,
  BarChart2,
  AlertTriangle,
  Github,
  Linkedin,
  Globe
} from 'lucide-react';

export default function AboutPage() {
  const { isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Form State
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.message) return;
    setSubmitted(true);
    setTimeout(() => {
      setForm({ firstName: '', lastName: '', email: '', phone: '', message: '' });
      setSubmitted(false);
      alert('Thank you for contacting us! We will get back to you soon.');
    }, 1500);
  };

  // Starry Background Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const CONFIG = {
      starCount: 150,
      meteorCount: 5,
      meteorSpeed: 3,
      meteorLength: 120,
      meteorInterval: 3000,
    };

    let stars: Array<{
      x: number;
      y: number;
      radius: number;
      alpha: number;
      alphaChange: number;
    }> = [];

    let meteors: Array<{
      x: number;
      y: number;
      length: number;
      speed: number;
      alpha: number;
      angle: number;
    }> = [];

    function resize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      createStars();
    }

    function random(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function createStars() {
      stars = [];
      for (let i = 0; i < CONFIG.starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.2,
          alpha: Math.random(),
          alphaChange: 0.003 + Math.random() * 0.012,
        });
      }
    }

    function createMeteor() {
      meteors.push({
        x: random(width * 0.1, width * 0.9),
        y: 0,
        length: CONFIG.meteorLength,
        speed: CONFIG.meteorSpeed,
        alpha: 1,
        angle: Math.PI / 4,
      });
    }

    function drawStars() {
      stars.forEach(star => {
        star.alpha += star.alphaChange;
        if (star.alpha <= 0 || star.alpha >= 1) star.alphaChange = -star.alphaChange;
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
        ctx!.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, star.alpha))})`;
        ctx!.fill();
      });
    }

    function drawMeteors() {
      meteors.forEach((meteor, index) => {
        meteor.x += meteor.speed * Math.cos(meteor.angle);
        meteor.y += meteor.speed * Math.sin(meteor.angle);
        meteor.alpha -= 0.008;
        if (meteor.alpha <= 0 || meteor.x > width || meteor.y > height) {
          meteors.splice(index, 1);
          return;
        }
        const grad = ctx!.createLinearGradient(
          meteor.x, 
          meteor.y, 
          meteor.x - meteor.length * Math.cos(meteor.angle), 
          meteor.y - meteor.length * Math.sin(meteor.angle)
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${meteor.alpha})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(meteor.x, meteor.y);
        ctx!.lineTo(
          meteor.x - meteor.length * Math.cos(meteor.angle), 
          meteor.y - meteor.length * Math.sin(meteor.angle)
        );
        ctx!.stroke();
      });
    }

    let animationId: number;
    function animate() {
      ctx!.clearRect(0, 0, width, height);
      drawStars();
      drawMeteors();
      animationId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();

    const meteorTimer = setInterval(() => {
      if (meteors.length < CONFIG.meteorCount) {
        createMeteor();
      }
    }, CONFIG.meteorInterval);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      clearInterval(meteorTimer);
    };
  }, []);

  const features = [
    {
      title: 'AI-Powered Diagnostics',
      description: 'Isolates and highlights concept vulnerabilities by mapping your accuracies against standard deviation thresholds, directing your revisions to high-impact targets.',
      icon: Target,
      tag: 'Diagnostics'
    },
    {
      title: 'Year-Specific Mock Exams',
      description: 'Select any year from 2020 to 2025 and take simulated exams matching the exact papers, loaded inside fullscreen constraints to match real GATE environments.',
      icon: FileText,
      tag: 'Practice'
    },
    {
      title: 'AI College Admissions Advisor',
      description: 'Interact with our LLM-backed specialist to receive customized referrals, gate cutoff metrics, and admission probability analysis for prime institutes.',
      icon: Bot,
      tag: 'Advisory'
    },
    {
      title: 'Performance Classifiers',
      description: 'Plot radar chart accuracy metrics, track scores across modules, and review scaled rank probability distribution models built to scale with 700k candidates.',
      icon: BarChart2,
      tag: 'Analytics'
    }
  ];

  const team = [
    {
      name: 'Girish Kumar Samal',
      role: 'Founder & Partner',
      image: '/Girish.png',
      linkedin: 'https://www.linkedin.com/in/girish-kumar-samal08/',
      github: 'https://github.com/Girishkumarsamal08',
      website: 'https://www.girishkumar.dev/'
    },
    {
      name: 'Swayamsuchee Pradhan',
      role: 'Co-Founder & Partner',
      image: '/Swayamsuchee.jpeg',
      linkedin: 'https://www.linkedin.com/in/swayamsuchee-pradhan09/',
      github: 'https://github.com/SwayamsucheePradhan09',
      website: 'https://www.swayamsuchee.dev/'
    }
  ];

  const faqs = [
    {
      q: 'How does the Estimated All India Rank (AIR) calculate my standing?',
      a: 'RANKFORGE models your scaled mock marks against a normal distribution derived from over 700,000 historical candidates. This gives you a statistical projection of where you stand relative to the national average.'
    },
    {
      q: 'Why does the mock test require fullscreen mode to start?',
      a: 'To guarantee strict examination realism and logs focus metrics. Real GATE tests operate on restricted terminal clients; fullscreen constraints help prepare you for this exam environment.'
    },
    {
      q: 'Will my college admissions verdict change as I attempt more tests?',
      a: 'Absolutely. The AI Admissions Advisor evaluates your cumulative historical performance. As you solve more exams, improve accuracies, and reduce your estimated rank range, it dynamically updates referrals for IISc, IITs, and NITs.'
    },
    {
      q: 'What do the different syllabus weightage cards represent?',
      a: 'They follow the exact official GATE blueprint: General Aptitude 15%, Engineering Mathematics 13%, and Core CS subjects 72%. Use this breakdown to direct study time toward the highest-yield chapters.'
    },
    {
      q: 'Can I review details of my concept weaknesses?',
      a: 'Yes, the Concept Vulnerabilities section highlights specific chapters where your scaling drops below the standard deviation target, detailing exactly what topics require revision.'
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#050508] text-zinc-100 overflow-x-hidden font-sans flex flex-col justify-between">
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-40" />

      {/* Background Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/70 px-6 py-4 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <img src="/logo.jpeg" alt="RANKFORGE Logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                RANK<span className="bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">FORGE</span>
              </span>
            </div>
            
            <Link 
              href={isAuthenticated ? '/dashboard' : '/login'} 
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white transition cursor-pointer"
            >
              {isAuthenticated ? '← Back to Dashboard' : '← Back to Login'}
            </Link>
          </div>
        </header>

        {/* Main Content Container */}
        <main className="flex-1 max-w-6xl mx-auto px-6 py-12 md:py-20 w-full space-y-24 md:space-y-32">
          
          {/* Hero Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 items-center gap-12 md:gap-16">
            <div className="space-y-6 text-left">
              <span className="inline-flex rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-400 border border-brand-500/20">
                About RANKFORGE
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
                Discover <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">RANKFORGE</span>
              </h1>
              <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-xl">
                RANKFORGE is a community-driven, SaaS diagnostic platform engineered specifically for GATE computer science aspirants. Designed to pinpoint weaknesses, simulate real-world testing environments, and provide AI-based admissions counseling, RANKFORGE scales preparation from generic practice to data-driven precision.
              </p>
              <div className="flex gap-4">
                <Link 
                  href={isAuthenticated ? '/dashboard' : '/login'} 
                  className="inline-flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition cursor-pointer"
                >
                  <span>Explore Platform</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            <div className="flex justify-center items-center">
              <div className="relative rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-2 shadow-2xl overflow-hidden group max-w-md w-full">
                <img 
                  src="/Rankforge.png" 
                  alt="RANKFORGE Showcase" 
                  className="rounded-2xl w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition duration-500 shadow-lg"
                  onError={(e) => {
                    // Fallback to standard logo if Rankforge.png is missing
                    const target = e.target as HTMLImageElement;
                    target.src = '/logo.jpeg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Key Features</h2>
              <p className="text-xs md:text-sm text-zinc-400">
                Explore the core services built inside RANKFORGE to assist students in cracking competitive examinations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={idx} 
                    className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 flex gap-4 transition-all hover:bg-zinc-900/60 hover:border-zinc-700/80 shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 text-brand-500 border border-zinc-850 shrink-0 group-hover:bg-brand-950/20 group-hover:text-brand-400 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">{feature.tag}</span>
                      <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors">{feature.title}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Partners Section */}
          <section className="space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Platform Partners</h2>
              <p className="text-xs md:text-sm text-zinc-400">
                RANKFORGE is built and maintained with care, logic, and purpose by its founding partners. Connect with the creators of the platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              {team.map((member, idx) => (
                <div 
                  key={idx} 
                  className="group rounded-2xl border border-zinc-800/85 bg-zinc-900/35 p-6 text-center space-y-5 transition hover:bg-zinc-900/60 hover:border-zinc-700 shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="relative mx-auto h-28 w-28 rounded-2xl overflow-hidden border border-zinc-850 bg-zinc-950 shadow-md group-hover:border-brand-500/50 transition">
                      <img 
                        src={member.image} 
                        alt={member.name} 
                        className="h-full w-full object-cover filter saturate-75 group-hover:saturate-100 transition duration-300"
                        onError={(e) => {
                          // Fallback to initial name avatars if Girish.png or Swayamsuchee.png not loaded yet
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=18181b&color=a855f7&size=128`;
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors">{member.name}</h3>
                      <p className="text-xs text-zinc-450 mt-1">{member.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 pt-3 border-t border-zinc-850/60">
                    <a 
                      href={member.github} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-850 hover:bg-zinc-900 hover:text-white transition"
                      title="GitHub"
                    >
                      <Github className="h-4.5 w-4.5" />
                    </a>
                    <a 
                      href={member.linkedin} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-850 hover:bg-zinc-900 hover:text-white transition"
                      title="LinkedIn"
                    >
                      <Linkedin className="h-4.5 w-4.5" />
                    </a>
                    <a 
                      href={member.website} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-850 hover:bg-zinc-900 hover:text-white transition"
                      title="Website"
                    >
                      <Globe className="h-4.5 w-4.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQs Section */}
          <section className="space-y-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-[Space_Grotesk]">Frequently Asked Questions</h2>
              <p className="text-xs md:text-sm text-zinc-400">
                Got questions about the RANKFORGE testing engine, AI insights, or admissions advisor? We have answers.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, idx) => (
                <details 
                  key={idx} 
                  className="group rounded-xl border border-zinc-850 bg-zinc-900/25 p-5 shadow-sm transition hover:border-zinc-700/80 cursor-pointer"
                >
                  <summary className="flex justify-between items-center text-sm font-semibold text-zinc-200 group-open:text-brand-400 transition-colors">
                    <span>{faq.q}</span>
                    <span className="text-lg text-zinc-400 group-open:rotate-45 transform transition-transform duration-300">×</span>
                  </summary>
                  <p className="mt-3 text-xs text-zinc-400 leading-relaxed border-t border-zinc-850/80 pt-3 pl-1">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Contact Section */}
          <section className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Contact Us</h2>
              <p className="text-xs md:text-sm text-zinc-400">
                Let's connect. Submit your feedback, issues, or suggestions and our development team will analyze it.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-2xl relative space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    required 
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="John" 
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-xs text-white placeholder-zinc-550 outline-none transition focus:border-brand-500 focus:bg-zinc-900/80"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    required 
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Doe" 
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-xs text-white placeholder-zinc-550 outline-none transition focus:border-brand-500 focus:bg-zinc-900/80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com" 
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-xs text-white placeholder-zinc-550 outline-none transition focus:border-brand-500 focus:bg-zinc-900/80"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">Phone (Optional)</label>
                  <input 
                    type="tel" 
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX" 
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-xs text-white placeholder-zinc-555 outline-none transition focus:border-brand-500 focus:bg-zinc-900/80"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">Message</label>
                <textarea 
                  required 
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write your suggestions, issue details or questions..." 
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-xs text-white placeholder-zinc-550 outline-none transition focus:border-brand-500 focus:bg-zinc-900/80 resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitted}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {submitted ? 'Submitting Form...' : "Let's Talk"}
              </button>
            </form>
          </section>

          {/* Report Issue Banner */}
          <section className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-red-500/20 via-pink-500/10 to-transparent border border-red-500/20 p-8 rounded-3xl text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">🚨 Report an Issue</h2>
              <p className="text-xs text-zinc-450 max-w-lg mx-auto">
                Found a bug, glitch, scale issue or incorrect classification inside mock report diagnostics? Assist us in refining the normal distribution classify boundaries.
              </p>
              <a 
                href="mailto:support@rankforge.example.com?subject=RANKFORGE Bug Report"
                className="inline-flex items-center justify-center px-6 py-2.5 text-xs font-bold text-white bg-red-650 hover:bg-red-700 transition rounded-full shadow-md"
              >
                Send Bug Report
              </a>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-850 bg-zinc-950/90 py-12 text-xs text-zinc-450 mt-20">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About Column */}
            <div className="space-y-4 md:col-span-2 text-left">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 overflow-hidden items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm">
                  <img src="/logo.jpeg" alt="RANKFORGE Logo" className="h-full w-full object-cover" />
                </div>
                <span className="text-sm font-bold tracking-tight text-white">
                  RANK<span className="bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">FORGE</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed max-w-sm">
                RANKFORGE is an AI-powered diagnostic platform engineered specifically for GATE computer science aspirants to track focus metrics, estimate All India Ranks (AIR), and receive personalized admissions counseling.
              </p>
            </div>

            {/* Quick Links Column */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navigation</h4>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <Link href={isAuthenticated ? '/dashboard' : '/login'} className="hover:text-brand-400 transition">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/tests/start" className="hover:text-brand-400 transition">
                    GATE Mock Tests
                  </Link>
                </li>
                <li>
                  <Link href="/pyqs" className="hover:text-brand-400 transition">
                    GATE PYQ Library
                  </Link>
                </li>
              </ul>
            </div>

            {/* Partners Column */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Founders</h4>
              <div className="space-y-3">
                <div className="text-[11px]">
                  <a href="https://www.girishkumar.dev/" target="_blank" rel="noreferrer" className="font-semibold text-zinc-300 hover:text-brand-400 transition block">
                    Girish Kumar Samal
                  </a>
                  <span className="text-[10px] text-zinc-500 block">Founder & Partner</span>
                </div>
                <div className="text-[11px]">
                  <a href="https://www.swayamsuchee.dev/" target="_blank" rel="noreferrer" className="font-semibold text-zinc-300 hover:text-brand-400 transition block">
                    Swayamsuchee Pradhan
                  </a>
                  <span className="text-[10px] text-zinc-500 block">Co-Founder & Partner</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 border-t border-zinc-900 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p>© {new Date().getFullYear()} RANKFORGE. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-zinc-300">Privacy Policy</Link>
              <span className="text-zinc-800">|</span>
              <Link href="/terms" className="hover:text-zinc-300">Terms of Use</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
