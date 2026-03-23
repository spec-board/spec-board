export { handleRequest as middleware } from '@/lib/proxy-handler';

// Config must be statically defined inline — Next.js cannot parse re-exported configs
export const config = {
  matcher: ['/api/:path*'],
};
