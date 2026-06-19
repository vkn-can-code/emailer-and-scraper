import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting admin data seed...');

  try {
    // Upsert ensures that if the admin already exists, we do nothing.
    // If it doesn't exist, we create it.
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        passwordHash: 'admin123', // REMINDER: Make sure to hash this in a real application!
        role: 'ADMIN',
      },
    });

    console.log(`Successfully seeded admin user with ID: ${adminUser.id}`);
    
    // Disconnect before attempting to delete the file
    await prisma.$disconnect();

    // Self-destruct mechanism
    const scriptPath = __filename;
    console.log(`Self-destruct sequence initiated... Deleting ${scriptPath}`);
    
    // Remove this very file from the file system
    fs.unlinkSync(scriptPath);
    
    console.log('💥 Script self-destructed successfully.');

  } catch (error) {
    console.error('Error seeding admin user:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
