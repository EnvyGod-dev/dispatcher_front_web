import React from 'react';

interface PrivacyPolicySectionProps {
  number: string;
  title: string;
  content: string;
  items?: string[];
}

export function PrivacyPolicySection({
  number,
  title,
  content,
  items,
}: PrivacyPolicySectionProps) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded border-2 border-amber-500/30 bg-slate-900/50 flex items-center justify-center">
            <span className="text-lg font-bold text-amber-500">{number}</span>
          </div>
        </div>

        <div className="flex-1 pt-1">
          <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>

          <p className="text-slate-300 leading-relaxed">{content}</p>

          {items && items.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {items.map((item, index) => (
                <li key={index} className="flex items-start gap-3 group">
                  <div className="flex-shrink-0 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                  <span className="text-slate-300 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
