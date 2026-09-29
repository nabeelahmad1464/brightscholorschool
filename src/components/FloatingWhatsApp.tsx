import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

export const FloatingWhatsApp: React.FC = () => {
  const { openWhatsApp, settings } = useSchool();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 group">
      {/* Speech bubble label */}
      <div className="bg-[#07193B] text-white text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-amber-400/40 hidden sm:flex items-center gap-1.5 transform transition-all group-hover:scale-105">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="font-semibold text-amber-300">Need Info?</span>
        <span className="text-slate-200">Chat with Principal / Office</span>
      </div>

      <button
        onClick={() => openWhatsApp(settings.schoolWhatsApp, 'Assalam-o-Alaikum! Mujhe Bright Scholar School ke baare me maloomat chahiye.')}
        className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-white"
        aria-label="Chat on WhatsApp 0302-5053993"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="font-bold text-sm hidden md:inline-block">
          WhatsApp 0302-5053993
        </span>
      </button>
    </div>
  );
};
