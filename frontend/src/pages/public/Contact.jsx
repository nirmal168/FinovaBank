import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Send, CheckCircle2, Phone, MapPin } from 'lucide-react';
import LandingNavbar from '../../components/landing/LandingNavbar';
import LandingFooter from '../../components/landing/LandingFooter';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[var(--finova-bg-main)] text-[var(--finova-text-heading)] transition-colors duration-200 flex flex-col justify-between">
      <LandingNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 space-y-10">
        
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--finova-navy)] hover:text-[var(--finova-sage)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--finova-sage)]/10 text-[var(--finova-sage)] text-xs font-bold uppercase tracking-wider">
            Inquiries & Support
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[var(--finova-text-heading)] tracking-tight">
            Contact Finova
          </h1>
          <p className="text-base text-[var(--finova-text-secondary)] leading-relaxed">
            Have questions regarding the architecture, code review, or demo capabilities? 
            Reach out through the contact form below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Info Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs space-y-4">
              <h3 className="font-bold text-base text-[var(--finova-text-heading)]">
                Project Communication
              </h3>
              <p className="text-xs text-[var(--finova-text-secondary)] leading-relaxed">
                As this application represents an educational software simulation, messages submitted 
                through this form are captured in client state.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-[var(--finova-navy)]/10 text-[var(--finova-navy)] flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[var(--finova-text-muted)] block">Email Support</span>
                    <span className="font-bold text-[var(--finova-text-heading)]">support@finova.bank</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-[var(--finova-sage)]/10 text-[var(--finova-sage)] flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[var(--finova-text-muted)] block">Helpline (Simulated)</span>
                    <span className="font-bold text-[var(--finova-text-heading)]">+91 (800) FINOVA-01</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[var(--finova-text-muted)] block">Engineering HQ</span>
                    <span className="font-bold text-[var(--finova-text-heading)]">Bangalore / New Delhi, India</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="md:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs">
              
              {submitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--finova-text-heading)]">
                    Thank you! Your message has been received.
                  </h3>
                  <p className="text-xs text-[var(--finova-text-muted)] max-w-sm mx-auto">
                    This message was recorded for demo verification. Our team will review simulation feedback promptly.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  <Input
                    label="Full Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nirmal Prajapat"
                    required
                  />

                  <Input
                    label="Email Address *"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nirmal@example.com"
                    required
                  />

                  <Input
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Project Inquiry / Feedback"
                  />

                  <div>
                    <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1.5">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Share your inquiry or feedback..."
                      className="w-full rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)] px-3.5 py-2.5 text-xs text-[var(--finova-text-heading)] transition-all focus:border-[var(--finova-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--finova-navy)]/20"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isSubmitting}
                    icon={Send}
                  >
                    Submit Inquiry
                  </Button>
                </form>
              )}

            </div>
          </div>

        </div>

      </main>

      <LandingFooter />
    </div>
  );
};

export default Contact;
