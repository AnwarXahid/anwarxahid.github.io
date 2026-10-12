import React, { useState, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QRCodeGeneratorProps {
  /** Optional initial value for the QR code */
  initialValue?: string;
  /** Optional default size in pixels (default: 256) */
  defaultSize?: number;
  /** Optional container class name for custom styling */
  className?: string;
}

const PRESET_URLS = [
  { label: 'Website', value: 'https://github.com' },
  { label: 'WiFi', value: 'WIFI:S:MyHomeWiFi;T:WPA;P:SuperSecret123;;' },
  { label: 'Email', value: 'mailto:contact@example.com?subject=Hello' },
  { label: 'Phone', value: 'tel:+1234567890' },
];

const COLOR_PRESETS = [
  { name: 'Classic Black', fg: '#000000', bg: '#ffffff' },
  { name: 'Indigo Modern', fg: '#4338ca', bg: '#eef2ff' },
  { name: 'Emerald Forest', fg: '#065f46', bg: '#ecfdf5' },
  { name: 'Slate Minimal', fg: '#1e293b', bg: '#f8fafc' },
  { name: 'Crimson Tech', fg: '#991b1b', bg: '#fef2f2' },
];

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  initialValue = 'https://astro.build',
  defaultSize = 256,
  className = '',
}) => {
  // Client-side state
  const [text, setText] = useState<string>(initialValue);
  const [size, setSize] = useState<number>(defaultSize);
  const [level, setLevel] = useState<ErrorCorrectionLevel>('H');
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [includeMargin, setIncludeMargin] = useState<boolean>(true);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success'>('idle');
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);

  // Direct ref to the underlying HTMLCanvasElement
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger file download using client-side canvas data
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const pngUrl = canvas.toDataURL('image/png');
      const sanitizedName = text
        .trim()
        .replace(/^[a-z]+:\/\//i, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 24) || 'qr-code';

      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${sanitizedName}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 2200);
    } catch (err) {
      console.error('Failed to download QR code canvas:', err);
    }
  }, [text]);

  // Optional: Copy text to clipboard
  const handleCopyText = useCallback(async () => {
    if (!text) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedStatus(true);
        setTimeout(() => setCopiedStatus(false), 2000);
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  }, [text]);

  return (
    <div
      className={`w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 transition-colors ${className}`}
    >
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 rounded-full border border-indigo-200 dark:border-indigo-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          100% Client-Side · Private & Free
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Instant QR Code Generator
        </h2>
        <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Generate custom, high-resolution QR codes right in your browser with zero server roundtrips.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Input text / URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="qr-content"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                URL or Content
              </label>
              <div className="flex items-center gap-2">
                {text && (
                  <button
                    type="button"
                    onClick={() => setText('')}
                    className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
                <span className="text-xs text-slate-400">
                  {text.length} chars
                </span>
              </div>
            </div>

            <div className="relative">
              <textarea
                id="qr-content"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="https://yourwebsite.com or any text..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm resize-none shadow-sm"
              />
            </div>

            {/* Presets */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">
                Presets:
              </span>
              {PRESET_URLS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setText(preset.value)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customization Options */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Styling & Settings
            </h3>

            {/* Color Palette Presets */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Color Themes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_PRESETS.map((preset) => {
                  const isActive = fgColor === preset.fg && bgColor === preset.bg;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setFgColor(preset.fg);
                        setBgColor(preset.bg);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                        isActive
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex -space-x-1 shrink-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: preset.fg }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: preset.bg }}
                        />
                      </div>
                      <span className="truncate">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Foreground (Modules)
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Background
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Size Slider & Error Correction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              {/* Size */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Size: <span className="font-semibold text-slate-900 dark:text-white">{size}px</span>
                  </label>
                </div>
                <input
                  type="range"
                  min={160}
                  max={400}
                  step={16}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>160px</span>
                  <span>256px</span>
                  <span>400px</span>
                </div>
              </div>

              {/* Error Correction Level */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Error Correction Level
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['L', 'M', 'Q', 'H'] as ErrorCorrectionLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        level === lvl
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={
                        lvl === 'L'
                          ? 'Low (~7% recovery)'
                          : lvl === 'M'
                          ? 'Medium (~15% recovery)'
                          : lvl === 'Q'
                          ? 'Quartile (~25% recovery)'
                          : 'High (~30% recovery, recommended for complex codes)'
                      }
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {level === 'H' ? 'High (~30% recovery)' : level === 'Q' ? 'Quartile (~25%)' : level === 'M' ? 'Medium (~15%)' : 'Low (~7%)'}
                </p>
              </div>
            </div>

            {/* Margin toggle */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Quiet Zone Margin
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Adds spacing around the code for faster scanning
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMargin}
                  onChange={(e) => setIncludeMargin(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Preview & Actions */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-4">
              Real-time Preview
            </span>

            {/* QR Canvas Display */}
            <div
              className="p-4 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800 transition-all flex items-center justify-center max-w-full overflow-hidden"
              style={{ backgroundColor: bgColor }}
            >
              {text.trim() ? (
                <QRCodeCanvas
                  ref={canvasRef}
                  value={text}
                  size={size}
                  level={level}
                  bgColor={bgColor}
                  fgColor={fgColor}
                  marginSize={includeMargin ? 2 : 0}
                  className="max-w-full h-auto"
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-400 dark:text-slate-500"
                  style={{ width: size, height: size }}
                >
                  <svg
                    className="w-12 h-12 mb-2 stroke-current opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 6.75h.008v.008H6.75V6.75ZM6.75 16.5h.008v.008H6.75V16.5ZM16.5 6.75h.008v.008H16.5V6.75ZM13.5 13.5h3.75v3.75H13.5z"
                    />
                  </svg>
                  <span className="text-xs font-medium">Enter text above to preview QR</span>
                </div>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="w-full mt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!text.trim()}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all ${
                  text.trim()
                    ? downloadStatus === 'success'
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-indigo-500/25'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed shadow-none'
                }`}
              >
                {downloadStatus === 'success' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Downloaded PNG!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>Download PNG</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                disabled={!text.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copiedStatus ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied text to clipboard!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Copy Content String</span>
                  </>
                )}
              </button>
            </div>

            {/* Spec details badge */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 w-full flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Dimension: {size} × {size} px</span>
              <span>Level: {level}</span>
              <span>PNG 32-bit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
