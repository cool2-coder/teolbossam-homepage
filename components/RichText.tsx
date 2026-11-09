/**
 * Shows text the teacher pasted (often from Claude) the way it was written:
 * keeps line breaks and emoji, turns "# 제목" lines into headings,
 * "⸻" / "———" lines into dividers and **굵게** into bold. No HTML is interpreted.
 */
export default function RichText({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: React.ReactNode[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push(<p key={out.length}>{bold(para.join("\n"))}</p>);
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush();
      out.push(h[1].length <= 1 ? <h3 key={out.length}>{bold(h[2])}</h3> : <h4 key={out.length}>{bold(h[2])}</h4>);
    } else if (/^\s*(⸻+|[—–-]{3,}|_{3,})\s*$/.test(line)) {
      flush();
      out.push(<hr key={out.length} />);
    } else if (!line.trim()) {
      flush();
    } else {
      para.push(line);
    }
  }
  flush();
  return <div className={`rich ${className}`}>{out}</div>;
}

function bold(s: string): React.ReactNode {
  const parts = s.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => (i % 2 ? <strong key={i}>{p}</strong> : p));
}
