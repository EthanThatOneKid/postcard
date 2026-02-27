'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold gradient-text mb-4">Postcard</h1>
        <p className="text-gray-400 text-lg italic">"Digital Pathologist: Resolving URLs, Verifying Postmarks."</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="glass-card p-8 flex flex-col items-center justify-center border-dashed border-2">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-4 text-sm"
          />
          <button 
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            {loading ? 'Analyzing Postmark...' : 'Upload Postcard'}
          </button>
        </div>

        {/* Scoring Section */}
        {report && (
          <div className="glass-card p-8 bg-opacity-20 flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold mb-4">Postmark Score</h2>
            <div className="text-6xl font-black mb-2" style={{ color: report.audit.totalScore > 0.9 ? '#10b981' : report.audit.totalScore > 0.5 ? '#f59e0b' : '#ef4444' }}>
              {(report.audit.totalScore * 100).toFixed(0)}%
            </div>
            <p className="text-sm text-gray-400 text-center">
              {report.audit.totalScore > 0.9 ? 'Verified Origin (No Cap)' : report.audit.totalScore > 0.5 ? 'Unreliable Postmark (Modified)' : 'Fabricated Postcard (High Anomaly)'}
            </p>
          </div>
        )}
      </div>

      {/* Travel Log / Audit Section */}
      {report && (
        <div className="mt-12 glass-card p-8">
          <h2 className="text-2xl font-bold mb-6">Travel Log (Audit)</h2>
          <div className="space-y-4">
            {report.audit.auditLog.map((log: string, i: number) => (
              <div key={i} className="flex items-start gap-4 text-sm border-l-2 border-indigo-500 pl-4 py-1">
                <span className="text-gray-500 min-w-[80px]">Step {i+1}</span>
                <p>{log}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <h3 className="font-bold mb-2">Resolved URL:</h3>
            <a href={report.triangulation.targetUrl} target="_blank" className="text-indigo-400 underline break-all">
              {report.triangulation.targetUrl || 'None identified'}
            </a>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <h3 className="font-bold mb-2">OCR Extraction (Interleaved):</h3>
            <pre className="text-xs bg-black p-4 rounded overflow-x-auto text-gray-300">
              {report.ocr.markdown}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
