import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { formatDate } from '@/lib/time-formatter';

export function PrivacyPolicyContact() {
  return (
    <div className="mt-12">
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-6 bg-amber-500 rounded-full" />
          <h3 className="text-xl font-semibold text-white">Холбоо барих</h3>
        </div>

        <p className="text-slate-300 leading-relaxed mb-6">
          Хэрэглэгчид бидэнтэй холбоо барьж нууцлалын бодлого, мэдээллийн
          хамгаалалттай холбоотой асуулт, санал хүсэлт гаргах боломжтой. Бидэнд
          хандах хүсэлт байвал цахим хаягаар бидэнтэй холбогдохыг урьж байна.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="mailto:info@stratum.mn"
            className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-900/70 rounded-lg transition-all group"
          >
            <div className="p-2 bg-slate-800 rounded border border-slate-700 group-hover:border-amber-500/30 transition-colors">
              <Mail className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-slate-300 group-hover:text-white transition-colors text-sm">
              info@stratum.mn
            </span>
          </a>

          <a
            href="tel:+97699138464"
            className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-900/70 rounded-lg transition-all group"
          >
            <div className="p-2 bg-slate-800 rounded border border-slate-700 group-hover:border-amber-500/30 transition-colors">
              <Phone className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-slate-300 group-hover:text-white transition-colors text-sm">
              +976 9913-8464
            </span>
          </a>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <p className="text-sm text-slate-500">
            Сүүлд шинэчлэгдсэн:{' '}
            {/* {new Date().toLocaleDateString('mn-MN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })} */}
            {formatDate(new Date('2025-11-26'))}
          </p>
        </div>
      </div>
    </div>
  );
}
