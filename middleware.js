import { next, rewrite } from "@vercel/functions";

const EAZO_HOST = "eazo.droomit.be";
const VALID_NL_PATHS = new Set([
  "/nl",
  "/nl/contact",
  "/nl/diensten",
  "/nl/ecommerce",
  "/nl/juridisch",
  "/nl/over",
  "/nl/privacy",
  "/nl/webapplicaties",
  "/nl/webdesign",
  "/nl/website-redesign",
  "/nl/werk",
  "/nl/werk/bubble-paws",
  "/nl/werk/polychem-mb",
  "/nl/werkwijze",
]);

export default function middleware(request) {
  const url = new URL(request.url);

  if (url.hostname === EAZO_HOST) {
    url.pathname = "/client1";
    return rewrite(url);
  }

  if (
    url.pathname.startsWith("/nl/") &&
    !VALID_NL_PATHS.has(url.pathname.replace(/\/$/, "")) &&
    !url.pathname.includes(".")
  ) {
    const notFoundUrl = new URL("/nl/404.html", request.url);
    return fetch(notFoundUrl).then(async (response) => {
      const body = await response.text();
      return new Response(body, {
        status: 404,
        headers: {
          "content-type": response.headers.get("content-type") || "text/html; charset=utf-8",
        },
      });
    });
  }

  return next();
}

export const config = {
  matcher: ["/:path*"],
  runtime: "edge",
};
