// Export types
export * from './types';

// Export services
export { MessagingService } from './services/messaging.service';

// Export store elements - with explicit exports to avoid conflicts
export { MessagingProvider, useMessaging } from './store/messaging.context';
export { messagingReducer, initialMessagingState } from './store/messaging.reducer';

// Export components
export * from './components';
