import { RecurrenceType, RecurrenceConfig } from "@/components/tasks/taskData";

export function calculateNextDueDate(currentDateStr: string, type: RecurrenceType, config?: RecurrenceConfig): string {
  const current = new Date(currentDateStr);
  if (isNaN(current.getTime())) return new Date().toISOString().split("T")[0];

  const next = new Date(current);

  switch (type) {
    case "diaria":
      next.setDate(current.getDate() + 1);
      break;
    
    case "semanal":
      const days = config?.week_days || [];
      if (days.length === 0) {
        next.setDate(current.getDate() + 7);
      } else {
        // Find next day in the list
        let found = false;
        for (let i = 1; i <= 7; i++) {
          const check = new Date(current);
          check.setDate(current.getDate() + i);
          if (days.includes(check.getDay())) {
            next.setTime(check.getTime());
            found = true;
            break;
          }
        }
        if (!found) next.setDate(current.getDate() + 7);
      }
      break;

    case "mensal":
      const targetDay = config?.month_day || current.getDate();
      next.setMonth(current.getMonth() + 1);
      next.setDate(targetDay);
      // Handle edge case where next month doesn't have that day (e.g. Jan 31 -> Feb 28)
      if (next.getDate() !== targetDay) {
        next.setDate(0); // Last day of previous month
      }
      break;

    case "personalizada":
      const interval = config?.interval_days || 7;
      next.setDate(current.getDate() + interval);
      break;

    default:
      next.setDate(current.getDate() + 7);
  }

  return next.toISOString().split("T")[0];
}
