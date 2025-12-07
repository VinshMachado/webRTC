import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  // Make sure cookie-parser is used
  const token = req.cookies?.token; // note: cookies, not cookie

  if (!token) {
    return res.status(401).json({ message: "Not signed in" });
  }

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET); // spelling: SECRET

    // attach user data to request for future use
    req.user = data;

    next(); // call next middleware/route
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
