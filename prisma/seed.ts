import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "parola123";

async function main() {
  console.log("Seed başlıyor...");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ---------- Departmanlar ----------
  const departmentsData = [
    { name: "Muhasebe", code: "MUH" },
    { name: "İş Geliştirme", code: "ISG" },
    { name: "Pazarlama", code: "PZR" },
    { name: "Satış", code: "SAT" },
    { name: "Bilgi Teknolojileri", code: "BT" },
    { name: "İnsan Kaynakları", code: "IK" },
  ];

  const departments: Record<string, string> = {};
  for (const d of departmentsData) {
    const dep = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: d,
    });
    departments[d.code] = dep.id;
  }

  // ---------- Kullanıcılar ----------
  const usersData = [
    {
      name: "Begüm Yargıç",
      email: "begum@sirket.com",
      role: "EMPLOYEE" as const,
      title: "Satış Uzmanı",
      departmentCode: "SAT",
    },
    {
      name: "Deniz Muhasebe",
      email: "muhasebe@sirket.com",
      role: "ACCOUNTING" as const,
      title: "Muhasebe Uzmanı",
      departmentCode: "MUH",
    },
    {
      name: "Selin Akgün",
      email: "selin@sirket.com",
      role: "APPROVER" as const,
      title: "İş Geliştirme Müdürü",
      departmentCode: "ISG",
    },
    {
      name: "Kaan Demir",
      email: "kaan@sirket.com",
      role: "APPROVER" as const,
      title: "Pazarlama Müdürü",
      departmentCode: "PZR",
    },
    {
      name: "Ege Çalışan",
      email: "ege@sirket.com",
      role: "EMPLOYEE" as const,
      title: "İş Geliştirme Uzmanı",
      departmentCode: "ISG",
    },
    {
      name: "Sistem Yöneticisi",
      email: "admin@sirket.com",
      role: "ADMIN" as const,
      title: "Yönetici",
      departmentCode: "BT",
    },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        title: u.title,
        departmentId: departments[u.departmentCode],
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        title: u.title,
        departmentId: departments[u.departmentCode],
      },
    });
  }

  console.log("Seed tamamlandı.");
  console.log("---------------------------------------------");
  console.log("Örnek giriş bilgileri (parola: " + DEFAULT_PASSWORD + "):");
  usersData.forEach((u) =>
    console.log(`  ${u.role.padEnd(11)} ${u.email}`),
  );
  console.log("---------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
