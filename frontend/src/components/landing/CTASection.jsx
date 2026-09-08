import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CTASection = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section id="cta" className="py-16 sm:py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navy Container with soft glows */}
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-br from-[var(--finova-navy)] via-[#102A43] to-slate-950 text-white shadow-2xl relative overflow-hidden text-center">
          
          {/* Background Ambient Glows */}
          <div 
            className="absolute top-0 right-0 w-80 h-80 bg-[var(--finova-sage)]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" 
            aria-hidden="true" 
          />
          <div 
            className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" 
            aria-hidden="true" 
          />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Begin Your Journey Today</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Ready to Take Control of Your Finances?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Join thousands of users who trust Finova for a smarter, 
              faster, and more secure digital banking experience.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-slate-900 bg-white hover:bg-slate-100 shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="h-4 w-4 text-slate-900" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-slate-900 bg-white hover:bg-slate-100 shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Create Your Account</span>
                    <ArrowRight className="h-4 w-4 text-slate-900" />
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all transform hover:-translate-y-0.5 backdrop-blur-sm"
                  >
                    <span>Login</span>
                  </Link>
                </>
              )}
            </div>

            <p className="text-[11px] text-slate-400/90 pt-2">
              Instant digital access • No paperwork • Simulated educational platform
            </p>

          </div>

        </div>

      </div>
    </section>
  );
};

export default CTASection;
