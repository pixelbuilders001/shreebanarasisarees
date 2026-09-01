import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { SareesClient } from '../../../components/SareesClient';
import { fetchCategories, fetchProducts } from '../../../data/supabase';
import { IconMarqueeLoader } from '../../../components/IconMarqueeLoader';

interface PageProps {
  params: Promise<{ category?: string[] }>;
}

// Database-like mapping of categories and occasions
interface SeoData {
  title: string;
  description: string;
  h1: string;
  intro: string;
  category: string;
  occasion: string;
}

const SEO_MAP: Record<string, SeoData> = {
  all: {
    title: "Shree Banarasi Sarees | Banarasi & Traditional Sarees in Samastipur",
    description: "Shop beautiful Banarasi, Chikankari, Bandhani, Organza and Chanderi sarees at Shree Banarasi Sarees, Samastipur, Bihar. Explore elegant sarees for weddings, festivals and special occasions.",
    h1: "Our Saree Collection",
    intro: "Welcome to Shree Banarasi Sarees, Samastipur's finest destination for authentic Indian ethnic wear. Explore our meticulously curated collection of traditional sarees. Each piece in our showroom represents India's rich weaving heritage, handpicked to ensure premium quality fabrics and exquisite gold and silver zari work. Whether you are searching for a wedding Kanjeevaram, a festive Banarasi, or a lightweight organza for party wear, our collection offers unparalleled elegance at accessible prices. We offer free shipping across India and dedicated custom tailoring services to complete your perfect ensemble.",
    category: "All",
    occasion: "All",
  },
  banarasi: {
    title: "Banarasi Sarees | Traditional Banarasi Silk Sarees",
    description: "Explore elegant Banarasi sarees featuring traditional Indian craftsmanship, rich fabrics and timeless designs. Discover wedding and festive styles.",
    h1: "Banarasi Sarees",
    intro: "Step into a world of regal splendor with our collection of Banarasi sarees at Shree Banarasi Sarees. Handwoven in the historic lanes of Varanasi, these masterfully crafted sarees are made from pure Katan silk and adorned with opulent gold and silver zari work. Featuring classic floral jaal, shikargah borders, and sona-rupa motifs, our Banarasi sarees are perfect for brides, weddings, and grand celebrations. Each saree represents hours of dedicated artisan craftsmanship, ensuring you carry a piece of heritage. Enjoy free home delivery across Bihar and Samastipur, and chat with our saree experts to customize your blouse.",
    category: "Banarasi",
    occasion: "All",
  },
  chikankari: {
    title: "Chikankari Sarees | Lucknowi Hand-Embroidered Georgette & Silk Sarees",
    description: "Discover elegant Lucknowi Chikankari sarees at Shree Banarasi Sarees. Featuring delicate hand-embroidery, shadow work, and sparkling mukaish details on premium georgette and silk.",
    h1: "Chikankari Sarees",
    intro: "Experience the delicate elegance of Lucknowi Chikankari sarees at Shree Banarasi Sarees. Renowned for its intricate hand-embroidery, our collection features beautiful shadow work, phanda, and bakhiya stitches on premium georgette, cotton, and silk blends. Embellished with subtle silver mukaish work and pearl borders, these lightweight sarees exude sophistication and grace, making them an excellent choice for daytime functions, summer parties, and festivals. Shop our authentic Lucknowi collection online or visit our showroom in Samastipur, Bihar.",
    category: "Chikankari",
    occasion: "All",
  },
  bandhani: {
    title: "Bandhani Silk & Georgette Sarees | Authentic Kutch Tie & Dye",
    description: "Shop authentic Rajasthani and Gujarati Bandhani sarees at Shree Banarasi Sarees. Hand-tied Bandhej dots on premium Gajji silk and georgette with gold Gota Patti borders.",
    h1: "Bandhani Sarees",
    intro: "Celebrate colors and heritage with our premium collection of Bandhani sarees. Tied by traditional craftspeople in Kutch and Rajasthan, these sarees feature dense, intricate bandhej patterns on luxurious Gajji silk and georgette. Adorned with broad Banarasi zari borders and hand-embroidered Gota Patti work, our Bandhani sarees are a staple for traditional Indian festivals, pujas, and weddings. Browse our beautiful collection of red, royal blue, and dual-tone sarees, delivered directly to your home with free shipping across India.",
    category: "Bandhani",
    occasion: "All",
  },
  organza: {
    title: "Organza Sarees | Lightweight Glass Organza Sarees Online",
    description: "Shop contemporary and elegant organza sarees at Shree Banarasi Sarees. Premium glass organza with zardozi embroidery, hand-painted florals, and delicate scallop borders.",
    h1: "Organza Sarees",
    intro: "Embrace modern elegance with our stunning range of organza sarees at Shree Banarasi Sarees. Made from translucent, high-grade glass organza, these lightweight sarees offer a sophisticated and airy drape that flatters every silhouette. Featuring delicate scalloped borders, hand-painted watercolor florals, and fine silver zardozi embroidery, our organza collection is highly photogenic and perfect for cocktail parties, office events, and festive celebrations. Elevate your wardrobe with pastel lavender, peach, and deep wine shades.",
    category: "Organza",
    occasion: "All",
  },
  chanderi: {
    title: "Chanderi Silk & Cotton Sarees | Hand-Block Printed & Zari Border Sarees",
    description: "Explore lightweight Chanderi silk and cotton sarees at Shree Banarasi Sarees. Hand-block printed designs, elegant zari borders, and sophisticated pastel shades.",
    h1: "Chanderi Sarees",
    intro: "Discover the understated luxury of Chanderi sarees at Shree Banarasi Sarees. Woven from a fine blend of silk and cotton, Chanderi sarees are celebrated for their sheer texture, lightweight feel, and elegant sheen. Our collection showcases hand-carved wooden block prints, traditional zari borders, and beautiful aashavali motifs in sophisticated pastel green, golden honey, and classic ivory tones. Ideal for temple visits, family gatherings, and professional wear, these sarees keep you comfortable and elegant all day long.",
    category: "Chanderi",
    occasion: "All",
  },
  bridal: {
    title: "Bridal & Wedding Sarees | Royal Silk Wedding Sarees in Bihar",
    description: "Explore our premium Bridal Saree Collection at Shree Banarasi Sarees. Exquisite wedding sarees, heavy gold zari embroidery, and bridal trousseau styles for the modern bride.",
    h1: "Bridal Collection",
    intro: "For the most special day of your life, choose from our royal Bridal Saree Collection at Shree Banarasi Sarees, Samastipur. Handpicked for the modern Indian bride, our collection features heirloom-quality Banarasi Katan silks, heavy velvet-blend lehenga sarees, and pure silk sarees adorned with heavy gold wire embroidery, zardozi work, and semi-precious stone embellishments. Available in traditional bridal crimson, deep maroon, and auspicious gold, our bridal sarees are designed to make you feel like royalty. Visit our showroom or request a custom video consultation.",
    category: "Bridal",
    occasion: "All",
  },
  wedding: {
    title: "Wedding Sarees | Designer & Traditional Indian Wedding Sarees",
    description: "Shop gorgeous Indian wedding sarees for brides and wedding guests at Shree Banarasi Sarees. Premium silk, zari borders, and festive designs with free delivery.",
    h1: "Wedding Sarees",
    intro: "Find the perfect attire for every wedding celebration with our extensive wedding saree collection. From heavy Kanjeevaram and Banarasi silks for the bride to elegant georgette and organza sarees for bridesmaids and wedding guests, Shree Banarasi Sarees offers designs that suit every style and budget. Each saree is chosen for its premium texture and beautiful drape, ensuring you look stunning throughout the wedding festivities. Enjoy store pickup or free shipping across India.",
    category: "All",
    occasion: "Wedding",
  },
  "party-wear": {
    title: "Party Wear Sarees | Modern & Elegant Party Sarees Online",
    description: "Shop designer party wear sarees at Shree Banarasi Sarees. Lightweight georgette, stylish organza, and fusion sarees with delicate sequins and scallop borders.",
    h1: "Party Wear Sarees",
    intro: "Stand out at every event with our designer party wear sarees. At Shree Banarasi Sarees, we blend traditional weaves with modern patterns. Featuring lightweight organza, georgette, and flowing Chanderi silks, our collection is highlighted by contemporary details like sequins, scallop borders, hand-painted florals, and trendy colors like lavender and wine. Comfortable yet glamorous, these sarees are perfect for evening cocktails, reception parties, and modern celebrations.",
    category: "All",
    occasion: "Party",
  },
  offers: {
    title: "Saree Offers & Discounts | Premium Sarees Starting at ₹999",
    description: "Grab amazing discounts on Banarasi, Chikankari and Organza sarees at Shree Banarasi Sarees. High-quality traditional sarees on sale starting at just ₹999.",
    h1: "Special Saree Offers",
    intro: "Explore exclusive discounts and festive offers on your favorite saree collections at Shree Banarasi Sarees. We believe premium Indian fashion should be accessible, which is why we offer selected handloom Banarasi, Lucknowi Chikankari, and contemporary organza sarees at special sale prices starting at just ₹999. Every discounted saree maintains our high standards of fabric quality and finish. Browse our offers page and secure your favorites before stocks run out!",
    category: "Offers",
    occasion: "All",
  }
};

function getSeoKey(categoryPath?: string[]): string | null {
  if (!categoryPath || categoryPath.length === 0) return null;
  const key = categoryPath[0].toLowerCase();
  return SEO_MAP[key] ? key : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const categoryPath = resolvedParams.category;
  const seoKey = getSeoKey(categoryPath);
  
  // Try to find the category in the database by slug or name
  let dbCategory = null;
  if (categoryPath && categoryPath.length > 0) {
    const rawSlug = categoryPath[0].toLowerCase();
    const categories = await fetchCategories();
    dbCategory = categories.find(c => c.slug.toLowerCase() === rawSlug || c.name.toLowerCase() === rawSlug);
  }

  let data;
  if (seoKey && SEO_MAP[seoKey]) {
    data = SEO_MAP[seoKey];
  } else if (dbCategory) {
    data = {
      title: `${dbCategory.name} Sarees | Traditional & Designer Collections`,
      description: dbCategory.description || `Explore elegant ${dbCategory.name} sarees at Shree Banarasi Sarees. Discover beautiful wedding, festive and party styles.`,
      h1: `${dbCategory.name} Sarees`,
      intro: dbCategory.description || `Discover our exclusive collection of handpicked ${dbCategory.name} sarees. Each piece represents India's rich weaving heritage, crafted with premium fabrics and exquisite work.`,
      category: dbCategory.name,
      occasion: "All",
    };
  } else if (categoryPath && categoryPath.length > 0) {
    const categoryName = decodeURIComponent(categoryPath[0])
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    data = {
      title: `${categoryName} Sarees | Traditional & Designer Collections`,
      description: `Explore elegant ${categoryName} sarees at Shree Banarasi Sarees. Discover beautiful wedding, festive and party styles.`,
      h1: `${categoryName} Sarees`,
      intro: `Discover our exclusive collection of handpicked ${categoryName} sarees. Each piece represents India's rich weaving heritage, crafted with premium fabrics and exquisite work.`,
      category: categoryName,
      occasion: "All",
    };
  } else {
    data = SEO_MAP.all;
  }

  const canonicalPath = categoryPath ? `/sarees/${categoryPath.join('/')}` : '/sarees';

  return {
    title: data.title,
    description: data.description,
    alternates: {
      canonical: `https://shreebanarasisarees.in${canonicalPath}`,
    },
    openGraph: {
      title: data.title,
      description: data.description,
      url: `https://shreebanarasisarees.in${canonicalPath}`,
      type: "website",
      images: [
        {
          url: "https://shreebanarasisarees.in/og_image.jpg",
          width: 1024,
          height: 537,
          alt: "Shree Banarasi Sarees Showcase",
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
      images: ["https://shreebanarasisarees.in/og_image.jpg"],
    }
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const categoryPath = resolvedParams.category;
  const seoKey = getSeoKey(categoryPath);
  
  const [categories, dbProducts] = await Promise.all([
    fetchCategories(),
    fetchProducts()
  ]);

  let dbCategory = null;
  if (categoryPath && categoryPath.length > 0) {
    const rawSlug = categoryPath[0].toLowerCase();
    dbCategory = categories.find(c => c.slug.toLowerCase() === rawSlug || c.name.toLowerCase() === rawSlug);
  }

  let data;
  if (seoKey && SEO_MAP[seoKey]) {
    data = SEO_MAP[seoKey];
  } else if (dbCategory) {
    data = {
      title: `${dbCategory.name} Sarees | Traditional & Designer Collections`,
      description: dbCategory.description || `Explore elegant ${dbCategory.name} sarees at Shree Banarasi Sarees. Discover beautiful wedding, festive and party styles.`,
      h1: `${dbCategory.name} Sarees`,
      intro: dbCategory.description || `Discover our exclusive collection of handpicked ${dbCategory.name} sarees. Each piece represents India's rich weaving heritage, crafted with premium fabrics and exquisite work.`,
      category: dbCategory.name,
      occasion: "All",
    };
  } else if (categoryPath && categoryPath.length > 0) {
    const categoryName = decodeURIComponent(categoryPath[0])
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    data = {
      title: `${categoryName} Sarees | Traditional & Designer Collections`,
      description: `Explore elegant ${categoryName} sarees at Shree Banarasi Sarees. Discover beautiful wedding, festive and party styles.`,
      h1: `${categoryName} Sarees`,
      intro: `Discover our exclusive collection of handpicked ${categoryName} sarees. Each piece represents India's rich weaving heritage, crafted with premium fabrics and exquisite work.`,
      category: categoryName,
      occasion: "All",
    };
  } else {
    data = SEO_MAP.all;
  }

  // Merge categories from DB with standard list
  const dbCatNames = categories.map(c => c.name);
  const categoriesList = ['All', ...dbCatNames, 'Offers'];
  const uniqueCategoriesList = Array.from(new Set(categoriesList));

  // Build Breadcrumb structured data
  const breadcrumbList = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://shreebanarasisarees.in"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Sarees",
      "item": "https://shreebanarasisarees.in/sarees"
    }
  ];

  if (resolvedParams.category && resolvedParams.category.length > 0) {
    const subName = resolvedParams.category[0].charAt(0).toUpperCase() + resolvedParams.category[0].slice(1);
    breadcrumbList.push({
      "@type": "ListItem",
      "position": 3,
      "name": subName,
      "item": `https://shreebanarasisarees.in/sarees/${resolvedParams.category[0].toLowerCase()}`
    });
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbList
  };

  const filteredProductsForSchema = dbProducts.filter(p => {
    if (data.category === 'All' || !data.category) return true;
    if (data.category === 'Offers') return p.salePrice !== undefined && p.salePrice !== null && p.salePrice < p.price;
    return p.category.toLowerCase() === data.category.toLowerCase();
  }).slice(0, 15);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": data.h1,
    "description": data.intro,
    "numberOfItems": filteredProductsForSchema.length,
    "itemListElement": filteredProductsForSchema.map((p, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": p.name,
      "url": `https://shreebanarasisarees.in/product/${p.slug}`,
      "image": p.images[0] || undefined
    }))
  };

  return (
    <>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Suspense fallback={<IconMarqueeLoader />}>
        <SareesClient
          initialCategory={data.category}
          initialOccasion={data.occasion}
          h1Title={data.h1}
          introductoryContent={data.intro}
          allProducts={dbProducts}
          categoriesList={uniqueCategoriesList}
        />
      </Suspense>
    </>
  );
}
