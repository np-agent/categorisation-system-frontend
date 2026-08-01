"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session, { useSessionContext } from "supertokens-auth-react/recipe/session";

type AuthError = { message: string } | null;

function fieldErrorMessage(
  formFields: { id: string; error: string }[] | undefined,
  fallback: string
) {
  if (!formFields?.length) return fallback;
  return formFields.map((f) => f.error).join(", ");
}

export function useAuth() {
  const router = useRouter();
  const session = useSessionContext();
  const [loading, setLoading] = useState(true);

  const sessionLoading = session.loading;
  const doesSessionExist = !session.loading && session.doesSessionExist;
  const userId =
    !session.loading && session.doesSessionExist ? session.userId : null;

  useEffect(() => {
    setLoading(sessionLoading);
  }, [sessionLoading]);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await EmailPassword.signIn({
      formFields: [
        { id: "email", value: email },
        { id: "password", value: password },
      ],
    });

    if (response.status === "FIELD_ERROR") {
      return {
        error: {
          message: fieldErrorMessage(response.formFields, "Invalid input"),
        } as AuthError,
      };
    }
    if (response.status === "WRONG_CREDENTIALS_ERROR") {
      return { error: { message: "Incorrect email or password" } as AuthError };
    }
    if (response.status === "SIGN_IN_NOT_ALLOWED") {
      return {
        error: { message: response.reason || "Sign in not allowed" } as AuthError,
      };
    }

    return { error: null as AuthError };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const response = await EmailPassword.signUp({
      formFields: [
        { id: "email", value: email },
        { id: "password", value: password },
      ],
    });

    if (response.status === "FIELD_ERROR") {
      return {
        error: {
          message: fieldErrorMessage(response.formFields, "Invalid input"),
        } as AuthError,
      };
    }
    if (response.status === "SIGN_UP_NOT_ALLOWED") {
      return {
        error: {
          message: response.reason || "Sign up not allowed",
        } as AuthError,
      };
    }

    return { error: null as AuthError };
  }, []);

  const signOut = useCallback(async () => {
    await Session.signOut();
    router.replace("/login");
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    const response = await EmailPassword.sendPasswordResetEmail({
      formFields: [{ id: "email", value: email }],
    });

    if (response.status === "FIELD_ERROR") {
      return {
        error: {
          message: fieldErrorMessage(response.formFields, "Invalid email"),
        } as AuthError,
      };
    }
    if (response.status === "PASSWORD_RESET_NOT_ALLOWED") {
      return {
        error: {
          message: "Password reset is not allowed for this account",
        } as AuthError,
      };
    }

    return { error: null as AuthError };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const response = await EmailPassword.submitNewPassword({
      formFields: [{ id: "password", value: password }],
    });

    if (response.status === "FIELD_ERROR") {
      return {
        error: {
          message: fieldErrorMessage(response.formFields, "Invalid password"),
        } as AuthError,
      };
    }
    if (response.status === "RESET_PASSWORD_INVALID_TOKEN_ERROR") {
      return {
        error: {
          message: "Reset link is invalid or expired. Please request a new one.",
        } as AuthError,
      };
    }

    return { error: null as AuthError };
  }, []);

  const getResetTokenFromUrl = useCallback(() => {
    return EmailPassword.getResetPasswordTokenFromURL();
  }, []);

  return {
    userId,
    doesSessionExist,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    getResetTokenFromUrl,
  };
}
