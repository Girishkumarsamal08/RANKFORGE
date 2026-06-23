/**
 * Formats a duration in seconds to MM:SS or HH:MM:SS format.
 * @param totalSeconds The total duration in seconds.
 */
export function formatTime(totalSeconds: number): string {
  if (totalSeconds < 0) return '00:00';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const pad = (num: number) => String(num).padStart(2, '0');
  
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  
  return `${pad(minutes)}:${pad(seconds)}`;
}
