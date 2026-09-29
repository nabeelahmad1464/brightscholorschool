import React from 'react';
import {
  GraduationCap,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  ShieldCheck,
  HeartHandshake
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

export const Footer: React.FC = () => {
  const { openWhatsApp } = useSchool();

  return (
    <footer className="bg-[#07193B] text-slate-300 pt-12 pb-8 border-t-4 border-amber-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: About School */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white p-0.5 border-2 border-amber-400 overflow-hidden flex-shrink-0">
                <img
                  src="/school_logo.jpg"
                  alt="Bright Scholar School Logo"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="text-white font-bold text-base font-serif-crest">
                  BRIGHT SCHOLAR SCHOOL
                </h3>
                <p className="text-amber-400 text-xs font-semibold">
                  “Pehle Tarbiyat, Phir Taleem”
                </p>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Committed to providing exemplary education alongside character building, moral ethics, and Islamic tarbiyat. Providing quality modern schooling from Play Group to Class 8 / Middle in Chak No. 47 GB, Samundri.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300 bg-white/5 p-2 rounded-lg border border-amber-400/20">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Registered & Verified Educational Institution</span>
            </div>
          </div>

          {/* Col 2: School Core Values */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              Our Core Pillars
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Islamic Tarbiyat:</strong> Daily Nazra Quran, Akhlaqiat, and Sunnah manners.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Strict Punctuality:</strong> Daily attendance tracking with absent fine regulation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Parent Transparency:</strong> Real-time parent portal for fee, marks, and attendance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Qualified Faculty:</strong> Experienced teachers with personalized student attention.</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Fee & Timings */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              School Hours & Fee Tiers
            </h4>
            <div className="space-y-3 text-xs">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <div className="text-amber-300 font-semibold mb-1">Fee Structure:</div>
                <div className="flex justify-between text-slate-300 py-0.5">
                  <span>Play Group to Class 4:</span>
                  <span className="font-bold text-white">Rs. 2,000 / mo</span>
                </div>
                <div className="flex justify-between text-slate-300 py-0.5">
                  <span>Class 5 to Class 8 / Middle:</span>
                  <span className="font-bold text-white">Rs. 3,000 / mo</span>
                </div>
                <div className="text-[11px] text-red-300 mt-1">
                  * Absence fine: Rs. 30 per unapproved leave
                </div>
              </div>

              <div>
                <div className="text-slate-400 mb-1">Academic Timings:</div>
                <div className="text-slate-200">Monday - Thursday & Saturday: 7:45 AM - 1:30 PM</div>
                <div className="text-slate-200">Friday: 7:45 AM - 12:00 PM (Half Day)</div>
              </div>
            </div>
          </div>

          {/* Col 4: Contact & Location */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Campus Location & Contact
            </h4>
            <div className="space-y-3 text-xs">
              <p className="flex items-start gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>Chak No. 47 GB, Samundri, District Faisalabad, Punjab, Pakistan</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a href="tel:03025053993" className="hover:text-amber-300 font-semibold">0302-5053993</a>
              </p>
              <div className="pt-2">
                <button
                  onClick={() => openWhatsApp()}
                  className="w-full bg-[#25D366] hover:bg-[#20b858] text-white py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Chat on WhatsApp (0302-5053993)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 mt-8 border-t border-white/10 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Bright Scholar School, Chak No. 47 GB, Samundri. All rights reserved.</p>
          <p className="text-amber-400 font-medium">“Pehle Tarbiyat, Phir Taleem”</p>
        </div>
      </div>
    </footer>
  );
};
