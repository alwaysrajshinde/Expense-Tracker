import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const POSITIVE_QUOTES = [
  'Consistency builds financial freedom. Keep going!',
  'Small daily discipline creates massive future freedom.',
  'Every rupee saved is a step closer to your dreams.',
  'Mindful spending turns your hard work into lasting wealth.',
  'Take control of your money today. Make it work for you!'
];

export default function WelcomeGreetingOverlay({ userName = 'Raj', onDismiss }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  // Time-based greeting in active language
  const hour = new Date().getHours();
  let greetingKey = 'goodEvening';
  let defaultGreeting = 'Good Evening';
  if (hour < 12) {
    greetingKey = 'goodMorning';
    defaultGreeting = 'Good Morning';
  } else if (hour < 17) {
    greetingKey = 'goodAfternoon';
    defaultGreeting = 'Good Afternoon';
  }

  const timeGreeting = t(greetingKey, defaultGreeting);

  // Format clean first name
  const cleanName = (userName || 'Friend').trim().split(' ')[0].split('@')[0];
  const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  // Pick a fresh rotating positive quote on every appearance
  const [quoteIndex] = useState(() => {
    try {
      const prev = parseInt(localStorage.getItem('et_welcome_quote_idx') || '0', 10);
      const next = (prev + 1) % 6;
      localStorage.setItem('et_welcome_quote_idx', String(next));
      return next;
    } catch (e) {
      return Math.floor(Math.random() * 6);
    }
  });

  const quoteKey = `positiveQuote_${quoteIndex}`;
  const quote = t(quoteKey, t('positiveQuote', POSITIVE_QUOTES[quoteIndex] || POSITIVE_QUOTES[0]));

  useEffect(() => {
    // Smooth entrance
    const showTimer = setTimeout(() => setVisible(true), 150);

    // Auto dismiss after 3.8s
    const dismissTimer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 600);
    }, 3800);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const handleManualDismiss = () => {
    setFadingOut(true);
    setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 400);
  };

  return (
    <div
      onClick={handleManualDismiss}
      className={`fixed inset-0 z-[10000] flex items-center justify-center select-none cursor-pointer px-4 transition-all duration-500 ${
        visible && !fadingOut
          ? 'bg-black/70 backdrop-blur-md opacity-100'
          : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`relative max-w-sm w-full text-center flex flex-col items-center justify-center p-6 transition-all duration-700 ease-out transform ${
          visible && !fadingOut
            ? 'scale-100 translate-y-0 opacity-100'
            : 'scale-95 translate-y-2 opacity-0'
        }`}
      >
        {/* Top Glowing Emblem with horizontal light beams */}
        <div className="flex items-center justify-center w-full mb-3 relative">
          {/* Left light beam */}
          <div className="h-[1.5px] w-24 sm:w-28 bg-gradient-to-r from-transparent via-[#C084FC]/70 to-[#E879F9] shadow-[0_0_8px_#C084FC]" />

          {/* Lotus / Flower Emblem */}
          <div className="mx-3 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[#A855F7] blur-md opacity-80 rounded-full" />
            <svg
              viewBox="0 0 32 32"
              className="w-7 h-7 text-white fill-current relative z-10 drop-shadow-[0_0_12px_rgba(232,121,249,0.9)]"
            >
              {/* Stylized Lotus Emblem matching user design */}
              <path d="M16 4 C17 10 22 13 22 17 C22 21 19 24 16 26 C13 24 10 21 10 17 C10 13 15 10 16 4 Z" opacity="0.95" />
              <path d="M16 26 C20 24 26 21 27 15 C28 10 24 8 20 10 C18 12 17 15 16 19 C15 15 14 12 12 10 C8 8 4 10 5 15 C6 21 12 24 16 26 Z" opacity="0.75" />
            </svg>
          </div>

          {/* Right light beam */}
          <div className="h-[1.5px] w-24 sm:w-28 bg-gradient-to-l from-transparent via-[#C084FC]/70 to-[#E879F9] shadow-[0_0_8px_#C084FC]" />
        </div>

        {/* Main Headline: Localized Greeting + Name */}
        <h2 className="text-[28px] sm:text-[34px] font-serif tracking-tight text-white mb-2.5 drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]">
          <span className="italic font-serif bg-gradient-to-r from-[#A78BFA] via-[#C084FC] to-[#F472B6] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]">
            {timeGreeting}
          </span>
          <span className="font-normal">, {capitalizedName}</span>
        </h2>

        {/* Positive Motivation Message */}
        <div className="relative px-4 py-1">
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 text-xs text-[#C084FC] opacity-75">✦</span>
          <p className="text-sm sm:text-base text-slate-100/95 font-medium tracking-wide leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
            {quote}
          </p>
          <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-xs text-[#E879F9] opacity-75">✧</span>
        </div>

        {/* Bottom Glowing Curved Flourish / Light Wave */}
        <div className="w-full flex justify-center mt-3 mb-1">
          <svg viewBox="0 0 280 20" className="w-60 sm:w-72 overflow-visible">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0" />
                <stop offset="25%" stopColor="#A78BFA" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#E879F9" stopOpacity="1" />
                <stop offset="75%" stopColor="#A78BFA" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
              <filter id="waveGlow" x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 10,10 Q 75,3 140,10 T 270,10"
              fill="transparent"
              stroke="url(#waveGradient)"
              strokeWidth="2.5"
              filter="url(#waveGlow)"
            />
          </svg>
        </div>

        {/* Subtle tap-to-dismiss hint */}
        <span className="text-[10px] uppercase tracking-widest text-slate-400/50 mt-3 font-semibold">
          {t('tapToContinue', 'Tap anywhere to continue')}
        </span>
      </div>
    </div>
  );
}
