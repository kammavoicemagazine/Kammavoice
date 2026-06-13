import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllActiveAds } from "@/lib/firestore";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: "Sponsors & Advertisements | Kamma Voice",
  description: "Explore our featured sponsors and advertisements on Kamma Voice Magazine.",
};

export default async function AdvertisementsPage() {
  const ads = await getAllActiveAds();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-[family-name:var(--font-playfair)] text-gold-gradient mb-4">
              Our Sponsors
            </h1>
            <p className="text-muted max-w-2xl mx-auto">
              Discover and support the businesses and organizations that make Kamma Voice possible.
            </p>
          </div>

          {ads.length === 0 ? (
            <div className="text-center py-20 bg-surface rounded-xl border border-border-subtle">
              <p className="text-muted text-lg">No active advertisements at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ads.map((ad) => (
                <Link
                  key={ad.id}
                  href={`/advertisements/${ad.slug || ad.id}`}
                  className="group block relative rounded-2xl overflow-hidden bg-surface border border-border-subtle hover:border-gold/40 transition-all shadow-md hover:shadow-gold/10"
                >
                  <div className="relative aspect-video bg-black/20">
                    <Image
                      src={ad.imageUrl}
                      alt={ad.sponsorName || ad.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {ad.featured && (
                      <div className="absolute top-4 right-4 bg-gold text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h2 className="text-xl font-bold font-[family-name:var(--font-playfair)] text-foreground group-hover:text-gold transition-colors line-clamp-2">
                        {ad.sponsorName || ad.title}
                      </h2>
                    </div>
                    {ad.description && (
                      <p className="text-sm text-muted line-clamp-3 mb-4">
                        {ad.description}
                      </p>
                    )}
                    <div className="flex items-center text-gold text-sm font-medium mt-auto group-hover:translate-x-1 transition-transform">
                      View Details →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
