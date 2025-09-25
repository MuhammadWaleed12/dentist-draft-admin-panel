"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import computer from "@/assets/images/computer.jpg";

const categories = ["Category 1", "Category 2", "Category 3", "Category 4"];

const blogPosts = [
  {
    id: 1,
    title: "Article 1",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat libero eget pretium aliquet.",
    image: computer,
    category: "Category 1",
    date: "2025-01-15",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Article 2",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat libero eget pretium aliquet.",
    image: computer,
    category: "Category 2",
    date: "2025-01-14",
    readTime: "7 min read",
  },
  {
    id: 3,
    title: "Article 3",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat libero eget pretium aliquet.",
    image: computer,
    category: "Category 3",
    date: "2025-01-13",
    readTime: "4 min read",
  },
  {
    id: 4,
    title: "Article 4",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat libero eget pretium aliquet.",
    image: computer,
    category: "Category 4",
    date: "2025-01-12",
    readTime: "6 min read",
  },
  {
    id: 5,
    title: "Article 5",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat libero eget pretium aliquet.",
    image: computer,
    category: "Category 1",
    date: "2025-01-11",
    readTime: "8 min read",
  },
  {
    id: 6,
    title: "Article 6",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat libero eget pretium aliquet.",
    image: computer,
    category: "Category 2",
    date: "2025-01-10",
    readTime: "5 min read",
  },
  {
    id: 7,
    title: "Article 7",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat libero eget pretium aliquet.",
    image: computer,
    category: "Category 3",
    date: "2025-01-09",
    readTime: "9 min read",
  },
  {
    id: 8,
    title: "Article 8",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat libero eget pretium aliquet.",
    image: computer,
    category: "Category 4",
    date: "2025-01-08",
    readTime: "3 min read",
  },
  {
    id: 9,
    title: "Article 9",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed feugiat libero eget pretium aliquet.",
    image: computer,
    category: "Category 1",
    date: "2025-01-07",
    readTime: "6 min read",
  },
];

export function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Dentistar Insights
            </h1>

            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search articles"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-blue-500 bg-white shadow-sm"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-3">
              <Badge
                variant={!selectedCategory ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                  !selectedCategory
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
                onClick={() => setSelectedCategory("")}
              >
                All Articles
              </Badge>
              {categories.map((category, index) => (
                <Badge
                  key={index}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  className={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white border-0 shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={400}
                      height={240}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category Badge */}
                    <Badge
                      variant="secondary"
                      className="mb-3 text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {post.category}
                    </Badge>

                    {/* Title */}
                    <h3 className="font-semibold text-lg text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {new Date(post.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <div className="mb-4 rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No articles found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}

          {/* Load More Button */}
          {filteredPosts.length > 0 && (
            <div className="text-center mt-12">
              <button className="bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md">
                Load More Articles
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
