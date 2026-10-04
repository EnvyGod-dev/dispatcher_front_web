export const formatDuration = (start: string, end: string | null) => {
  if (!end) return '—';

  const duration = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
};
