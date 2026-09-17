import { useEffect } from "react";
import { useParams } from "wouter";
import { startLogin } from "@/const";

export default function InviteConsume() {
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    if (!token) return;
    startLogin({ invitationToken: token });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <p className="text-sm text-slate-300">Connexion à votre espace client…</p>
    </div>
  );
}