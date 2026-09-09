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
      },
      {
        title: "Cache System",
        description: "Design an in-memory caching system with a Least Recently Used (LRU) eviction policy.",
        requirements: [
          "Should support get() and put() operations in O(1) time.",
          "Should have a fixed capacity.",
          "When capacity is reached, it should evict the least recently used item.",
          "Should support a generic type for keys and values.",
          "Should be thread-safe for concurrent access."
        ],
        constraints: [
          "Concurrency: Multiple threads can read and write simultaneously.",
          "Performance: High throughput, minimal latency."
        ]
      },
      {
        title: "Movie Ticket Booking System",
        description: "Design a system to browse movies, select seats, and book tickets.",
        requirements: [
          "System should have multiple cities, cinemas, and screens.",
          "Users can browse movies by city and time.",
          "Users can select seats and hold them temporarily (seat lock) while making a payment.",
          "Payment processing should be integrated.",
          "Support for different seat types (Silver, Gold, Platinum)."
        ],
        constraints: [
          "Concurrency: Handle multiple users trying to book the same seat simultaneously without double booking.",
          "ACID: Transactionality during booking and payment."
        ]
      },
      {
        title: "Library Management System",
        description: "Design a system for managing books, members, and borrowing processes in a library.",
        requirements: [
          "System should have books, members, and librarians.",
          "A book can have multiple copies (book items).",
          "Members can search for books by title, author, or category.",
          "Members can borrow, reserve, and return books.",
          "The system should calculate fines for overdue books."
        ],
        constraints: [
          "State Management: Book states (Available, Reserved, Loaned, Lost).",
          "Scale: Tens of thousands of books and members."
        ]
      },
      {
        title: "Chess Game",
        description: "Design an object-oriented model for a 2-player chess game.",
        requirements: [
          "Board should be 8x8.",
          "Different piece types (Pawn, Knight, Bishop, Rook, Queen, King) with specific move rules.",
          "System should detect valid moves, checks, checkmates, and stalemates.",
          "Support for special moves like castling, en passant, and pawn promotion.",
          "Game flow: Players take alternating turns, with time limits."
        ],
        constraints: [
          "Extensibility: Easy to add new variants (e.g. different board sizes, new pieces).",
          "Performance: Efficient calculation of all valid moves in a given position."
        ]
      },
      {
        title: "E-commerce System",
        description: "Design the core shopping flow for an e-commerce platform.",
        requirements: [
          "Users can browse products, add to cart, and checkout.",
          "Products have categories, prices, and reviews.",
          "Inventory management should track stock levels.",
          "System supports multiple payment methods and shipping options.",
          "Order tracking from placement to delivery."
        ],
        constraints: [
          "Scalability: Millions of products and users.",
          "Consistency: Inventory should be updated consistently (no overselling)."
        ]
      },
      {
        title: "Tic-Tac-Toe Game",
        description: "Design a flexible Tic-Tac-Toe game.",
        requirements: [
          "Support a customizable board size (N x N) and winning condition (M symbols in a row).",
          "Two players take turns placing their symbol (X or O).",
          "The system should declare a winner or a draw when the game ends.",
          "Support undo feature.",
          "Support bot players with basic AI."
        ],
        constraints: [
          "Performance: Winning condition check should be O(1) or O(N).",
          "Extensibility: Easy to change rules or add more players."
        ]
      },
      {
        title: "Food Delivery System",
        description: "Design a food delivery system that connects customers, restaurants, and delivery partners.",
        requirements: [
          "Customers can search for restaurants and view menus.",
          "Customers can place orders and track their delivery status in real-time.",
          "Restaurants can accept/reject orders and update preparation status.",
          "System assigns available delivery partners to orders efficiently.",
          "System handles payments and rating/reviews."
        ],
        constraints: [
          "Real-time: Live tracking of delivery partners via GPS.",
          "Scale: High volume of concurrent orders during peak hours."
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
