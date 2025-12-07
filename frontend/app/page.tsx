"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    google: any;
  }
}

export default function Home() {
  const handleGoogle = (response: any) => {
    console.log("ID TOKEN:", response.credential);
    // send this token to backend for verification
  };

  useEffect(() => {
    /* global google */

    if (window?.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogle,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-btn"),
        {
          theme: "outline",
          size: "large",
          width: "300",
        }
      );
    }
  }, []);

  return (
    <div className="w-full h-screen bg-gray-900 flex justify-center items-center  flex-col">
      <h2 className="text-5xl text-white">Please Sign in to Begin</h2>
      <div id="google-btn" className=" mt-10"></div>
    </div>
  );
}
