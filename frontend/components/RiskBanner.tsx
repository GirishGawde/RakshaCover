import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import type { RiskLabel, RiskFlags } from "@/lib/types";

interface RiskBannerProps {
  label: RiskLabel;
  recommendation: string;
  flags?: RiskFlags;
}

export function RiskBanner({ label, recommendation, flags }: RiskBannerProps) {
  const config = {
    SAFE: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
      title: "Safe",
    },
    SUSPICIOUS: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      title: "Suspicious",
    },
    SEVERE_THREAT: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: <ShieldAlert className="w-6 h-6 text-red-600" />,
      title: "Severe Threat",
    },
  }[label];

  return (
    <div className={`mt-6 p-4 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <h3 className={`font-semibold ${config.text}`}>{config.title}</h3>
          <p className="mt-1 text-sm text-gray-700">{recommendation}</p>
          
          {flags && (
            <div className="mt-4 flex flex-wrap gap-2">
              {flags.levenshteinLookalike && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  Lookalike Domain Detected
                </span>
              )}
              {flags.domainAgeDays !== undefined && flags.domainAgeDays !== null && flags.domainAgeDays < 30 && (
                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  Newly Registered Domain
                </span>
              )}
              {flags.sslValid === false && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  Invalid SSL Certificate
                </span>
              )}
              {flags.phishTankHit && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  Known Phishing URL
                </span>
              )}
              {flags.vpaInReportsTable && (
                <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  VPA in Fraud Reports
                </span>
              )}
              {flags.linkedClusters !== undefined && flags.linkedClusters > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  Linked to {flags.linkedClusters} Fraud Cluster(s)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
