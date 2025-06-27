import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Chat Data - Provana KMS",
  description: "Export chat sessions as Excel files for analysis",
};

export default function DownloadDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
