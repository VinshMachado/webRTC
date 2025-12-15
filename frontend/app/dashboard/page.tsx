"use client";
import React, { useEffect } from "react";
import UserDetails from "../../Storage/Store";

const Page = () => {
  const Userdata = UserDetails((state) => state.Userdata);

  useEffect(() => {
    console.log(Userdata); // logs whenever userdata updates
  }, [Userdata]);

  return <div>{Userdata.name}</div>;
};

export default Page;
