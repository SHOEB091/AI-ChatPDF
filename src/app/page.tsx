"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserButton, useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, LogIn, Loader2 } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import SubscriptionButton from "@/components/SubscriptionButton";
import { type DrizzleChat } from "@/lib/db/schema";
import axios from "axios";

export default function Home() {
  const { userId, isLoaded } = useAuth();
  const { signOut } = useClerk();
  const isAuth = !!userId;

  const [firstChat, setFirstChat] = useState<DrizzleChat | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        try {
          setLoading(true);

          // Fetch subscription status
          const subscriptionResponse = await axios.get("/api/subscription");
          setIsPro(subscriptionResponse.data.isPro);

          // Fetch user chats
          const chatsResponse = await axios.get("/api/chats");
          const userChats = chatsResponse.data.chats;
          if (userChats.length > 0) {
            setFirstChat(userChats[0]);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (isLoaded) {
      fetchData();
    }
  }, [userId, isLoaded]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-rose-100 to-teal-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4">
        <div className="flex flex-col items-center text-center bg-white/30 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          <div className="flex items-center mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="text-5xl font-semibold bg-gradient-to-r from-primary to-rose-500 bg-clip-text text-transparent">Chat with any PDF</h1>
            </div>
          </div>
          {isAuth && (
            <div className="flex items-center justify-center mt-4 mb-2">
              <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-full shadow-md">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-10 h-10",
                    }
                  }}
                />
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          <div className="flex mt-2 justify-center">
            {isAuth && !loading && (
              <>
                {firstChat ? (
                  <Link href={`/chat/${firstChat.id}`}>
                    <Button className="mr-3">
                      Go to Chats <ArrowRight className="ml-2" />
                    </Button>
                  </Link>
                ) : null}
                <SubscriptionButton isPro={isPro} />
              </>
            )}
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-600">
            Join millions of students, researchers and professionals to instantly
            answer questions and understand research with AI
          </p>

          {isAuth && !loading && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isPro
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isPro ? '✨ Pro User' : '🆓 Free Plan'}
              </span>
            </div>
          )}

          <div className="w-full mt-6">
            {!isLoaded ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-slate-600">Loading...</span>
              </div>
            ) : isAuth ? (
              <>
                {loading ? (
                  <div className="flex justify-center items-center py-4 mb-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-slate-600">Loading your data...</span>
                  </div>
                ) : null}
                <FileUpload />
              </>
            ) : (
              <Link href="/sign-in" className="w-full">
                <Button className="w-full py-6 text-lg rounded-lg shadow-md hover:shadow-lg transition-all">
                  Login to get Started!
                  <LogIn className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}