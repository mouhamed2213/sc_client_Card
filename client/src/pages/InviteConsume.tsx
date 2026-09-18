import { useEffect } from "react";
import { useParams } from "wouter";
import { startLogin } from "@/const";
import ClientSplash from "@/components/client-space/ClientSplash";

export default function InviteConsume() {
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    if (!token) return;
    startLogin({ invitationToken: token });
  }, [token]);

  return <ClientSplash label="Activation de votre invitation…" />;
}
