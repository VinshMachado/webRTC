import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../model/UserSchema.js";

const client = new OAuth2Client();

async function googleVerify(req, res) {
  console.log("google var");
  const { _id } = req.body;

  //  Validate token
  if (!_id) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    //  Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: _id,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("Google payload:", payload);

    // Ensure JWT secret exists
    const jwtSec = process.env.JWT_SECRET;
    if (!jwtSec) {
      console.log("No JWT secret found!");
      return res.status(500).json({ message: "Server config error" });
    }

    // Check user
    let user = await User.findOne({ id: payload.sub });

    if (!user) {
      user = await User.create({
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        profile: payload.picture,
      });
      console.log("Created new user:", user);
    }

    //Generate JWT
    const jwtToken = jwt.sign(
      {
        id: user.id,
      },
      jwtSec,
      { expiresIn: "7d" }
    );

    //  Send cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "success" });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Invalid token" });
  }
}

export default googleVerify;
