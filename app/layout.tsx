import "./globals.css";

export const metadata = {
  title: "Carbon Accounting Pro",
  description: "Carbon assessment tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
