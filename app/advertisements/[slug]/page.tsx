import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdBySlug, getAllActiveAds } from "@/lib/firestore";
import AdvertisementClient from "./AdvertisementClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const ads = await getAllActiveAds();
  return ads.filter(ad => ad.slug).map((ad) => ({
    slug: ad.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ad = await getAdBySlug(slug);

  if (!ad) {
    return {
      title: "Advertisement Not Found | Kamma Voice",
    };
  }

  const title = `${ad.sponsorName || ad.title} | Kamma Voice Sponsor`;
  const description = ad.description || `Check out this sponsor on Kamma Voice Magazine.`;
  const url = `https://www.kammavoice.com/advertisements/${ad.slug || ad.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Kamma Voice",
      images: [
        {
          url: ad.imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ad.imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function AdvertisementPage({ params }: Props) {
  const { slug } = await params;
  const ad = await getAdBySlug(slug);

  if (!ad) {
    notFound();
  }

  // Generate LocalBusiness JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": ad.sponsorName || ad.title,
    "image": ad.imageUrl,
    "url": ad.website || `https://www.kammavoice.com/advertisements/${ad.slug || ad.id}`,
    "telephone": ad.contactNumber || undefined,
    "description": ad.description || `Sponsor on Kamma Voice`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AdvertisementClient ad={ad} />
    </>
  );
}
