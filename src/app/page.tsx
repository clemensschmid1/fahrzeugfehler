import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to English version by default
  redirect('/en');
}
