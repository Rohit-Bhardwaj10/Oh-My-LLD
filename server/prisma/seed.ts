import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding problems...");
  
  await prisma.problem.createMany({
    data: [
      {
        title: "Parking Lot",
        description: "Design a multi-floor parking lot system.",
        requirements: [
          "The parking lot should have multiple floors.",
          "Each floor should have multiple spots of different types (compact, large, handicapped, motorcycle).",
          "The system should support different types of vehicles (car, truck, van, motorcycle).",
          "The system should calculate the fee based on the duration of parking and the vehicle type.",
          "The system should allow entry and exit of vehicles."
        ],
        constraints: [
          "Concurrency: Handle multiple vehicles entering/exiting simultaneously.",
          "Scale: Thousands of spots, tens of thousands of transactions per day."
        ]
      },
      {
        title: "Elevator System",
        description: "Design an elevator system for a high-rise building.",
        requirements: [
          "The building has multiple floors and multiple elevators.",
          "Elevators can be requested from any floor.",
          "Users can select the destination floor once inside the elevator.",
          "The system should use an efficient scheduling algorithm (like SCAN) to minimize wait times.",
          "The doors should open and close automatically, with safety sensors."
        ],
        constraints: [
          "Concurrency: Handle multiple requests simultaneously.",
          "Real-time: The state machine for the doors and movement must be responsive."
        ]
      },
      {
        title: "Vending Machine",
        description: "Design a software system for a physical vending machine.",
        requirements: [
          "The vending machine has multiple items with different prices and quantities.",
          "It accepts different denominations of money (coins and notes).",
          "It dispenses the selected item if sufficient money is provided and the item is in stock.",
          "It returns the correct change if excess money is provided.",
          "It handles scenarios like out-of-stock items or insufficient funds."
        ],
        constraints: [
          "State Machine: Clear states (Idle, HasMoney, Dispensing, ReturnChange).",
          "Transactionality: Payment and dispensing must be atomic."
        ]
      }
    ],
    skipDuplicates: true
  });
  
  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
