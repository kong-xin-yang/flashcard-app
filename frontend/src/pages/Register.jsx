import { useState } from "react";
import { supabase } from "../services/supabase";
import { Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/login",
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    if (!data.session) {
      setMessage("Check your email to confirm your account.");
      return;
    }

    window.location.href = "/";
  };

  return (
    <form onSubmit={submit} className="p-6 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Register</h1>

      <input
        className="border p-2 w-full mb-3"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2 w-full mb-3"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {message && <div className="text-green-700 text-sm">{message}</div>}

      <button className="bg-black text-white p-2 w-full">Register</button>

      <Link to="/login" className="text-sm underline block mt-2">
        Login
      </Link>
    </form>
  );
}
