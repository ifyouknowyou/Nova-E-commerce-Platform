import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://nova:nova_dev_password@localhost:5432/nova_commerce?schema=public'
});

async function main() {
  const hash = await argon2.hash('NovaAdmin241!', { type: argon2.argon2id });
  await prisma.user.update({
    where: { email: 'admin@nova-commerce.local' },
    data: { passwordHash: hash }
  });
  console.log('Admin password reset OK');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
