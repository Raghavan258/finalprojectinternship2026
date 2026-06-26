// Quick DB check script — counts events and shows categories
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

try {
  const count = await db.event.count();
  console.log(`Total events in DB: ${count}`);

  if (count > 0) {
    const events = await db.event.findMany({
      select: { id: true, title: true, category: true, categoryLabel: true, location: true },
    });
    console.log("\nEvents found:");
    events.forEach((e) =>
      console.log(`  [${e.category}] ${e.title} — ${e.location}`)
    );
  } else {
    console.log("No events in DB. The database is empty.");
  }
} catch (err) {
  console.error("DB connection error:", err.message);
} finally {
  await db.$disconnect();
}
