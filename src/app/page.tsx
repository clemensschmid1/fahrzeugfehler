import { redirect } from 'next/navigation';
import Image from "next/image";

export default function Home() {
  // Redirect to /knowledge, letting the middleware handle the language prefix
  redirect('/knowledge');
}
