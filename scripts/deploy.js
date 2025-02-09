const { ethers } = require("hardhat");

async function main() {
    const EventiX = await ethers.getContractFactory("EventiXTickets");
    const eventiX = await EventiX.deploy();

    await eventiX.waitForDeployment();
    console.log("Contract deployed to:", eventiX.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
