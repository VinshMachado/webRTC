import User from "../model/UserSchema.js";
import jwt from "jsonwebtoken";

const getUserDetails = async (req, res) => {
  const token = req.cookies.token;
  console.log(token);

  const data = jwt.verify(token, process.env.JWT_SECRET);

  console.log(data);

  const userdtails = await User.find({ id: data.id }).lean();

  res.status(200).json({ message: "successfully retrieved ", obj: userdtails });
};

export default getUserDetails;
