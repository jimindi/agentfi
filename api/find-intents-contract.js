require('dotenv').config();

console.log("NEAR Intents Contract Search:");
console.log("=============================\n");

console.log("Known contracts from documentation:");
console.log("1. intents.near - Empty account (not the contract)");
console.log("2. v1.intents.near - Possible versioned contract");
console.log("3. defuse.near - Main Defuse protocol contract");
console.log("\nLet's check the Defuse documentation for the correct contract address.");
console.log("\nFrom docs: https://docs.near-intents.org/");
console.log("The execute_intents method should be on the Defuse solver contract.");
