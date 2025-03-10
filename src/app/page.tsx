"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserButton, useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
// import FileUpload from "@/components/FileUpload";
// import { checkSubscription } from "@/lib/subscription";
// import SubscriptionButton from "@/components/SubscriptionButton";
// import { db } from "@/lib/db";
// import { chats } from "@/lib/db/schema";
// import { eq } from "drizzle-orm";

export default function Home() {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const isAuth = !!userId;
  const [firstChat, setFirstChat] = useState(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        // const subscriptionStatus = await checkSubscription();
        // setIsPro(subscriptionStatus);

        // const userChats = await db.select().from(chats).where(eq(chats.userId, userId));
        // if (userChats.length > 0) {
        //   setFirstChat(userChats[0]);
        // }
      }
    };

    fetchData();
  }, [userId]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-rose-100 to-teal-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">Chat with any PDF</h1>
          </div>
          <div className="flex flex-col items-center mt-4">
            <UserButton />
            <Button onClick={handleSignOut} className="mt-2">
              Sign Out
            </Button>
          </div>

          <div className="flex mt-2">
            {isAuth && firstChat && (
              <>
                <Link href={`/chat/${firstChat?.id}`}>
                  <Button>
                    Go to Chats <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <div className="ml-3">
                  {/* <SubscriptionButton isPro={isPro} /> */}
                </div>
              </>
            )}
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-600">
            Join millions of students, researchers and professionals to instantly
            answer questions and understand research with AI
          </p>

          <div className="w-full mt-4">
            {isAuth ? (
              // <FileUpload />
              <div>File Upload Component</div>
            ) : (
              <Link href="/sign-in">
                <Button>
                  Login to get Started!
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}