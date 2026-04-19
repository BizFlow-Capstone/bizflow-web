import { Lora } from "next/font/google";

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  variable: "--font-lora",
  display: "swap",
});

export default function PolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${lora.variable} font-(family-name:--font-lora)`}>
      {children}
    </div>
  );
}
