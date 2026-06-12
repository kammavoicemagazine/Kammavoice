import { Metadata } from "next";
import { notFound } from "next/navigation";
import MagazineReaderClient from "./MagazineReaderClient";
import { getMagazineByIdSSR, getMagazineBySlugSSR } from "@/lib/firestore";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

// Generate SEO Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let magazine = await getMagazineBySlugSSR(id);
  if (!magazine) {
    magazine = await getMagazineByIdSSR(id);
  }

  if (!magazine) {
    return {
      title: "Magazine Not Found | Kamma Voice",
    };
  }

  const title = `${magazine.title} | Kamma Voice Magazine`;
  const description = `Read the ${magazine.category || "latest"} edition of Kamma Voice Magazine. Volume: ${magazine.volume}, Issue Date: ${magazine.issueDate}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.kammavoice.com/magazine/${id}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: magazine.coverImageUrl,
          width: 800,
          height: 1067,
          alt: magazine.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [magazine.coverImageUrl],
    },
  };
}

export default async function MagazinePage({ params }: Props) {
  const { id } = await params;
  let magazine = await getMagazineBySlugSSR(id);
  if (!magazine) {
    magazine = await getMagazineByIdSSR(id);
  }

  if (!magazine) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0A0A0A] text-center px-4">
        <h1 className="text-3xl font-bold mb-3 font-[family-name:var(--font-playfair)] text-white">
          Magazine Not Found
        </h1>
        <p className="text-muted mb-8 max-w-md mx-auto">
          The issue you&apos;re trying to read doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/magazine"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-[#0A0A0A] font-semibold text-sm hover:bg-gold-light transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Archive
        </Link>
      </div>
    );
  }

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PublicationIssue",
    "name": magazine.title,
    "issueNumber": magazine.volume,
    "datePublished": magazine.createdAt,
    "image": magazine.coverImageUrl,
    "inLanguage": ["te"],
    "publisher": {
      "@type": "Organization",
      "name": "Kamma Voice",
      "logo": {
        "@type": "ImageObject",
        "url": "https://kammavoice.com/logo.png" // Placeholder
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MagazineReaderClient magazine={magazine} />
    </>
  );
}
