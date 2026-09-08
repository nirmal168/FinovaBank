import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Instagram, Youtube, ArrowUp } from 'lucide-react';
import BrandLogo from '../BrandLogo';

const LandingFooter = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]/70 text-[var(--finova-text-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10">
          
          {/* Brand Column (Col Span 2 on small/med) */}
          <div className="col-span-2 space-y-4">
            <Link to="/" onClick={scrollToTop} className="inline-block">
              <BrandLogo size="md" showText={true} />
            </Link>
            <p className="text-xs sm:text-sm text-[var(--finova-text-muted)] max-w-sm leading-relaxed">
              Smart Banking. Smarter Future. <br />
              Finova is a simulated digital banking ecosystem created for educational 
              demonstration and advanced financial technology research.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Finova on LinkedIn"
                className="h-8 w-8 rounded-xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] flex items-center justify-center text-[var(--finova-text-muted)] hover:text-[var(--finova-navy)] hover:border-[var(--finova-navy)]/40 transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Finova on Twitter"
                className="h-8 w-8 rounded-xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] flex items-center justify-center text-[var(--finova-text-muted)] hover:text-[var(--finova-navy)] hover:border-[var(--finova-navy)]/40 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Finova on Instagram"
                className="h-8 w-8 rounded-xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] flex items-center justify-center text-[var(--finova-text-muted)] hover:text-[var(--finova-navy)] hover:border-[var(--finova-navy)]/40 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Finova on YouTube"
                className="h-8 w-8 rounded-xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] flex items-center justify-center text-[var(--finova-text-muted)] hover:text-[var(--finova-navy)] hover:border-[var(--finova-navy)]/40 transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--finova-text-heading)]">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-[var(--finova-navy)] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-[var(--finova-navy)] transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-[var(--finova-navy)] transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a href="#fraud" className="hover:text-[var(--finova-navy)] transition-colors">
                  AI Fraud Shield
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--finova-text-heading)]">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="hover:text-[var(--finova-navy)] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[var(--finova-navy)] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/about#architecture" className="hover:text-[var(--finova-navy)] transition-colors">
                  Tech Stack
                </Link>
              </li>
              <li>
                <Link to="/contact#careers" className="hover:text-[var(--finova-navy)] transition-colors">
                  Careers (Open Roles)
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--finova-text-heading)]">
              Support & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/contact" className="hover:text-[var(--finova-navy)] transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[var(--finova-navy)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[var(--finova-navy)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[var(--finova-navy)] transition-colors">
                  Customer Portal
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-Footer Bar */}
        <div className="mt-12 pt-6 border-t border-[var(--finova-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--finova-text-muted)]">
          <p>© 2026 Finova. All rights reserved. Academic Simulation.</p>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Built for a Smarter, Financially Empowered Tomorrow.</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="p-1.5 rounded-lg bg-[var(--finova-card-bg)] border border-[var(--finova-border)] hover:text-[var(--finova-text-heading)] hover:border-[var(--finova-navy)] transition-colors inline-flex items-center gap-1"
              title="Back to top"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold">Top</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
