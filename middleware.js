import { next, rewrite } from "@vercel/functions";

const EAZO_HOST = "eazo.droomit.be";

export default function middleware(request) {
  const url = new URL(request.url);

  if (url.hostname === EAZO_HOST) {
    url.pathname = "/client1";
    return rewrite(url);
  }

  return next();
}

export const config = {
  matcher: ["/:path*"],
  runtime: "edge",
};
