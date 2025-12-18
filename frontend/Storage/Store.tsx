import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Details {
  _id: string;
  id: string;
  name: string;
  email: string;
  profile: string;
}

interface UserSchema {
  Userdata: Details;
  setUser: (data: Details) => void;
  clearUser: () => void;
}

const UserDetails = create<UserSchema>()(
  persist(
    (set) => ({
      Userdata: {
        _id: "",
        id: "",
        name: "",
        email: "",
        profile: "",
      },
      setUser: (data) => set({ Userdata: data }),
      clearUser: () =>
        set({
          Userdata: {
            _id: "",
            id: "",
            name: "",
            email: "",
            profile: "",
          },
        }),
    }),
    {
      name: "user-details-storage", // key in localStorage
    }
  )
);

export default UserDetails;
