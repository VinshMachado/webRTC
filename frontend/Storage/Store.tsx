import { create } from "zustand";

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
}

const UserDetails = create<UserSchema>((set) => ({
  Userdata: {
    _id: "",
    id: "",
    name: "",
    email: "",
    profile: "",
  },
  setUser: (data) => set({ Userdata: data }),
}));

export default UserDetails;
