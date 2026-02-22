const nextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'archive.org' },
      { protocol: 'https', hostname: 'www.gutenberg.org' },
      { protocol: 'https', hostname: 'gutenberg.org' },
      { protocol: 'https', hostname: 'standardebooks.org' },
      { protocol: 'https', hostname: '**.manybooks.net' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
}
export default nextConfig
