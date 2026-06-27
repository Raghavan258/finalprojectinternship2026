export function calculateDaysLeft(dateStr: string): number {
  if (!dateStr) return 0;
  
  const eventDate = new Date(dateStr);
  const today = new Date();
  
  // Set times to midnight to calculate pure day differences
  eventDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}
