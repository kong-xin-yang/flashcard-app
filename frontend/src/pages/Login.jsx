import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    nav("/");
  };

  return (
    <form onSubmit={submit} className="p-6 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Login</h1>

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

      <button className="bg-black text-white p-2 w-full">Login</button>

      <Link to="/register" className="text-sm underline block mt-2">
        Register
      </Link>
    </form>
  );
}
