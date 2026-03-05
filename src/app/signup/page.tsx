'use client';

import { SignupForm } from "@/components/auth/signup-form";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";


export default function SignupPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4">
           <Skeleton className="h-10 w-3/4 mx-auto" />
           <Skeleton className="h-8 w-1/2 mx-auto" />
            <div className="space-y-4 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-svh w-full items-center justify-center bg-background px-4">
      <SignupForm />
    </div>
  );
}
