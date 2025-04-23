import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, action: "comment" }),
      });
      const data = await response.json();
      setResult(data.result || "Žádná odpověď");
    } catch (error) {
      setResult("Došlo k chybě při komunikaci se serverem.");
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h1>Joplan AI – hygiena</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={6}
          style={{ width: "100%", marginBottom: 10 }}
          placeholder="Vlož text popisu podpory…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Načítání..." : "Získat komentář"}
        </button>
      </form>
      <div style={{ marginTop: 30 }}>
        {loading ? (
          <div style={{ fontSize: "16px" }}>Moment, přemýšlím…</div>
        ) : (
          <ReactMarkdown>{result}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}
