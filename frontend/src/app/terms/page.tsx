'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { FileText, Scale, UserCheck, AlertTriangle, BookOpen, Shield, Ban, RefreshCw, Mail, Gavel } from 'lucide-react';

export default function TermsOfUsePage() {
  const { isAuthenticated } = useAuth();

  const sections = [
    {
      icon: FileText,
      title: '1. Acceptance of Terms',
      content: [
        {
          subtitle: 'Agreement',
          text: 'By accessing, browsing, or using the RANKFORGE platform (including all associated web pages, APIs, and services), you acknowledge that you have read, understood, and agree to be bound by these Terms of Use. If you do not agree to these terms, you must discontinue use of the platform immediately.'
        },
        {
          subtitle: 'Eligibility',
          text: 'You must be at least 16 years of age to create an account on RANKFORGE. By registering, you represent and warrant that you meet this age requirement and have the legal capacity to enter into this agreement.'
        },
        {
          subtitle: 'Modifications',
          text: 'RANKFORGE reserves the right to update or modify these Terms of Use at any time. Material changes will be communicated through email or an in-platform notification. Continued use of the platform after such changes constitutes your acceptance of the revised terms.'
        }
      ]
    },
    {
      icon: BookOpen,
      title: '2. Description of Services',
      content: [
        {
          subtitle: 'GATE Mock Examinations',
          text: 'RANKFORGE provides year-specific, branch-specific simulated GATE examinations across 29 supported engineering disciplines. Mock tests include General Aptitude papers, Core Subject papers, and Full Mock Exams that replicate the structure and timing constraints of the actual GATE examination.'
        },
        {
          subtitle: 'AI Diagnostic Engine',
          text: 'Our platform employs artificial intelligence to analyze your test performance, identify concept vulnerabilities, generate topic-level accuracy radar charts, and provide personalized study recommendations. These diagnostics are powered by statistical models and should be used as supplementary study aids.'
        },
        {
          subtitle: 'Rank Prediction & Analytics',
          text: 'RANKFORGE estimates your All India Rank (AIR) by modeling your scaled mock marks against a normal distribution derived from historical GATE candidate data. These projections are statistical estimates and do not guarantee actual GATE examination results or ranks.'
        },
        {
          subtitle: 'AI College Admissions Advisor',
          text: 'The AI-powered admissions advisor provides recommendations for IISc, IITs, NITs, and other institutes based on your performance metrics. These recommendations are advisory in nature and should not be treated as guaranteed admission outcomes.'
        }
      ]
    },
    {
      icon: UserCheck,
      title: '3. User Accounts & Responsibilities',
      content: [
        {
          subtitle: 'Account Security',
          text: 'You are responsible for maintaining the confidentiality of your account credentials (email and password). You agree to notify RANKFORGE immediately of any unauthorized access or use of your account. RANKFORGE is not liable for any loss arising from your failure to safeguard your credentials.'
        },
        {
          subtitle: 'Accurate Information',
          text: 'You agree to provide truthful, accurate, and complete information during registration and to keep your profile information (including name and GATE branch selection) current. Providing false information may result in account suspension or termination.'
        },
        {
          subtitle: 'Single User Access',
          text: 'Each RANKFORGE account is intended for use by a single individual. You may not share, transfer, or sublicense your account access to any other person or entity.'
        }
      ]
    },
    {
      icon: Ban,
      title: '4. Prohibited Conduct',
      content: [
        {
          subtitle: 'Platform Integrity',
          text: 'You agree not to: (a) attempt to reverse-engineer, decompile, or disassemble any part of the platform; (b) use automated bots, scrapers, or crawlers to extract content or data; (c) circumvent fullscreen examination constraints or other security measures; (d) interfere with or disrupt the platform\'s infrastructure or other users\' experiences.'
        },
        {
          subtitle: 'Content Misuse',
          text: 'You may not reproduce, distribute, publicly display, or create derivative works from RANKFORGE\'s proprietary content, including but not limited to: mock test questions, AI-generated recommendations, analytical reports, radar chart visualizations, and rank estimation algorithms.'
        },
        {
          subtitle: 'Academic Dishonesty',
          text: 'Any attempt to manipulate test scores, exploit platform vulnerabilities for unfair advantages, or misrepresent RANKFORGE mock test results as official GATE scores is strictly prohibited and grounds for immediate account termination.'
        }
      ]
    },
    {
      icon: Scale,
      title: '5. Intellectual Property',
      content: [
        {
          subtitle: 'Platform Ownership',
          text: 'All content, features, functionality, design elements, source code, algorithms, trademarks, and branding associated with RANKFORGE are the exclusive intellectual property of RANKFORGE and its founders. All rights are reserved.'
        },
        {
          subtitle: 'User Content',
          text: 'By submitting feedback, suggestions, or contact form messages through the platform, you grant RANKFORGE a non-exclusive, royalty-free, perpetual license to use, modify, and incorporate such content for the purpose of improving the platform and its services.'
        },
        {
          subtitle: 'GATE Examination Content',
          text: 'Mock test questions are designed to simulate the GATE examination format and difficulty level. They are original compositions by the RANKFORGE team and AI systems, and do not reproduce actual GATE examination papers verbatim. Official GATE examination content remains the intellectual property of its respective organizing bodies (IITs/IISc).'
        }
      ]
    },
    {
      icon: AlertTriangle,
      title: '6. Disclaimers & Limitations',
      content: [
        {
          subtitle: 'No Guarantee of Results',
          text: 'RANKFORGE provides diagnostic tools and statistical projections based on mock test performance. We do not guarantee that using our platform will result in any specific GATE score, rank, or admission outcome. All AI-generated predictions, rank estimates, and college recommendations are advisory and probabilistic in nature.'
        },
        {
          subtitle: 'Service Availability',
          text: 'RANKFORGE is provided on an "as-is" and "as-available" basis. We do not warrant that the platform will be uninterrupted, error-free, or free of viruses or harmful components. We reserve the right to modify, suspend, or discontinue any part of the service at any time without prior notice.'
        },
        {
          subtitle: 'Limitation of Liability',
          text: 'To the maximum extent permitted by applicable law, RANKFORGE and its founders, partners, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the platform, including but not limited to loss of data, revenue, or academic opportunities.'
        }
      ]
    },
    {
      icon: Shield,
      title: '7. Data & Privacy',
      content: [
        {
          subtitle: 'Privacy Policy',
          text: 'Your use of RANKFORGE is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the platform, you consent to the data practices described in our Privacy Policy.'
        },
        {
          subtitle: 'Data Retention',
          text: 'We retain your account data and performance history for as long as your account is active. Upon account deletion, personal data will be permanently removed within 30 days, except where retention is required by law or for legitimate business purposes.'
        }
      ]
    },
    {
      icon: Gavel,
      title: '8. Governing Law & Dispute Resolution',
      content: [
        {
          subtitle: 'Governing Law',
          text: 'These Terms of Use shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.'
        },
        {
          subtitle: 'Dispute Resolution',
          text: 'Any disputes arising out of or in connection with these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to the exclusive jurisdiction of the courts located in Odisha, India.'
        }
      ]
    },
    {
      icon: RefreshCw,
      title: '9. Termination',
      content: [
        {
          subtitle: 'By You',
          text: 'You may terminate your account at any time by contacting our support team or through the platform\'s account settings. Upon termination, your right to access the platform will immediately cease.'
        },
        {
          subtitle: 'By RANKFORGE',
          text: 'RANKFORGE reserves the right to suspend or terminate your account at any time, with or without cause, including but not limited to violations of these Terms of Use, prohibited conduct, or suspected fraudulent activity. You will be notified of the reason for termination when applicable.'
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
                <FileText className="h-8 w-8 text-brand-400" />
              </div>
            </div>
            <div className="space-y-4">
              <span className="inline-flex rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-400 border border-brand-500/20">
                Terms of Use
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Terms & <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">Conditions</span>
              </h1>
              <p className="text-sm md:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                Please read these Terms of Use carefully before accessing or using the RANKFORGE platform. These terms define the rules and regulations governing your use of our services, including mock examinations, AI diagnostics, and admissions advisory tools.
              </p>
              <p className="text-xs text-zinc-500">
                Last Updated: June 26, 2026
              </p>
            </div>
          </section>

          {/* Terms Sections */}
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
                <h2 className="text-lg md:text-xl font-bold text-white">10. Contact Information</h2>
              </div>
              <div className="pl-0 md:pl-13 space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  If you have any questions or concerns regarding these Terms of Use, please reach out to us:
                </p>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2">
                  <p className="text-xs text-zinc-300">
                    <span className="font-semibold text-zinc-200">Email:</span> legal@rankforge.com
                  </p>
                  <p className="text-xs text-zinc-300">
                    <span className="font-semibold text-zinc-200">Platform:</span> <Link href="/about" className="text-brand-400 hover:text-brand-300 transition">Contact Form on About Page</Link>
                  </p>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  By continuing to use RANKFORGE, you confirm that you have read, understood, and agree to abide by these Terms of Use and our accompanying Privacy Policy.
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
                  <Link href="/privacy" className="hover:text-brand-400 transition">
                    Privacy Policy
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
              <Link href="/privacy" className="hover:text-zinc-300">Privacy Policy</Link>
              <span className="text-zinc-800">|</span>
              <Link href="/terms" className="hover:text-zinc-300 text-brand-400 font-semibold">Terms of Use</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
