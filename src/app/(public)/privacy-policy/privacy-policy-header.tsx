import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function PrivacyPolicyHeader() {
  return (
    <div className="relative">
      <div className="absolute top-0 left-0 w-24 h-1 bg-gradient-to-r from-amber-500 to-amber-600" />

      <div className="pt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-amber-500" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Нууцлалын Бодлого
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Уурхайн ээлжийн ажлын нэгдсэн удирдлагын систем
            </p>
          </div>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
          <p className="text-slate-300 leading-relaxed">
            Stratum.mn сайт нь уул уурхайн компаниудтай хамтран тэдгээрийн
            техник, технологийн ажлын бүртгэлийг хөтлөх, тайлан гаргах платформ
            бөгөөд хэрэглэгчдийн нууцлал, мэдээллийн аюулгүй байдлыг бүх цаг үед
            хангахыг зорьж байна.
          </p>
        </div>
      </div>
    </div>
  );
}
