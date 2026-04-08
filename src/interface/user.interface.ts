// create interface for user

interface User {
 id: string; // Hoặc _id nếu bạn dùng MongoDB
  email: string;
  password: string;
  isVerified: boolean;
  refreshToken?: string; // Dấu ? nghĩa là có thể có hoặc không (optional)
  createdAt: Date;
  updatedAt: Date;
}

export default User;