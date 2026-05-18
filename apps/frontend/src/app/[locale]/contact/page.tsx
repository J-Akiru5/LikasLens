"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, MapPin, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/layout/header";
import { showToast } from "@likaslens/shared";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/contact-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        showToast("Message sent successfully", "success");
      } else {
        showToast("Failed to send message. Please try again.", "error");
      }
    } catch (error) {
      console.error("Failed to submit contact form", error);
      showToast("Failed to send message. Check your connection.", "error");
    }

    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", message: "" });
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1b4332]/10 to-[#2de1c2]/10 font-body">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto p-4 sm:p-8 pt-12 pb-24">
        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 rounded transition-colors font-mono text-sm font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Info */}
          <div>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary mb-4 bg-background/50 rounded">
                <MessageSquare className="w-4 h-4 text-secondary" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
                  Get in Touch
                </span>
              </div>
              <h1 className="font-heading text-4xl sm:text-6xl font-black uppercase tracking-tight text-primary mb-4">
                Connect With Us
              </h1>
              <p className="text-xl text-foreground/80 font-semibold">
                Have questions about the platform, partnerships, or environmental laws? Our team is here to help.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 brutal-panel border-2 border-primary bg-background/40">
                <Mail className="w-6 h-6 text-secondary shrink-0" />
                <div>
                  <h3 className="font-heading font-black uppercase text-sm text-primary">Email</h3>
                  <p className="font-mono text-sm">hello@likaslens.ph</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 brutal-panel border-2 border-primary bg-background/40">
                <MapPin className="w-6 h-6 text-secondary shrink-0" />
                <div>
                  <h3 className="font-heading font-black uppercase text-sm text-primary">Location</h3>
                  <p className="font-mono text-sm uppercase">Manila, Philippines</p>
                  <p className="text-xs text-foreground/60 mt-1">Distributed Team • Remote First</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="brutal-panel panel-surface border-4 border-primary p-6 sm:p-8"
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-6"
                >
                  <div>
                    <label className="block font-heading font-black uppercase text-sm text-primary mb-2">Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full theme-input px-4 py-3 rounded font-mono text-sm border-2 border-primary"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>
                  <div>
                    <label className="block font-heading font-black uppercase text-sm text-primary mb-2">Email</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full theme-input px-4 py-3 rounded font-mono text-sm border-2 border-primary"
                      placeholder="juan@example.ph"
                    />
                  </div>
                  <div>
                    <label className="block font-heading font-black uppercase text-sm text-primary mb-2">Message</label>
                    <textarea 
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full theme-input px-4 py-3 rounded font-mono text-sm border-2 border-primary resize-none"
                      placeholder="How can we assist you?"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full brutal-button px-6 py-4 font-heading font-black uppercase text-lg rounded-lg flex items-center justify-center gap-2 shadow-[6px_6px_0px_rgba(27,67,50,1)] hover:shadow-[2px_2px_0px_rgba(27,67,50,1)] hover:translate-x-1 hover:translate-y-1 transition-all"
                  >
                    <Send className="w-5 h-5" />
                    Send Message
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12"
                >
                  <CheckCircle2 className="w-16 h-16 text-secondary mb-6" />
                  <h2 className="font-heading text-3xl font-black uppercase text-primary mb-2">Received!</h2>
                  <p className="text-foreground/70 font-semibold">
                    Thanks for reaching out, {formData.name.split(' ')[0]}. We'll get back to you shortly.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-8 font-mono text-xs font-bold uppercase tracking-widest text-secondary hover:underline"
                  >
                    Send another message
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
