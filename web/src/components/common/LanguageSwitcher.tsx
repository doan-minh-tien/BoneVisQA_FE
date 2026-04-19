'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium opacity-50">
        <Globe className="w-4 h-4" />
        <span>EN</span>
      </button>
    );
  }

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('vi') ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors shadow-sm"
      title={i18n.language.startsWith('vi') ? 'Switch to English' : 'Switch to Vietnamese'}
    >
      <Globe className="w-4 h-4 text-primary" />
      <span>{i18n.language.startsWith('vi') ? 'VI' : 'EN'}</span>
    </button>
  );
}
