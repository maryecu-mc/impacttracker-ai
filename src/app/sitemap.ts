import type { MetadataRoute } from "next";

const SITE_URL = "https://impacttracker.maryecurry.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/tracker`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/dashboard`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}
