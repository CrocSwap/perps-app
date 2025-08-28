# Perps Trading Application - Agent Introduction Guide

## Overview

This is a perpetual futures (perps) trading application that provides a web interface for trading cryptocurrency derivatives. The app connects to Hyperliquid's decentralized exchange infrastructure and provides professional trading features including real-time order books, charts, position management, and order execution.

## Core Functionality

- **Trading Interface**: Buy/sell perpetual futures contracts with leverage
- **Real-time Market Data**: Live order books, trades, price charts, and market statistics
- **Position Management**: Track open positions, P&L, margin requirements
- **Order Management**: Place, modify, and cancel limit/market orders
- **Portfolio Overview**: Account balances, funding history, trade history
- **Multi-asset Support**: Trade multiple cryptocurrency pairs (BTC, ETH, etc.)

## Tech Stack

### Frontend

- **Framework**: Remix (React-based full-stack framework)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **State Management**: Zustand stores
- **Charts**: Lightweight Charts (TradingView library)
- **Real-time Data**: WebSocket connections with worker-based JSON parsing
- **UI Components**: Custom component library with Radix UI primitives
- **Animation**: Framer Motion

### Backend/SDK

- **WebSocket Management**: Custom SDK with multi-socket architecture
- **API Integration**: Hyperliquid REST and WebSocket APIs
- **Authentication**: Fogo Sessions SDK with wallet signatures
- **Web3**: ethers.js for blockchain interactions

### Build Tools

- **Bundler**: Vite
- **Package Manager**: npm/yarn with workspace configuration
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier, TypeScript

## Directory Structure

```
perps-app/
├── packages/
│   ├── frontend/           # Main web application
│   │   ├── app/
│   │   │   ├── routes/     # Remix routes (pages)
│   │   │   │   ├── trade/  # Main trading interface
│   │   │   │   ├── earn/   # Vaults/earning features
│   │   │   │   └── portfolio/ # Portfolio management
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   ├── stores/     # Zustand state stores
│   │   │   ├── utils/      # Utility functions
│   │   │   └── processors/ # Data processing logic
│   │   └── public/         # Static assets
│   │
│   └── sdk/                # WebSocket/API SDK
│       └── src/
│           ├── websocket-instance.ts  # Core WebSocket handler
│           ├── websocket-pool.ts      # Multi-socket manager
│           ├── info.ts                # Main SDK interface
│           └── utils/                 # SDK utilities
│
├── prompts/                # Documentation for AI agents
└── config files...         # Various configuration files
```

## Architectural Patterns

### 1. Multi-Socket Architecture

The app uses separate WebSocket connections for market data and user-specific data:

- **Market Socket**: Public data (order books, trades, candles, market stats)
- **User Socket**: Private data (positions, orders, fills, balances)

This separation allows for:

- Different endpoints for different data types
- Better scalability and performance
- Cleaner data flow management

### 2. Worker-Based Message Processing

WebSocket messages are processed in Web Workers to prevent blocking the main thread:

- JSON parsing happens off the main thread
- Multiple workers handle messages in parallel
- Improves UI responsiveness during high-frequency updates

### 3. Component-Store Pattern

- **Components**: React components for UI rendering
- **Stores**: Zustand stores for state management
- **Processors**: Pure functions for data transformation
- Clear separation of concerns between UI and business logic

### 4. Real-time Subscription Model

- Components subscribe to specific data channels
- WebSocket manager handles subscription lifecycle
- Automatic reconnection and resubscription on disconnect

## Data Flow Model

```
[Hyperliquid API]
    ↓ WebSocket
[SDK WebSocket Instances]
    ↓ Worker Processing
[Message Handlers]
    ↓ Processors
[Zustand Stores]
    ↓ React
[UI Components]
```

1. **Data Ingestion**: WebSocket connections receive real-time market and user data
2. **Processing**: Workers parse JSON, processors transform data into app-specific formats
3. **State Management**: Zustand stores maintain application state
4. **UI Updates**: React components subscribe to store changes and re-render

## Key Core Components

### SDK (`packages/sdk/`)

- **WebSocketInstance**: Handles individual WebSocket connections, subscriptions, reconnection logic
- **WebSocketPool**: Manages multiple WebSocket instances, routes subscriptions to appropriate sockets
- **Info**: Main SDK interface that applications interact with

### Trading Interface (`packages/frontend/app/routes/trade/`)

- **OrderBook**: Real-time order book display with price aggregation
- **TradingChart**: Candlestick charts with technical indicators
- **OrderEntry**: Form for placing buy/sell orders
- **PositionsTable**: Active positions with P&L tracking
- **WebDataConsumer**: Orchestrates WebSocket subscriptions for market/user data

### State Management (`packages/frontend/app/stores/`)

- **TradeDataStore**: Market data, symbols, order books
- **UserDataStore**: User authentication, wallet connection
- **OrderBookStore**: Order book state and updates
- **PositionsStore**: User positions and P&L

### Hooks (`packages/frontend/app/hooks/`)

- **useSdk**: Provides SDK instance to components
- **useWorker**: Manages Web Worker lifecycle for data processing
- **useNumFormatter**: Number formatting utilities
- **useWebSocket**: WebSocket connection management

## Important Configuration

### Environment Variables

- `VITE_MARKET_WS_ENDPOINT`: Market data WebSocket endpoint
- `VITE_USER_WS_ENDPOINT`: User data WebSocket endpoint
- `VITE_MARKET_API_URL`: REST API endpoint
- `VITE_MARKET_INFO_ENDPOINT`: Market info endpoint

### WebSocket Channels

Key subscription types defined in `utils/Constants.ts`:

- `l2Book`: Order book data
- `trades`: Recent trades
- `candle`: Price candles for charts
- `webData2`: Market statistics and user balances
- `userFills`: User's trade executions
- `userHistoricalOrders`: Order history

## Common Development Tasks

### Adding a New Market Data Subscription

1. Define the subscription type in SDK
2. Add channel mapping in `websocket-pool.ts`
3. Create processor for data transformation
4. Update store with new data
5. Subscribe in relevant component

### Debugging WebSocket Issues

1. Check browser console for WebSocket connection status
2. Verify subscription messages being sent
3. Check worker processing for parse errors
4. Ensure correct socket (market vs user) is being used
5. Verify subscription identifiers match expected format

### Performance Considerations

- Order book updates can be high-frequency (multiple per second)
- Use React.memo and useMemo to prevent unnecessary re-renders
- Worker processing prevents main thread blocking
- Batch state updates when possible
- Implement throttling for UI updates if needed

## Security Considerations

- Never expose private keys or secrets
- User authentication via wallet signatures
- WebSocket connections use wss:// (encrypted)
- Validate all incoming data before processing
- Implement rate limiting for user actions

## Testing Approach

- Unit tests for processors and utilities
- Integration tests for WebSocket SDK
- Component testing with React Testing Library
- E2E tests for critical user flows
- Manual testing with different market conditions

## Deployment

- Frontend deployed as static site or server-rendered with Remix
- Environment-specific configurations for different networks
- WebSocket proxy servers for load balancing/filtering
- Monitoring for WebSocket connection health

## Recent Architectural Changes

- Migrated from single WebSocket to multi-socket architecture
- Added support for proxy servers between app and Hyperliquid
- Implemented worker-based message processing
- Added sleep mode for inactive tabs to reduce resource usage

## Tips for New Developers

1. Start by understanding the WebSocket data flow
2. Use browser DevTools to inspect WebSocket messages
3. Familiarize yourself with Hyperliquid's API documentation
4. Test with small amounts on testnet first
5. Pay attention to decimal precision for prices/amounts
6. Understand the difference between market and user sockets
7. Check existing processors before writing new data transformations

## Debugging Utilities

- `window.__ws_messages__`: Stores recent WebSocket messages (when debug enabled)
- Browser DevTools Network tab: Monitor WebSocket connections
- React DevTools: Inspect component props and state
- Zustand DevTools: Monitor store state changes

This project emphasizes real-time performance, clean architecture, and a professional trading experience. The codebase is structured to handle high-frequency data updates while maintaining a responsive UI.
