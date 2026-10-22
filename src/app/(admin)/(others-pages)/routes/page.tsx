import { redirect } from 'next/navigation';

/** Маршрут овоолгын хуудасны таб руу шилжсэн. */
export default function RoutesPage() {
  redirect('/stockpiles?tab=routes');
}
