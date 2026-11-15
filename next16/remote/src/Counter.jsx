import { useState } from "react";

// Uses hooks: must run in the SSR + browser React, never in the RSC (react-server) React.
export default function Counter({ start = 0 }) {
  const [n, setN] = useState(start);
  return (
    <div data-testid="counter" style={{ border: "1px solid orange", padding: 8 }}>
      Remote counter: <span data-testid="count">{n}</span>{" "}
      <button onClick={() => setN(n + 1)}>increment</button>
    </div>
  );
}
