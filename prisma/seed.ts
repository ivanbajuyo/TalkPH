import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const defaultCategories = [
  {
    name: 'General Discussion',
    slug: 'general-discussion',
    description: 'Talk about anything and everything under the Philippine sun',
    iconName: 'MessageCircle',
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Discuss schools, universities, scholarships, and educational topics',
    iconName: 'GraduationCap',
  },
  {
    name: 'Jobs & Career',
    slug: 'jobs-career',
    description: 'Job opportunities, career advice, and professional development',
    iconName: 'Briefcase',
  },
  {
    name: 'Government Services',
    slug: 'government-services',
    description: 'Discuss government programs, agencies, and public services',
    iconName: 'Building2',
  },
  {
    name: 'Politics & Public Issues',
    slug: 'politics-public-issues',
    description: 'Political discussions and public policy debates',
    iconName: 'Landmark',
  },
  {
    name: 'Transportation',
    slug: 'transportation',
    description: 'Commute experiences, traffic, and transportation issues',
    iconName: 'Bus',
  },
  {
    name: 'Health & Healthcare',
    slug: 'health-healthcare',
    description: 'Health concerns, medical facilities, and wellness topics',
    iconName: 'Heart',
  },
  {
    name: 'Business & Entrepreneurship',
    slug: 'business-entrepreneurship',
    description: 'Business ideas, startups, and entrepreneurship in the Philippines',
    iconName: 'TrendingUp',
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Tech news, gadgets, and digital innovation',
    iconName: 'Cpu',
  },
  {
    name: 'Environment & Disaster Preparedness',
    slug: 'environment-disaster',
    description: 'Environmental issues and disaster readiness discussions',
    iconName: 'Leaf',
  },
  {
    name: 'Barangay / Local Community',
    slug: 'barangay-local-community',
    description: 'Local community concerns and barangay matters',
    iconName: 'Home',
  },
  {
    name: 'Student Life',
    slug: 'student-life',
    description: 'Student experiences, tips, and campus life',
    iconName: 'BookOpen',
  },
  {
    name: 'OFW / Overseas Filipino Topics',
    slug: 'ofw-overseas',
    description: 'Stories and concerns of Overseas Filipino Workers',
    iconName: 'Plane',
  },
  {
    name: 'Family & Relationships',
    slug: 'family-relationships',
    description: 'Family matters, parenting, and relationship advice',
    iconName: 'Users',
  },
  {
    name: 'Entertainment / Pop Culture',
    slug: 'entertainment-pop-culture',
    description: 'Movies, music, shows, and Filipino pop culture',
    iconName: 'Music',
  },
  {
    name: 'Buy & Sell Tips',
    slug: 'buy-sell-tips',
    description: 'Buying and selling advice, marketplace tips',
    iconName: 'ShoppingBag',
  },
  {
    name: 'Suggestions for National Improvement',
    slug: 'national-improvement',
    description: 'Ideas and suggestions to improve our nation',
    iconName: 'Lightbulb',
  },
];

async function main() {
  console.log('Starting seed...');

  // Seed categories
  for (const category of defaultCategories) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    if (!existing) {
      await prisma.category.create({
        data: category,
      });
      console.log(`Created category: ${category.name}`);
    } else {
      console.log(`Category already exists: ${category.name}`);
    }
  }

  // Hash default password
  const defaultPassword = await hash('password123', 10);

  // Create admin user if not exists
  const adminEmail = 'admin@phopenforum.com';
  const existingAdmin = await prisma.profile.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.profile.create({
      data: {
        email: adminEmail,
        username: 'admin',
        displayName: 'Administrator',
        password: defaultPassword,
        role: 'admin',
        isVerified: true,
        bio: 'Platform Administrator',
      },
    });
    console.log('Created admin user');
  } else {
    // Update admin password if needed
    await prisma.profile.update({
      where: { email: adminEmail },
      data: { password: defaultPassword },
    });
    console.log('Updated admin password');
  }

  // Create demo users
  const demoUsers = [
    {
      email: 'juan@example.com',
      username: 'juan_dela_cruz',
      displayName: 'Juan Dela Cruz',
      bio: 'Proud Filipino 🇵🇭',
      region: 'NCR',
      province: 'Metro Manila',
      city: 'Quezon City',
    },
    {
      email: 'maria@example.com',
      username: 'maria_santos',
      displayName: 'Maria Santos',
      bio: 'Teacher and community advocate',
      region: 'Region IV-A',
      province: 'Laguna',
      city: 'Los Baños',
    },
    {
      email: 'pedro@example.com',
      username: 'pedro_reyes',
      displayName: 'Pedro Reyes',
      bio: 'OFW from Dubai',
      region: 'Region III',
      province: 'Pampanga',
      city: 'Angeles City',
    },
  ];

  for (const demoUser of demoUsers) {
    const existing = await prisma.profile.findUnique({
      where: { email: demoUser.email },
    });

    if (!existing) {
      await prisma.profile.create({
        data: {
          ...demoUser,
          password: defaultPassword,
        },
      });
      console.log(`Created demo user: ${demoUser.displayName}`);
    }
  }

  console.log('Seed completed!');
  console.log('\n📋 Test Accounts (Password: password123):');
  console.log('  - admin@phopenforum.com (Admin)');
  console.log('  - juan@example.com (User)');
  console.log('  - maria@example.com (User)');
  console.log('  - pedro@example.com (User)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
