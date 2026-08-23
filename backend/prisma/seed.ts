const { PrismaClient, Role, Category, Status, Priority } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const residentPassword = await bcrypt.hash('Resident@123', 10);

  // 2. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@societyfix.demo' },
    update: {},
    create: {
      name: 'Society Admin',
      email: 'admin@societyfix.demo',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user created.');

  // 3. Create 3 Resident Users
  const residents = [];
  for (let i = 1; i <= 3; i++) {
    const resident = await prisma.user.upsert({
      where: { email: `resident${i}@societyfix.demo` },
      update: {},
      create: {
        name: `Resident ${i}`,
        email: `resident${i}@societyfix.demo`,
        passwordHash: residentPassword,
        role: Role.RESIDENT,
        apartmentNumber: `${i}0${i}`,
        block: 'A',
      },
    });
    residents.push(resident);
  }
  console.log('✅ Resident users created.');

  // 4. Create Notices (2 important, 3 normal)
  const notices = [
    { title: 'Water Supply Interruption', content: 'Water supply will be stopped on Tuesday from 2 PM to 5 PM for maintenance.', isImportant: true },
    { title: 'Annual General Meeting', content: 'The AGM will be held on the 15th of next month.', isImportant: true },
    { title: 'Yoga Classes Starting', content: 'Morning yoga classes start next week at the clubhouse.', isImportant: false },
    { title: 'Car Cleaning Service', content: 'New vendors for car cleaning are available.', isImportant: false },
    { title: 'Pest Control Schedule', content: 'Quarterly pest control is scheduled for this weekend.', isImportant: false },
  ];

  for (const notice of notices) {
    await prisma.notice.create({
      data: { ...notice, createdById: admin.id },
    });
  }
  console.log('✅ Notices created.');

  // 5. Create 10 Complaints with History
  const categories = Object.values(Category);
  
  for (let i = 0; i < 10; i++) {
    const isResolved = i % 3 === 0;
    const currentStatus = isResolved ? Status.RESOLVED : (i % 2 === 0 ? Status.IN_PROGRESS : Status.OPEN);
    const priority = i % 4 === 0 ? Priority.HIGH : (i % 2 === 0 ? Priority.MEDIUM : Priority.LOW);
    
    // Create complaint
    const complaint = await prisma.complaint.create({
      data: {
        title: `Sample Complaint ${i + 1}`,
        description: `This is a detailed description for complaint ${i + 1}.`,
        category: categories[i % categories.length],
        status: currentStatus,
        priority: priority,
        residentId: residents[i % residents.length].id,
        resolvedAt: isResolved ? new Date() : null,
      },
    });

    // Create history: OPEN
    await prisma.complaintHistory.create({
      data: {
        complaintId: complaint.id,
        newStatus: Status.OPEN,
        actorId: residents[i % residents.length].id,
        note: 'Complaint raised by resident.',
      },
    });

    // Create history if IN_PROGRESS or RESOLVED
    if (currentStatus === Status.IN_PROGRESS || currentStatus === Status.RESOLVED) {
      await prisma.complaintHistory.create({
        data: {
          complaintId: complaint.id,
          oldStatus: Status.OPEN,
          newStatus: Status.IN_PROGRESS,
          actorId: admin.id,
          note: 'Assigned to technician.',
        },
      });
    }

    if (currentStatus === Status.RESOLVED) {
      await prisma.complaintHistory.create({
        data: {
          complaintId: complaint.id,
          oldStatus: Status.IN_PROGRESS,
          newStatus: Status.RESOLVED,
          actorId: admin.id,
          note: 'Issue fixed successfully.',
        },
      });
    }
  }
  console.log('✅ 10 Complaints and their history records created.');
  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });