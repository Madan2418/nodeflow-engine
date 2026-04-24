import Head from "next/head";
import { useState, useCallback } from "react";
import InputPanel from "../components/InputPanel";
import LiveValidator from "../components/LiveValidator";
import ResponseView from "../components/ResponseView";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  const [loading, setLoading]   = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError]       = useState(null);
  const [elapsed, setElapsed]   = useState(null);
  const [rawInput, setRawInput] = useState("");  // updated on every keystroke
  const [submittedEdges, setSubmittedEdges] = useState([]);

  const handleSubmit = useCallback(async (items, raw) => {
    setRawInput(raw);
    setSubmittedEdges(items);
    setLoading(true);
    setError(null);
    setResponse(null);
    setElapsed(null);

    const t0 = performance.now();
    try {
      const res = await fetch(`${API_URL}/bfhl`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ data: items }),
      });

      const ms = Math.round(performance.now() - t0);
      setElapsed(ms);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setElapsed(Math.round(performance.now() - t0));
      setError(err.message || "Network error — is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <Head>
        <title>NodeFlow — BFHL Hierarchy Analyser</title>
        <meta name="description" content="Analyse hierarchical node relationships. Parse edges, detect cycles, visualise trees." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌐</text></svg>" />
      </Head>

      <main className="page">
        {/* ── Header ── */}
        <header className="header animate-fadeInUp">
          <h1>
            Node <span>Hierarchy</span> Analyser
          </h1>
          <p>
            Enter node edges, detect cycles, visualise trees — all in real time.
          </p>
        </header>

        {/* ── Input Card ── */}
        <section className="card animate-fadeInUp stagger-1" aria-label="Input section">
          <div className="card-title">
            <span className="dot" />
            Input Edges
          </div>
          <InputPanel
            onChange={setRawInput}
            onSubmit={(items, raw) => handleSubmit(items, raw)}
            loading={loading}
          />
        </section>

        {/* ── Live Validator Card ── */}
        {rawInput.trim() && (
          <section className="card animate-fadeInUp stagger-2" aria-label="Live validation">
            <div className="card-title">
              <span className="dot" style={{ background: "var(--green)" }} />
              Live Preview
            </div>
            <LiveValidator raw={rawInput} />
          </section>
        )}

        {/* ── Results Card ── */}
        {(response || error) && (
          <section className="card animate-fadeInUp stagger-3" aria-label="Results">
            <div className="card-title">
              <span className="dot" style={{ background: error ? "var(--red)" : "var(--blue)" }} />
              {error ? "Error" : "Results"}
            </div>
            <ResponseView data={response} elapsed={elapsed} error={error} allEdges={submittedEdges} />
          </section>
        )}
      </main>
    </>
  );
}
