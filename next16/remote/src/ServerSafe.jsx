// No hooks, no "use client" — safe to render inside a React Server Component.
export default function ServerSafe({ who = "world" }) {
  return (
    <div data-testid="server-safe" style={{ border: "1px solid teal", padding: 8 }}>
      Hello {who} — rendered by the <b>remote</b> (no state). Rendered at {new Date().toISOString()}
    </div>
  );
}
