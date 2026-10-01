import React, { useState } from 'react';
import {
  RefreshCw,
  Download,
  Upload,
  Copy,
  Check,
  Share2,
  FileJson,
  Smartphone,
  AlertCircle,
  X,
  Database
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({ isOpen, onClose }) => {
  const { exportAllSchoolData, importSchoolData, students, teachers, openWhatsApp } = useSchool();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('import');
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyExport = () => {
    const data = exportAllSchoolData();
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadFile = () => {
    const data = exportAllSchoolData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BSS_School_Data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    const data = exportAllSchoolData();
    const shortSummary = `*Bright Scholar School Data Backup*\nطلباء کی کل تعداد: ${students.length}\nاساتذہ: ${teachers.length}\nتاریخ: ${new Date().toLocaleDateString('ur-PK')}\n\nنوٹ: نیچے دیا گیا ڈیٹا کاپی کر کے 'Import Data' میں پیسٹ کریں۔\n\n${data}`;
    openWhatsApp(undefined, shortSummary);
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) {
      setStatusMessage({ type: 'error', text: 'براہ کرم پہلے دوسرے موبائل کا بیک اپ کوڈ یہاں پیسٹ کریں۔' });
      return;
    }

    const res = importSchoolData(importText.trim());
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        onClose();
      }, 1800);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        const res = importSchoolData(content);
        if (res.success) {
          setStatusMessage({ type: 'success', text: res.message });
          setTimeout(() => {
            onClose();
          }, 1800);
        } else {
          setStatusMessage({ type: 'error', text: res.message });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                دوسرے موبائل کا ڈیٹا حاصل کریں (Data Sync)
              </h3>
              <p className="text-xs text-slate-500">
                ایک موبائل سے دوسرے موبائل پر طلباء اور اسکول کا تمام ڈیٹا ٹرانسفر کریں
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Why this happened explanation banner */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
          <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <strong className="block font-bold">طلباء دوسرے موبائل پر کیوں شو ہو رہے ہیں؟</strong>
            <p className="text-blue-800 leading-relaxed">
              کیونکہ ڈیٹا فی الحال اس موبائل کے اندر محفوظ ہے جہاں اندراج کیا گیا تھا۔ اس ڈیٹا کو اپنے موبائل پر لانے کے لیے نیچے دیا گیا <strong>صرف 1 منٹ کا آسان طریقہ</strong> استعمال کریں:
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'import'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>1: اپنے موبائل میں شامل کریں (Import)</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'export'
                ? 'bg-[#0D285F] text-amber-300 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>2: دوسرے موبائل سے کاپی کریں (Export)</span>
          </button>
        </div>

        {/* Tab 1: IMPORT TO THIS DEVICE */}
        {activeTab === 'import' && (
          <div className="space-y-4 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-2">
              <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <span>دوسرے موبائل سے لایا گیا ڈیٹا یہاں درج کریں</span>
              </h4>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                جس موبائل پر طالب علم ایڈ کیے گئے ہیں، وہاں سے کوڈ کاپی کر کے نیچے والے خانے میں پیسٹ کریں، یا فائل اپلوڈ کریں:
              </p>

              <textarea
                rows={5}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="دوسرے موبائل سے کاپی کیا گیا کوڈ یہاں پیسٹ کریں (Paste Sync Code here)..."
                className="w-full px-3 py-2 text-xs font-mono border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <label className="cursor-pointer bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-xs flex items-center gap-1.5 shadow-sm">
                  <FileJson className="w-4 h-4 text-amber-600" />
                  <span>فائل منتخب کریں (Select File)</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleImportSubmit}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow active:scale-95 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>ڈیٹا شامل کریں اور طلباء شو کریں</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: EXPORT FROM THAT OTHER DEVICE */}
        {activeTab === 'export' && (
          <div className="space-y-4 text-xs">
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-2.5">
              <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                <span>یہ بٹن اس موبائل پر دبائیں جس پر طلباء ایڈ کیے ہیں</span>
              </h4>
              <p className="text-amber-800 text-[11px]">
                اس وقت اس موبائل میں کل <strong>{students.length} طلباء</strong> اور <strong>{teachers.length} اساتذہ</strong> کا ریکارڈ موجود ہے۔ آپ نیچے دیے گئے کسی بھی طریقے سے یہ ڈیٹا شیئر کر سکتے ہیں:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {/* WhatsApp Share */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="bg-[#25D366] hover:bg-[#20b858] text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>واٹس ایپ پر بھیجیں</span>
                </button>

                {/* Copy to Clipboard */}
                <button
                  type="button"
                  onClick={handleCopyExport}
                  className="bg-[#0D285F] hover:bg-[#07193B] text-amber-300 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'کاپی ہو گیا!' : 'کوڈ کاپی کریں'}</span>
                </button>

                {/* Download File */}
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>فائل ڈاؤنلوڈ کریں</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-red-100 text-red-900 border border-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Footer info about automatic cloud database */}
        <div className="pt-3 border-t flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-600" />
            <span>مستقل آن لائن کلاؤڈ ڈیٹا بیس (Real-time Cloud Sync)</span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-1.5 rounded-lg text-xs"
          >
            بند کریں (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
