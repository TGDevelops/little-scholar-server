import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';

async function main(): Promise<void> {
  const email = 'demo@littlescholar.local';
  const passwordHash = await bcrypt.hash('Password123!', 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash
    }
  });

  console.log(`Seeded demo user: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
