# Coal India Directory App - Comprehensive Refactoring Plan

## Current Issues

1. **Large Page Component**: The main `page.tsx` is 460+ lines handling multiple responsibilities
2. **Mixed Concerns**: State management, data fetching, and UI logic are intertwined
3. **Duplicate Logic**: Filter logic is duplicated between mobile and desktop views
4. **Complex State Management**: Multiple related states are managed independently
5. **Tight Coupling**: Components are tightly coupled to data fetching logic

## Refactoring Strategy

### 1. Directory Module Architecture

Create a clean, modular architecture for the directory feature:

```
src/
├── features/
│   └── directory/
│       ├── components/          # UI components
│       ├── hooks/              # Feature-specific hooks
│       ├── services/           # API/data services
│       ├── store/              # State management
│       ├── types/              # TypeScript types
│       └── utils/              # Helper functions
```

### 2. Key Improvements

#### A. State Management

- Create a `DirectoryProvider` context for centralized state
- Use reducer pattern for complex state updates
- Separate UI state from data state

#### B. Custom Hooks

- `useDirectoryData` - Handle all data fetching logic
- `useDirectoryFilters` - Manage filter state and logic
- `useDirectoryPagination` - Handle pagination
- `useDirectorySearch` - Manage search with debouncing

#### C. Service Layer

- Create `DirectoryService` class for API calls
- Implement caching for filter options
- Add retry logic and error handling

#### D. Component Structure

- Break down into smaller, focused components
- Create compound components for related functionality
- Implement proper component composition

### 3. Implementation Steps

1. **Phase 1: Core Infrastructure**

   - Set up directory module structure
   - Create TypeScript types and interfaces
   - Implement service layer

2. **Phase 2: State Management**

   - Create DirectoryProvider context
   - Implement custom hooks
   - Set up reducer for complex state

3. **Phase 3: Component Refactoring**

   - Break down main page component
   - Create reusable UI components
   - Implement compound components

4. **Phase 4: Performance Optimization**

   - Add memoization where needed
   - Implement virtual scrolling
   - Add loading states and skeletons

5. **Phase 5: Testing & Documentation**
   - Add unit tests for hooks and utils
   - Create component documentation
   - Add integration tests

## Benefits

1. **Maintainability**: Smaller, focused components are easier to understand and modify
2. **Reusability**: Components and hooks can be reused across the app
3. **Testability**: Separated concerns make testing easier
4. **Performance**: Better state management and memoization improve performance
5. **Developer Experience**: Clear structure and patterns make development faster
