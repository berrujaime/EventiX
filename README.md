# EventiX

**EventiX** is an experimental blockchain project built with Hardhat and Solidity. I'm using this project to learn and apply core blockchain concepts while building a decentralized event ticketing system.

## Overview

EventiX will enable the creation, sale, and validation of event tickets represented as NFTs. Each ticket NFT will carry metadata such as:
- **Maximum resale price**
- **Resell permissions**
- **Event date & time**
- **Location**
- **Validation status**

The system will support multiple validation modes:
- **Real-time Validation:** The client signs a transaction to generate a QR code valid for a short period of time.
- **Pre-generated QR:** A QR code is generated 1 hour before the event and remains unchanged.
- **Backend Validation:** No wallet signature is needed; validation occurs via the backend.

Additionally, the platform will include:
- **Client Interface:** Purchase tickets using personal wallets or via an account abstraction ecosystem and access a resale marketplace.
- **Administrator Interface:** Create events and manage associated NFT tickets.
- **Validator Interface:** Validate tickets (with organizer-granted permission).

The long-term vision is to offer an open-source infrastructure for event management and ticketing on Ethereum rollup networks (e.g., Arbitrum or zkSync).

## Future Features

- **NFT Ticketing:** Mint event tickets as NFTs with built-in resale and validation rules.
- **Multi-mode Ticket Validation:** Supports on-demand, pre-generated, and backend validation methods.
- **Role-Based Interfaces:** Separate portals for clients, administrators, and validators.
- **Marketplace Integration:** Facilitate ticket resales under defined constraints.
- **Scalable Deployment:** Aiming for deployment on Ethereum rollup networks to leverage scalability and lower transaction fees.

## Project Structure

- **contracts/**: Solidity smart contracts.
- **scripts/**: Deployment and utility scripts.
- **test/**: Automated tests using Hardhat.

## Getting Started

### Prerequisites

- Node.js (>=22.x)
- npm or yarn

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/EventiX.git
cd EventiX
npm install
```

### Running Tests

Execute the tests with:

```bash
npx hardhat test
```

### Deployment

Customize the deployment script in `scripts/deploy.js` and deploy to your chosen network:

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

## Learning Objectives

This project is a hands-on exploration into:
- **Blockchain Development:** Solidity, Hardhat, and NFT standards.
- **Decentralized Application Architecture:** Integrating on-chain logic with off-chain interfaces.
- **Advanced Validation Techniques:** Experimenting with real-time and pre-generated QR validations.

## Contributing

Contributions, feedback, and ideas are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
