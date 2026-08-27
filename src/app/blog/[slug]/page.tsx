import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';
import { BLOG_POSTS } from '../../../data/blog';
import { Calendar, User, Clock, ArrowLeft, BookOpen, Share2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = BLOG_POSTS.find(p => p.slug === resolvedParams.slug);

  if (!post) {
    return {
      title: "Article Not Found | Shree Banarasi Sarees Blog",
      description: "The article you are looking for does not exist or has been moved.",
    };
  }

  return {
    title: `${post.title} | Shree Banarasi Sarees Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `https://shreebanarasisarees.in/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | Shree Banarasi Sarees Blog`,
      description: post.excerpt,
      url: `https://shreebanarasisarees.in/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: [
        {
          url: post.image,
          width: 800,
          height: 500,
          alt: post.title,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | Shree Banarasi Sarees Blog`,
      description: post.excerpt,
      images: [post.image],
    }
  };
}

function sanitizeHtml(html: string): string {
  if (!html) return '';
  // Strip dangerous tags: <script>, <iframe>, <object>, <embed>, <form>
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  clean = clean.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
  // Remove event handler attributes (on*="...")
  clean = clean.replace(/ on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // Neutralize javascript: URLs
  clean = clean.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href="#"');
  return clean;
}

export default async function BlogPostPage({ params }: PageProps) {
  const resolvedParams = await params;
  const post = BLOG_POSTS.find(p => p.slug === resolvedParams.slug);

  if (!post) {
    return (
      <>
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
          <h2 className="font-serif text-2xl font-bold text-dark-brown mb-2">Article Not Found</h2>
          <p className="text-sm text-dark-brown/65 mb-6">The article you are looking for has been removed or does not exist.</p>
          <Link href="/blog" className="px-6 py-2.5 bg-maroon text-ivory rounded font-serif font-bold text-xs tracking-wider uppercase">
            BACK TO BLOG
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  // BlogPosting Schema
  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://shreebanarasisarees.in/blog/${post.slug}`
    },
    "headline": post.title,
    "description": post.excerpt,
    "image": post.image,
    "datePublished": post.publishedAt,
    "dateModified": post.publishedAt,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Shree Banarasi Sarees",
      "logo": {
        "@type": "ImageObject",
        "url": "https://shreebanarasisarees.in/brand_logo.png"
      }
    }
  };

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
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://shreebanarasisarees.in/blog/${post.slug}`
      }
    ]
  };

  return (
    <>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />

      <Header />

      <main className="bg-[#FFF9F0] py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumbs & Back Button */}
          <div className="mb-6 flex items-center justify-between">
            <nav className="text-xs text-dark-brown/50 font-medium flex items-center gap-1">
              <Link href="/" className="hover:text-maroon">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-maroon">Blog</Link>
              <span>/</span>
              <span className="text-dark-brown truncate max-w-[120px] sm:max-w-xs">{post.title}</span>
            </nav>
            <Link href="/blog" className="text-xs font-bold text-maroon flex items-center gap-1 hover:underline">
              <ArrowLeft size={14} />
              Back to Blog
            </Link>
          </div>

          {/* Article Card */}
          <article className="bg-white rounded-3xl border border-cream overflow-hidden shadow-sm">

            {/* Header Image */}
            <div className="aspect-[21/9] w-full relative bg-cream/25">
              <img
                src={post.image}
                alt={`${post.title} Banner Image`}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Content Container */}
            <div className="p-6 sm:p-10 space-y-6">

              {/* Category & Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cream pb-5">
                <span className="bg-maroon text-ivory text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {post.category}
                </span>

                <div className="flex items-center gap-4 text-xs text-dark-brown/60 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-gold" />
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-gold" />
                    {post.readTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={13} className="text-gold" />
                    By {post.author}
                  </span>
                </div>
              </div>

              {/* Title H1 */}
              <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-dark-brown tracking-wide leading-tight">
                {post.title}
              </h1>

              {/* Rich HTML Content Body */}
              <div
                className="prose prose-stone max-w-none text-xs sm:text-sm text-dark-brown/85 font-light leading-relaxed space-y-4 pt-2"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
              />

              {/* Share & Custom Saree Promo */}
              <div className="mt-10 p-5 bg-cream/15 rounded-2xl border border-cream/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-serif font-bold text-dark-brown text-sm">Need a custom saree?</h4>
                  <p className="text-xs text-dark-brown/65 font-light">Directly custom-dye threads or weave custom designs with our master tailors.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Link
                    href="/account"
                    className="w-full sm:w-auto py-2 px-5 bg-maroon text-ivory text-center rounded font-serif font-bold text-xs tracking-wider uppercase hover:bg-maroon-dark hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    REQUEST A SAREE
                  </Link>
                  <a
                    href={`https://wa.me/+916203909946?text=${encodeURIComponent(`Hello Shree Banarasi Sarees, I just read your article "${post.title}" and would like to ask a question.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-white border border-[#25D366] text-[#25D366] rounded hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center"
                    aria-label="Ask on WhatsApp"
                  >
                    <Share2 size={14} className="fill-current" />
                  </a>
                </div>
              </div>

            </div>
          </article>

        </div>
      </main>

      <Footer />
    </>
  );
}
