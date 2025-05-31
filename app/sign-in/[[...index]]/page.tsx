'use client';
import { SignIn } from "@clerk/nextjs";
// import { dark } from "@clerk/themes"; // No longer needed here, theme comes from Provider

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* Appearance is now inherited from ClerkProvider in layout.tsx */}
      <SignIn />
    </div>
  );
} 