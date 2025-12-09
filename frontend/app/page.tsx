"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
declare global {
  interface Window {
    google: any;
  }
}

export default function Home() {
  const router = useRouter();
  const handleGoogle = async (response: any) => {
    console.log(
      "ID TOKEsN:",
      response.credential,
      ":",
      process.env.NEXT_PUBLIC_BACKEND
    );
    // send this token to backend for verification
    const id = response.credential;

    const responce = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND}/auth/GetToken`,
      {
        method: "POST",
        body: JSON.stringify({ _id: id }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await responce.json();
    if (!responce.ok) {
      console.log(data);
      alert("failed");
    } else {
      router.push("/dashboard");
    }
    console.log("worked");
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
