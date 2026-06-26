'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { Shield, Lock, Eye, Database, Users, Globe, Mail, ChevronRight } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const { isAuthenticated } = useAuth();

  const sections = [
    {
      icon: Database,
      title: '1. Information We Collect',
      content: [
        {
          subtitle: 'Account Information',
          text: 'When you register on RANKFORGE, we collect your full name, email address, password (stored in hashed form), and your selected GATE branch/paper preference. This information is essential to create and personalize your account.'
        },
        {
          subtitle: 'Assessment & Performance Data',
          text: 'We collect your mock test responses, scores, time-per-question metrics, accuracy breakdowns by topic, and examination attempt history. This data drives our AI diagnostic engine to identify concept vulnerabilities and generate personalized study recommendations.'
        },
        {
          subtitle: 'Usage Analytics',
          text: 'We automatically collect device type, browser information, session duration, pages visited, and interaction patterns. This helps us optimize platform performance, improve UI/UX, and diagnose technical issues.'
        },
        {
          subtitle: 'AI Interaction Logs',
          text: 'When you interact with ForgeAI (our AI GATE Mentor) or the College Admissions Advisor, your queries and the generated responses are logged to improve response quality and ensure contextually accurate mentoring.'
        }
      ]
    },
    {
      icon: Eye,
      title: '2. How We Use Your Data',
      content: [
        {
          subtitle: 'Personalized Diagnostics',
          text: 'Your performance data is processed through our AI engine to generate estimated All India Ranks (AIR), topic-level accuracy radar charts, concept vulnerability maps, and targeted study recommendations.'
        },
        {
          subtitle: 'Admissions Advisory',
          text: 'Aggregate performance metrics are used by the AI College Admissions Advisor to provide referrals, cutoff comparisons, and admission probability analysis for IISc, IITs, NITs, and other institutes.'
        },
        {
          subtitle: 'Platform Improvement',
          text: 'Anonymized and aggregated data is used internally to improve question quality, refine AI models, optimize platform performance, and enhance the overall user experience.'
        },
        {
          subtitle: 'Communications',
          text: 'We may use your email address to send important account notifications, security alerts, platform updates, and (with your consent) promotional content about new features or study resources.'
        }
      ]
    },
    {
      icon: Users,
      title: '3. Data Sharing & Disclosure',
      content: [
        {
          subtitle: 'No Sale of Personal Data',
          text: 'RANKFORGE does not sell, rent, or trade your personal information to third parties for marketing or commercial purposes under any circumstances.'
        },
        {
          subtitle: 'Service Providers',
          text: 'We may share limited data with trusted third-party service providers (hosting, database, analytics) strictly for the purpose of operating and improving the platform. All providers are bound by confidentiality agreements.'
        },
        {
          subtitle: 'Legal Requirements',
          text: 'We may disclose your information if required by applicable law, regulation, legal process, or enforceable governmental request.'
        },
        {
          subtitle: 'Anonymized Research',
          text: 'Aggregated, de-identified performance statistics may be used for educational research or published as part of platform benchmarks. No individual user can be identified from such data.'
        }
      ]
    },
    {
      icon: Lock,
      title: '4. Data Security',
      content: [
        {
          subtitle: 'Encryption',
          text: 'All data transmissions between your browser and RANKFORGE servers are encrypted using TLS/SSL protocols. Passwords are hashed using industry-standard bcrypt algorithms and are never stored in plaintext.'
        },
        {
          subtitle: 'Access Controls',
          text: 'Access to user data is restricted to authorized personnel only. We implement role-based access controls and audit logging on all backend systems.'
        },
        {
          subtitle: 'Infrastructure',
          text: 'Our application is hosted on enterprise-grade cloud infrastructure with automated backups, DDoS protection, and continuous security monitoring.'
        }
      ]
    },
    {
      icon: Shield,
      title: '5. Your Rights & Choices',
      content: [
        {
          subtitle: 'Access & Portability',
          text: 'You have the right to request a copy of the personal data we hold about you. Contact us at the email below and we will provide your data in a structured, machine-readable format within 30 days.'
        },
        {
          subtitle: 'Correction',
          text: 'You can update your profile information (name, branch preference) at any time through the Settings page. For corrections to other data, contact our support team.'
        },
        {
          subtitle: 'Deletion',
          text: 'You may request the deletion of your account and all associated personal data. Upon verification, we will permanently delete your data within 30 days, except where retention is required by law.'
        },
        {
          subtitle: 'Opt-Out',
          text: 'You can opt out of non-essential communications at any time by adjusting your notification preferences or contacting us directly.'
        }
      ]
    },
    {
      icon: Globe,
      title: '6. Cookies & Tracking',
      content: [
        {
          subtitle: 'Essential Cookies',
          text: 'We use essential cookies to maintain your authentication session, remember your preferences, and ensure the platform functions correctly. These cannot be disabled while using RANKFORGE.'
        },
        {
          subtitle: 'Analytics',
          text: 'We may use privacy-respecting analytics tools to understand usage patterns. These tools do not create cross-site tracking profiles and all analytics data is processed in aggregate.'
        }
      ]
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-transparent text-zinc-100 overflow-x-hidden font-sans flex flex-col justify-between">
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

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-20 w-full space-y-16">
          
          {/* Hero */}
          <section className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/20">
                <Shield className="h-8 w-8 text-brand-400" />
              </div>
            </div>
            <div className="space-y-4">
              <span className="inline-flex rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-400 border border-brand-500/20">
                Privacy Policy
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Your Privacy <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">Matters</span>
              </h1>
              <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                At RANKFORGE, we are committed to protecting your personal information and being transparent about how we collect, use, and safeguard your data. This policy explains our practices in detail.
              </p>
              <p className="text-xs text-zinc-500">
                Last Updated: June 26, 2026
              </p>
            </div>
          </section>

          {/* Policy Sections */}
          <div className="space-y-8">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <section 
                  key={idx} 
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 md:p-8 space-y-5 shadow-md transition hover:border-zinc-700/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-brand-500 border border-zinc-800 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-white">{section.title}</h2>
                  </div>
                  
                  <div className="space-y-4 pl-0 md:pl-13">
                    {section.content.map((item, subIdx) => (
                      <div key={subIdx} className="space-y-1.5">
                        <h3 className="text-sm font-semibold text-zinc-200">{item.subtitle}</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Contact Section */}
            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 md:p-8 space-y-5 shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-brand-500 border border-zinc-800 shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-white">7. Contact Us</h2>
              </div>
              <div className="pl-0 md:pl-13 space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
                </p>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2">
                  <p className="text-xs text-zinc-300">
                    <span className="font-semibold text-zinc-200">Email:</span> privacy@rankforge.com
                  </p>
                  <p className="text-xs text-zinc-300">
                    <span className="font-semibold text-zinc-200">Platform:</span> <Link href="/about" className="text-brand-400 hover:text-brand-300 transition">Contact Form on About Page</Link>
                  </p>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  We will respond to all privacy-related inquiries within 30 business days. RANKFORGE reserves the right to update this Privacy Policy at any time. Material changes will be communicated via email or an in-platform notification.
                </p>
              </div>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-850 bg-zinc-950/90 py-12 text-xs text-zinc-450 mt-20">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
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
                RANKFORGE is an AI-powered diagnostic platform engineered specifically for GATE aspirants to track focus metrics, estimate All India Ranks (AIR), and receive personalized admissions counseling.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navigation</h4>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <Link href={isAuthenticated ? '/dashboard' : '/login'} className="hover:text-brand-400 transition">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-brand-400 transition">
                    About RANKFORGE
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-brand-400 transition">
                    Terms of Use
                  </Link>
                </li>
              </ul>
            </div>

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
              <Link href="/privacy" className="hover:text-zinc-300 text-brand-400 font-semibold">Privacy Policy</Link>
              <span className="text-zinc-800">|</span>
              <Link href="/terms" className="hover:text-zinc-300">Terms of Use</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
