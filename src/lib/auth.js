// JWT 相關功能
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export const getAuthUser = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  
  if (!token) return null;
  
  const decoded = verifyToken(token.value);
  if (!decoded) return null;
  
  return decoded;
};