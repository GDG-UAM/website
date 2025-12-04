import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const getSession = async () => await getServerSession(authOptions);
