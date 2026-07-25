"use client";

import SuperTokens from "supertokens-auth-react";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import EmailVerification from "supertokens-auth-react/recipe/emailverification";
import Session from "supertokens-auth-react/recipe/session";

export const routerInfo: {
  router: { push: (href: string) => void } | undefined;
  pathName: string | undefined;
} = {
  router: undefined,
  pathName: undefined,
};

let hasInit = false;

function toHref(url: string | URL) {
  return typeof url === "string" ? url : url.toString();
}

export function initSuperTokens() {
  if (typeof window === "undefined" || hasInit) {
    return;
  }

  hasInit = true;

  SuperTokens.init({
    appInfo: {
      appName: "SelfBrief Aero",
      apiDomain: process.env.NEXT_PUBLIC_API_BASE_URL!,
      apiBasePath: "/auth",
      websiteDomain: process.env.NEXT_PUBLIC_SITE_URL!,
      websiteBasePath: "/",
    },
    recipeList: [
      EmailVerification.init({
        mode: "REQUIRED",
        getRedirectionURL: async (context) => {
          if (context.action === "VERIFY_EMAIL") {
            return "/verify-email";
          }
          return undefined;
        },
      }),
      Session.init({
        tokenTransferMethod: "header",
      }),
      EmailPassword.init({
        getRedirectionURL: async (context) => {
          if (context.action === "RESET_PASSWORD") {
            return "/reset-password";
          }
          return undefined;
        },
      }),
    ],
    getRedirectionURL: async (context) => {
      if (context.action === "SUCCESS" && context.newSessionCreated) {
        return "/home";
      }
      return undefined;
    },
    windowHandler: (original) => ({
      ...original,
      location: {
        ...original.location,
        getPathName: () => routerInfo.pathName ?? "/",
        assign: (url) => {
          const href = toHref(url);
          if (routerInfo.router) {
            routerInfo.router.push(href);
            return;
          }
          original.location.assign(url);
        },
        setHref: (url) => {
          const href = toHref(url);
          if (routerInfo.router) {
            routerInfo.router.push(href);
            return;
          }
          original.location.setHref(url);
        },
      },
    }),
  });
}
