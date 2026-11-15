export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", padding: 24 }}>
        <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <a href="/rsc">/rsc</a>
          <a href="/client">/client</a>
          <a href="/broken">/broken</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
