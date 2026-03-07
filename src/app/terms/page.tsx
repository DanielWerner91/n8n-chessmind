import { TermlyEmbed } from "@/components/termly-embed";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <TermlyEmbed />
    </div>
  );
}
