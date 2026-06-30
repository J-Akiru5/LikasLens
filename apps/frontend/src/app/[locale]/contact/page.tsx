"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, MapPin, Send, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@likaslens/shared";
import { showToast } from "@likaslens/shared";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("contact");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/contact-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setSubmitted(true);
        showToast(t("sendSuccess"), "success");
      } else {
        showToast(t("sendError"), "error");
      }
    } catch (error) {
      console.error("Failed to submit contact form", error);
      showToast(t("sendErrorConn"), "error");
    } finally {
      setSubmitting(false);
    }

    if (submitted) {
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: "", email: "", message: "" });
      }, 5000);
    }
  };

  return (
    <div className="min-h-dvh bg-page">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto p-4 sm:p-8 pt-12 pb-24">
        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 border border-border text-accent hover:bg-accent/5 rounded-lg transition-colors font-mono text-sm font-medium uppercase tracking-wider"          >
          <ArrowLeft className="w-4 h-4" />
          {t("backToHome")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Info */}
          <div>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-border mb-4 rounded-lg">
                <MessageCircle className="w-4 h-4 text-green" />
                <span className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
                  {t("getInTouch")}
                </span>
              </div>
              <h1 className="font-semibold tracking-tight text-4xl sm:text-6xl text-ink mb-4">
                {t("connectWithUs")}
              </h1>
              <p className="text-xl text-ink/80 font-semibold">
                {t("heroDesc")}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 panel">
                <Mail className="w-6 h-6 text-green shrink-0" />
                <div>
                  <h3 className="font-semibold tracking-tight uppercase text-sm text-ink">{t("emailLabel")}</h3>
                  <p className="font-mono text-sm">hello@likaslens.ph</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 panel">
                <MapPin className="w-6 h-6 text-green shrink-0" />
                <div>
                  <h3 className="font-semibold tracking-tight uppercase text-sm text-ink">{t("locationLabel")}</h3>
                  <p className="font-mono text-sm uppercase">Iloilo, Philippines</p>
                  <p className="text-xs text-muted mt-1">{t("distributedTeam")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="panel p-6 sm:p-8"
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
                    <label className="block font-semibold tracking-tight uppercase text-sm text-ink mb-2">{t("nameLabel")}</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full theme-input px-4 py-3 font-mono text-sm"
                      placeholder={t("namePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold tracking-tight uppercase text-sm text-ink mb-2">{t("emailAddressLabel")}</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full theme-input px-4 py-3 font-mono text-sm"
                      placeholder={t("emailPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold tracking-tight uppercase text-sm text-ink mb-2">{t("messageLabel")}</label>
                    <textarea 
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full theme-input px-4 py-3 font-mono text-sm resize-none"
                      placeholder={t("messagePlaceholder")}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent text-white rounded-lg px-6 py-4 font-semibold tracking-tight text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t("sending")}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t("sendMessage")}
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12"
                >
                  <CheckCircle className="w-16 h-16 text-green mb-6 fill-current" />
                  <h2 className="font-semibold tracking-tight text-3xl text-ink mb-2">{t("receivedTitle")}</h2>
                  <p className="text-ink/70 font-semibold">
                    {t("receivedDesc", { name: formData.name.split(' ')[0] })}
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-8 font-mono text-xs font-medium uppercase tracking-widest text-green hover:underline"
                  >
                    {t("sendAnotherMessage")}
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
