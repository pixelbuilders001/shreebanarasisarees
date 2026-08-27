import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { BLOG_POSTS } from '../../data/blog';
import { Calendar, User, Clock, ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: "Saree Care, Styling & Shopping Blog | Shree Banarasi Sarees",
  description: "Read the latest articles on Indian saree styling, bridal trousseau guides, handloom identification tips, and local shopping guides from Shree Banarasi Sarees in Samastipur, Bihar.",
  alternates: {
    canonical: "https://shreebanarasisarees.in/blog",
  },
  openGraph: {
    title: "Saree Care, Styling & Shopping Blog | Shree Banarasi Sarees",
    description: "Read the latest articles on Indian saree styling, bridal trousseau guides, handloom identification tips, and local shopping guides from Shree Banarasi Sarees in Samastipur, Bihar.",
    url: "https://shreebanarasisarees.in/blog",
    type: "website",
  }
};

export default function BlogHome() {
  // Breadcrumb Schema
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://shreebanarasisarees.in"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://shreebanarasisarees.in/blog"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />

      <main className="bg-[#FFF9F0] py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumbs */}
          <nav className="text-xs text-dark-brown/50 font-medium mb-6 flex items-center gap-1 select-none">
            <Link href="/" className="hover:text-maroon">Home</Link>
            <span>/</span>
            <span className="text-dark-brown font-semibold">Blog</span>
          </nav>

          {/* Page Title */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-8 h-px bg-gold/50"></div>
              <span className="text-xs text-gold uppercase tracking-[0.2em] font-bold block">
                Saree Insights
              </span>
              <div className="w-8 h-px bg-gold/50"></div>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-dark-brown tracking-wide">
              Saree Styling & Heritage Blog
            </h1>
            <div className="w-16 h-0.5 bg-maroon mx-auto my-4"></div>
            <p className="text-sm text-dark-brown/70 leading-relaxed font-light">
              Explore professional styling advice, fabric care tips, bridal fashion guides, and standard tests to verify handloom authenticity, curated by the showroom weavers at Shree Banarasi Sarees.
            </p>
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl border border-cream overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md hover:border-gold/30 hover:scale-[1.01] transition-all"
              >
                <div>
                  {/* Blog Image */}
                  <div className="aspect-[16/10] w-full relative overflow-hidden bg-cream/20">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover object-center"
                    />
                    <span className="absolute top-4 left-4 bg-maroon text-ivory text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {post.category}
                    </span>
                  </div>

                  {/* Blog Meta & Content */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 text-[10px] sm:text-xs text-dark-brown/50 font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-gold" />
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-gold" />
                        {post.readTime}
                      </span>
                    </div>

                    <h2 className="font-serif text-base sm:text-lg font-bold text-dark-brown hover:text-maroon transition-colors line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>

                    <p className="text-xs sm:text-sm text-dark-brown/65 leading-relaxed font-light line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-maroon hover:underline group"
                  >
                    READ ARTICLE
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
