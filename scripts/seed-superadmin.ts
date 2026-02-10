import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'pkumarchhatri@gmail.com';
  const password = 'Prashant@123';

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.deleteMany({ where: { email } });

  await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
