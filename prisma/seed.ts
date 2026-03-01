import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const passwordHash = await hash("password123", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@voicemail.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@voicemail.com",
      passwordHash,
      emailProvider: "smtp",
      emailAddress: "demo@voicemail.com",
      smtpHost: "smtp.example.com",
      smtpPort: 587,
      smtpUser: "demo@voicemail.com",
      smtpPass: "mock-encrypted-password",
      smtpSecure: false,
      emailVerified: true,
      onboardingComplete: true,
    },
  });

  console.log(`Created demo user: ${demoUser.email}`);

  // Create audience lists
  const newsletterList = await prisma.audienceList.create({
    data: {
      userId: demoUser.id,
      name: "Newsletter Subscribers",
      description: "Monthly newsletter recipients",
      contacts: {
        create: [
          { email: "alice@example.com", firstName: "Alice", lastName: "Johnson" },
          { email: "bob@example.com", firstName: "Bob", lastName: "Smith" },
          { email: "carol@example.com", firstName: "Carol", lastName: "Williams" },
          { email: "david@example.com", firstName: "David", lastName: "Brown" },
          { email: "eve@example.com", firstName: "Eve", lastName: "Davis" },
        ],
      },
    },
  });

  console.log(`Created audience list: ${newsletterList.name} (5 contacts)`);

  const betaList = await prisma.audienceList.create({
    data: {
      userId: demoUser.id,
      name: "Beta Testers",
      description: "Product beta testing group",
      contacts: {
        create: [
          { email: "frank@example.com", firstName: "Frank", lastName: "Miller" },
          { email: "grace@example.com", firstName: "Grace", lastName: "Wilson" },
          { email: "hank@example.com", firstName: "Hank", lastName: "Moore" },
          { email: "iris@example.com", firstName: "Iris", lastName: "Taylor" },
          { email: "jack@example.com", firstName: "Jack", lastName: "Anderson" },
        ],
      },
    },
  });

  console.log(`Created audience list: ${betaList.name} (5 contacts)`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
