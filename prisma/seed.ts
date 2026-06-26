import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as vm from "vm";

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(process.cwd(), "assets/js/events-data.js");
  console.log(`Reading events data from ${filePath}`);
  let fileContent = fs.readFileSync(filePath, "utf-8");
  
  // Replace 'const mockEvents =' with 'mockEvents =' so it attaches to sandbox context
  fileContent = fileContent.replace("const mockEvents =", "mockEvents =");

  const sandbox = { mockEvents: [] as any[] };
  vm.createContext(sandbox);
  vm.runInContext(fileContent + "\n", sandbox);
  const events = sandbox.mockEvents;

  console.log(`Loaded ${events.length} events from events-data.js`);

  // Clear existing data
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Seed events
  for (const event of events) {
    await prisma.event.create({
      data: {
        title: event.title,
        category: event.category,
        categoryLabel: event.categoryLabel,
        date: event.date,
        location: event.location,
        format: event.format,
        price: event.price,
        priceAmount: event.priceAmount,
        organizer: event.organizer,
        icon: event.icon,
        color: event.color,
        bgColor: event.bgColor,
        description: event.description,
        prizes: event.prizes,
        registrationsCount: event.registrationsCount || 0,
        viewsCount: event.viewsCount || 0,
        daysLeft: event.daysLeft || 0,
        teamSize: event.teamSize || "Individual",
        featured: event.featured || false,
        timeline: event.timeline || [],
        schedule: event.schedule || [],
        speakers: event.speakers || [],
        sponsors: event.sponsors || [],
      },
    });
  }
  console.log("Seeded database successfully with all mock events!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
