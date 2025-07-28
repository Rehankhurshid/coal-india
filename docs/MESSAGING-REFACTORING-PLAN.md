# Messaging App Refactoring Plan - Best Practices Implementation

## Overview

This document outlines a comprehensive refactoring plan to improve the messaging app's architecture, maintainability, and performance using industry best practices.

## Current Issues

1. **Mixed Concerns**: Business logic mixed with UI components
2. **State Management**: Complex state management in hooks
3. **Error Handling**: Inconsistent error handling patterns
4. **Type Safety**: Some areas lacking proper TypeScript types
5. **Performance**: Potential re-render issues and unoptimized data fetching
6. **Code Duplication**: Similar patterns repeated across components

## Refactoring Goals

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data layers
2. **Predictable State Management**: Centralized state with clear update patterns
3. **Robust Error Handling**: Consistent error boundaries and recovery mechanisms
4. **Full Type Safety**: Comprehensive TypeScript coverage
5. **Performance Optimization**: Memoization, lazy loading, and efficient re-renders
6. **Reusable Components**: DRY principle with shared component library

## Implementation Plan

### Phase 1: Architecture Improvements

#### 1.1 Service Layer Enhancement

```typescript
// src/features/messaging/services/messaging.service.ts
interface MessagingService {
  // Groups
  getGroups(): Promise<Group[]>;
  getGroup(id: number): Promise<Group>;
  createGroup(data: CreateGroupRequest): Promise<Group>;
  updateGroup(id: number, data: Partial<Group>): Promise<Group>;
  deleteGroup(id: number): Promise<void>;

  // Messages
  getMessages(
    groupId: number,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Message>>;
  sendMessage(groupId: number, data: SendMessageRequest): Promise<Message>;
  editMessage(
    groupId: number,
    messageId: number,
    content: string
  ): Promise<Message>;
  deleteMessage(groupId: number, messageId: number): Promise<void>;

  // Real-time
  subscribeToGroup(groupId: number): Observable<GroupEvent>;
  subscribeToTyping(groupId: number): Observable<TypingEvent>;
}
```

#### 1.2 State Management with Zustand

```typescript
// src/features/messaging/store/messaging.store.ts
interface MessagingState {
  // State
  groups: Group[];
  currentGroup: Group | null;
  messages: Record<number, Message[]>; // Indexed by groupId
  typingUsers: Record<number, TypingUser[]>; // Indexed by groupId

  // UI State
  isLoading: boolean;
  error: Error | null;
  searchQuery: string;

  // Actions
  loadGroups: () => Promise<void>;
  selectGroup: (groupId: number) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
}
```

### Phase 2: Component Architecture

#### 2.1 Container/Presenter Pattern

```typescript
// Container Component
// src/features/messaging/containers/MessagingContainer.tsx
const MessagingContainer = () => {
  const { groups, currentGroup, selectGroup } = useMessagingStore();
  const { user } = useAuth();

  return (
    <MessagingLayout
      groups={groups}
      currentGroup={currentGroup}
      onGroupSelect={selectGroup}
      currentUser={user}
    />
  );
};

// Presenter Component
// src/features/messaging/components/MessagingLayout.tsx
interface MessagingLayoutProps {
  groups: Group[];
  currentGroup: Group | null;
  onGroupSelect: (groupId: number) => void;
  currentUser: User;
}

const MessagingLayout: React.FC<MessagingLayoutProps> = (props) => {
  // Pure UI logic only
};
```

#### 2.2 Custom Hooks for Business Logic

```typescript
// src/features/messaging/hooks/useGroupManagement.ts
export const useGroupManagement = () => {
  const { groups, createGroup, updateGroup, deleteGroup } = useMessagingStore();

  const handleCreateGroup = useCallback(
    async (data: CreateGroupRequest) => {
      try {
        await createGroup(data);
        toast.success("Group created successfully");
      } catch (error) {
        toast.error("Failed to create group");
        throw error;
      }
    },
    [createGroup]
  );

  return {
    groups,
    handleCreateGroup,
    // ... other handlers
  };
};
```

### Phase 3: Performance Optimizations

#### 3.1 Message Virtualization

```typescript
// src/features/messaging/components/VirtualizedMessageList.tsx
import { FixedSizeList } from "react-window";

const VirtualizedMessageList = ({ messages }: { messages: Message[] }) => {
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => (
    <div style={style}>
      <MessageItem message={messages[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

#### 3.2 Optimistic Updates

```typescript
// src/features/messaging/store/messaging.store.ts
sendMessage: async (content: string) => {
  const tempId = generateTempId();
  const optimisticMessage = {
    id: tempId,
    content,
    senderId: currentUserId,
    status: "sending" as const,
    createdAt: new Date(),
  };

  // Add optimistic message
  set((state) => ({
    messages: {
      ...state.messages,
      [state.currentGroup.id]: [
        ...state.messages[state.currentGroup.id],
        optimisticMessage,
      ],
    },
  }));

  try {
    const sentMessage = await MessagingService.sendMessage(groupId, {
      content,
    });
    // Replace optimistic message with real one
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: state.messages[groupId].map((msg) =>
          msg.id === tempId ? sentMessage : msg
        ),
      },
    }));
  } catch (error) {
    // Remove optimistic message on error
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: state.messages[groupId].filter((msg) => msg.id !== tempId),
      },
    }));
    throw error;
  }
};
```

### Phase 4: Error Handling

#### 4.1 Error Boundary

```typescript
// src/features/messaging/components/MessagingErrorBoundary.tsx
class MessagingErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Messaging error:", error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <MessagingErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

#### 4.2 Retry Logic

```typescript
// src/features/messaging/utils/retry.ts
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelay * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError!;
};
```

### Phase 5: Testing Strategy

#### 5.1 Unit Tests

```typescript
// src/features/messaging/store/__tests__/messaging.store.test.ts
describe("MessagingStore", () => {
  it("should load groups successfully", async () => {
    const mockGroups = [
      /* mock data */
    ];
    MessagingService.getGroups = jest.fn().mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useMessagingStore());

    await act(async () => {
      await result.current.loadGroups();
    });

    expect(result.current.groups).toEqual(mockGroups);
    expect(result.current.isLoading).toBe(false);
  });
});
```

#### 5.2 Integration Tests

```typescript
// src/features/messaging/__tests__/messaging.integration.test.tsx
describe("Messaging Integration", () => {
  it("should send and receive messages in real-time", async () => {
    const { getByRole, findByText } = render(<MessagingContainer />);

    // Send a message
    const input = getByRole("textbox");
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.submit(input.closest("form")!);

    // Verify message appears
    expect(await findByText("Test message")).toBeInTheDocument();
  });
});
```

### Phase 6: Accessibility & UX

#### 6.1 Keyboard Navigation

```typescript
// src/features/messaging/hooks/useKeyboardNavigation.ts
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Close modals
      } else if (e.key === "ArrowUp" && e.ctrlKey) {
        // Navigate to previous message
      } else if (e.key === "ArrowDown" && e.ctrlKey) {
        // Navigate to next message
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
};
```

#### 6.2 Loading States

```typescript
// src/features/messaging/components/MessageListSkeleton.tsx
const MessageListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-start space-x-3 animate-pulse">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    ))}
  </div>
);
```

## Implementation Timeline

### Week 1: Foundation

- Set up Zustand store
- Implement service layer
- Create base container/presenter components

### Week 2: Core Features

- Migrate existing functionality to new architecture
- Implement optimistic updates
- Add error boundaries

### Week 3: Performance

- Add virtualization
- Implement lazy loading
- Optimize re-renders

### Week 4: Polish

- Add comprehensive tests
- Improve accessibility
- Documentation

## Success Metrics

1. **Code Quality**: 90%+ TypeScript coverage
2. **Performance**: <100ms message send latency
3. **Reliability**: 99.9% uptime with graceful error handling
4. **Maintainability**: Clear separation of concerns, easy to add features
5. **User Experience**: Smooth, responsive UI with proper loading states

## Next Steps

1. Review and approve this plan
2. Set up development branch
3. Begin Phase 1 implementation
4. Regular code reviews and testing
