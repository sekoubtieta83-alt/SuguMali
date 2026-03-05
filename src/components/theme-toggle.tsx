"use client";
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  // 1. Charger la préférence au démarrage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : isSystemDark;

    setDarkMode(initialDarkMode);
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // 2. Fonction pour changer et sauvegarder le thème
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  return (
    <button 
      onClick={toggleDarkMode}
      className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-all hover:scale-110 active:scale-95"
      aria-label="Changer de thème"
    >
      {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
