"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import UserDetails from "../Storage/Store";
declare global {
  interface Window {
    google: any;
  }
}

export default function Home() {
  const router = useRouter();
  const storeUserDetails = UserDetails((state) => state.setUser);
  const Userdata = UserDetails((state) => state.Userdata);

  useEffect(() => {
    console.log(Userdata); // logs whenever userdata updates
  }, [Userdata]);

  const handleGoogle = async (response: any) => {
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
        credentials: "include",
      },
    );

    const data = await responce.json();
    if (!responce.ok) {
      console.log(data);
      alert("failed");
    } else {
      alert("signin success ");
      router.push("/dashboard");
    }
    console.log("worked");
  };

  const GetUserDetails = async () => {
    const responce = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND}/user/Details`,
      {
        method: "GET",
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await responce.json();
    if (!responce.ok) {
      console.log(data);
      alert("failed");
    } else {
      storeUserDetails({
        _id: data.obj[0]._id,
        id: data.obj[0].id,
        name: data.obj[0].name,
        email: data.obj[0].email,
        profile: data.obj[0].profile,
      });

      router.push("/dashboard");
    }
    console.log("worked1");
  };

  useEffect(() => {
    GetUserDetails();
  }, []);

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
        },
      );
      router.refresh();
    }
  }, []);

  return (
    <div className="w-full h-screen bg-gray-900 flex justify-center items-center  flex-col">
      <h2 className="text-5xl text-white">Please Sign in to Begin</h2>
      <button id="google-btn" className=" mt-10">
        {" "}
        Sign in
      </button>
    </div>
  );
}
