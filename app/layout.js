export const metadata = {
  title: 'Shared Weekly Planner',
  description: 'A shared editable weekly planner'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
