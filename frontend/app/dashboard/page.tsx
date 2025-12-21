"use client";
import React from "react";
import { useRouter } from "next/navigation";

const page = () => {
  const router = useRouter();

  return (
    <div className="w-full h-[100vh] bg-slate-900 flex justify-center items-center">
      <button
        className="px-6 py-3 rounded-lg m-10 bg-indigo-600 text-white font-medium
             hover:bg-indigo-500 transition
             shadow-lg shadow-indigo-600/30
             active:scale-95"
        onClick={() => {
          router.push("/dashboard/Createmeeting");
        }}
      >
        Create a meeting
      </button>

      <button
        className="px-6 py-3 rounded-lg bg-gray-700 text-gray-200 font-medium
             hover:bg-gray-600 transition
             shadow-lg shadow-black/40
             active:scale-95"
        onClick={() => {
          router.push("/dashboard/joinMeeting");
        }}
      >
        Join a meeting
      </button>
    </div>
  );
};

export default page;
