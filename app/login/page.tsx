"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/useTheme";
import { authenticateUser } from "@/lib/users";
import { Moon, Sun } from "lucide-react";

export default function LoginPage({ onLogin }: { onLogin?: (username: string) => void }) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const { isDarkMode, toggleDarkMode, mounted } = useTheme();

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		const user = authenticateUser(username, password);
		if (user) {
			setError("");
			if (onLogin) onLogin(user.username);
			if (typeof window !== "undefined") {
				localStorage.setItem("chatbot-username", user.username);
				// Do NOT overwrite theme here, just keep what user chose
				window.location.href = "/";
			}
		} else {
			setError("Invalid username or password");
		}
	};

	return (
		<div
			className="flex flex-col h-screen items-center justify-center transition-colors duration-300 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
		>
			<div className="absolute top-4 right-4">
				<Button
					onClick={toggleDarkMode}
					variant="ghost"
					size="icon"
					className="rounded-full transition-colors duration-300 hover:bg-gray-100 text-gray-600 hover:text-gray-900 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
					title={isDarkMode ? "Light Mode" : "Dark Mode"}
				>
					{mounted && (isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />)}
				</Button>
			</div>
			<form
				onSubmit={handleLogin}
				className="w-full max-w-sm rounded-xl shadow-lg p-8 flex flex-col gap-4 border transition-colors duration-300 bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
			>
				<h2 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-gray-100">
					Login
				</h2>
				<Input
					placeholder="Username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className="border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
				/>
				<Input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
				/>
				{error && <div className="text-red-500 text-sm text-center">{error}</div>}
				<Button
					type="submit"
					className="w-full font-semibold py-2 rounded-xl transition-colors duration-200 bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
				>
					Login
				</Button>
			</form>
		</div>
	);
}
