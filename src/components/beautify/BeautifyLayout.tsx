import React, { useState, useMemo } from 'react';
import { detectType, suggestModeFromDetection } from '../../lib/beautify/beautify.ts';
import { BracketFormatterService } from '../../services/BracketFormatterService.ts';
import type { Detected } from '../../types/beautify.ts';


// Main formatter pipeline
function formatGeneric(input: string, force?: Detected): { output: string; detected: Detected; stage: string } {
  const chosen = force ?? detectType(input);

  // 1) Strict JSON
  if (chosen === "json") {
    try {
      const obj = JSON.parse(input);
      return { output: JSON.stringify(obj, null, 2), detected: chosen, stage: "strict-json" };
    } catch {
      // Fall through to bracket formatter
    }
  }

  // 2) For all other cases, use our bracket formatter (preserves original data)
  return { output: BracketFormatterService.format(input), detected: chosen, stage: "brackets" };
}

export default function BeautifyLayout() {
  const [input, setInput] = useState(`Paste anything here…

Examples:

// JSON with single quotes
{ 'a': 1, 'b': [1,2,3,], // trailing comma ok
  'user': { 'name': 'Alice', 'active': true, 'email': null } }

# Python repr
{'users': [{'id': 1, 'name': 'Alice'}, {'id': 2, 'name': 'Bob'}], 'ok': True}

// PHP var_export
array ( 'foo' => 'bar', 0 => 10, 'nested' => array( 'x' => 1, 'y' => 2 ), )

// PHP var_dump-ish
array(2) {
  ["id"]=>
  int(42)
  ["tags"]=>
  array(3) { [0]=> string(3) "one" [1]=> string(3) "two" [2]=> string(5) "three" }
}`);

  const [forced, setForced] = useState<Detected | "auto">("auto");
  const [output, setOutput] = useState("");
  const [detected, setDetected] = useState<Detected>("unknown");
  const [stage, setStage] = useState("-");

  const handleFormat = () => {
    const { output, detected, stage } = formatGeneric(input, forced === "auto" ? undefined : forced);
    setOutput(output);
    setDetected(detected);
    setStage(stage);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output || "");
    } catch { }
  };

  const badgeClass = useMemo(() => {
    const badges: Record<Detected, string> = {
      json: "bg-emerald-100 text-emerald-700",
      jsonish: "bg-emerald-100 text-emerald-700",
      pythonRepr: "bg-indigo-100 text-indigo-700",
      phpArray: "bg-amber-100 text-amber-700",
      phpVarDump: "bg-amber-100 text-amber-700",
      unknown: "bg-slate-100 text-slate-700",
    };
    return badges[detected];
  }, [detected]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Generic Code Beautifier</h1>
          <p className="text-sm text-slate-600">
            Paste JSON/JSON5/HJSON, Python <code>repr</code>, PHP <code>array/print_r/var_export</code>, or even messy
            <code> var_dump</code>. We'll try to normalize & pretty-print. For unknown text, we fall back to a smart
            bracket-based formatter.
          </p>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium w-20">Mode</label>
                <select
                  className="w-full border border-slate-300 rounded-md p-2 bg-white"
                  value={forced}
                  onChange={(e) => setForced(e.target.value as any)}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="json">Force: JSON</option>
                  <option value="jsonish">Force: JSON-ish</option>
                  <option value="pythonRepr">Force: Python repr</option>
                  <option value="phpArray">Force: PHP array</option>
                  <option value="phpVarDump">Force: PHP var_dump</option>
                  <option value="unknown">Force: Unknown (brackets)</option>
                </select>
              </div>

              <textarea
                className="h-[360px] w-full font-mono text-sm border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />

              <div className="flex gap-2">
                <button 
                  onClick={handleFormat} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
                  </svg>
                  Beautify
                </button>
                <button 
                  onClick={() => { setInput(""); setOutput(""); setDetected("unknown"); setStage("-"); }} 
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-md transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>{detected}</span>
              <span className="text-xs text-slate-500">stage: {stage}</span>
            </div>
            <button 
              onClick={handleCopy} 
              className="px-3 py-1 text-sm border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy output
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-6">{output}</pre>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-4 space-y-2 text-sm text-slate-600">
              <div className="font-medium">Notes & Limitations</div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Python converter handles dicts/lists/tuples, basic scalars. Sets & complex objects are not fully supported.</li>
                <li>PHP support targets <code>array(...)</code>, short arrays <code>[...]</code>, and <code>print_r/var_export</code> styles. <code>var_dump</code> is best-effort.</li>
                <li>Unknown structures fall back to bracket-based indentation that respects strings and escapes.</li>
                <li>No evaluation of code is performed; everything is string-to-string transforms.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
