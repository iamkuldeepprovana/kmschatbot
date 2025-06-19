export interface User {
  username: string;
  password: string;
}

export const USERS: User[] = [
  { username: "Messerli", password: "Messerli123" },
  { username: "Gurstel", password: "Gurstel123" },
  { username: "Weltman", password: "Weltman123" },
  { username: "Smith", password: "smith123" },
  { username: "Pressler", password: "pressler123" },
];

export function authenticateUser(username: string, password: string): User | null {
  return USERS.find(
    (u) => u.username === username && u.password === password
  ) || null;
}
