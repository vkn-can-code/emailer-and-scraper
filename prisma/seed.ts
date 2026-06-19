import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // 1. Create a dummy User
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      // WARNING: In a real application, you should hash this password (e.g., using bcrypt)
      passwordHash: 'admin123',
      role: 'ADMIN',
    },
  })
  console.log(`Created user with id: ${adminUser.id}`)

  // 2. Create some dummy Channels linked to the User
  const channel1 = await prisma.channel.create({
    data: {
      name: 'Tech Innovators',
      handle: '@techinnovators',
      subscriberCount: '150000',
      viewCount: '2500000',
      videoCount: '120',
      leadScore: 85,
      tier: 'A',
      email: 'hello@techinnovators.com',
      status: 'pending',
      userId: adminUser.id, // Linking to the created user
    },
  })
  
  const channel2 = await prisma.channel.create({
    data: {
      name: 'Daily Coding',
      handle: '@dailycoding',
      subscriberCount: '45000',
      viewCount: '800000',
      videoCount: '340',
      leadScore: 60,
      tier: 'B',
      status: 'pending',
      userId: adminUser.id,
    },
  })

  console.log(`Created channels: ${channel1.name}, ${channel2.name}`)
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
