# Services Reorganization Plan

## Current State Analysis

### Redundancies Identified

1. **Authentication Services**
   - `authService.ts` (root) - 213 lines
   - `user/authService.ts` - 420 lines
   - **Issue**: Duplicate authentication logic with different implementations

2. **Profile Services**
   - `profileService.ts` (root) - 214 lines
   - `user/profileService.ts` - 141 lines
   - **Issue**: Duplicate profile management with different patterns

3. **Quiz Services**
   - `quizService.ts` (root) - 403 lines
   - `quiz/quizFetchService.ts` - 323 lines
   - `dailyQuizService.ts` (root) - 409 lines
   - `userDailyQuizService.ts` (root) - 265 lines
   - **Issue**: Multiple quiz-related services with overlapping functionality

4. **Question Services**
   - `questionService.ts` (root) - 238 lines
   - Quiz services contain question logic
   - **Issue**: Scattered question handling logic

5. **Error Handling**
   - `errorHandler.ts` (root) - 376 lines
   - `user/errorHandler.ts` - 39 lines
   - `quiz/errorHandler.ts` - 39 lines
   - **Issue**: Inconsistent error handling patterns

## Proposed New Structure

```
services/
├── core/
│   ├── baseService.ts          # Base service implementation
│   ├── errorHandler.ts         # Unified error handling
│   └── performanceMonitor.ts   # Performance monitoring
├── auth/
│   ├── authService.ts          # Unified authentication
│   └── index.ts
├── user/
│   ├── profileService.ts       # User profile management
│   ├── preferencesService.ts   # User preferences
│   ├── progressionService.ts   # XP, levels, coins
│   └── index.ts
├── quiz/
│   ├── quizService.ts          # Main quiz service
│   ├── dailyQuizService.ts     # Daily quiz logic
│   ├── questionService.ts      # Question management
│   ├── analyticsService.ts     # Quiz analytics
│   └── index.ts
├── social/
│   ├── friendService.ts        # Friend management
│   ├── leaderboardService.ts   # Leaderboard functionality
│   └── index.ts
├── multiplayer/
│   ├── websocketService.ts     # WebSocket handling
│   └── index.ts
└── index.ts                    # Main services index
```

## Consolidation Strategy

### 1. Authentication Consolidation
- **Keep**: `authService.ts` (root) - more comprehensive
- **Remove**: `user/authService.ts` - redundant
- **Enhance**: Add missing features from user/authService.ts to main authService.ts

### 2. Profile Services Consolidation
- **Keep**: `profileService.ts` (root) - extends BaseService
- **Remove**: `user/profileService.ts` - less comprehensive
- **Enhance**: Add missing features from user/profileService.ts

### 3. Quiz Services Consolidation
- **Merge**: `quizService.ts` + `quiz/quizFetchService.ts` → unified `quiz/quizService.ts`
- **Consolidate**: `dailyQuizService.ts` + `userDailyQuizService.ts` → `quiz/dailyQuizService.ts`
- **Move**: `questionService.ts` → `quiz/questionService.ts`

### 4. Error Handling Unification
- **Keep**: `errorHandler.ts` (root) - most comprehensive
- **Remove**: `user/errorHandler.ts` and `quiz/errorHandler.ts`
- **Standardize**: All services use unified error handling

### 5. Social Services Organization
- **Move**: `friendService.ts` → `social/friendService.ts`
- **Move**: `leaderboardService.ts` → `social/leaderboardService.ts`
- **Move**: `socialPerformanceMonitor.ts` → `core/performanceMonitor.ts`

## Implementation Steps

### Phase 1: Core Services (Week 1)
1. Create `core/` directory
2. Move and enhance `baseService.ts`
3. Consolidate error handling into `core/errorHandler.ts`
4. Move performance monitoring to `core/performanceMonitor.ts`

### Phase 2: Authentication & User Services (Week 1)
1. Create `auth/` directory
2. Consolidate authentication services
3. Create `user/` directory
4. Consolidate profile, preferences, and progression services

### Phase 3: Quiz Services (Week 2)
1. Create `quiz/` directory
2. Consolidate all quiz-related services
3. Merge duplicate functionality
4. Create unified quiz service

### Phase 4: Social Services (Week 2)
1. Create `social/` directory
2. Move friend and leaderboard services
3. Update imports and references

### Phase 5: Multiplayer Services (Week 3)
1. Create `multiplayer/` directory
2. Move WebSocket service
3. Update imports

### Phase 6: Cleanup & Testing (Week 3)
1. Remove redundant files
2. Update all imports across the codebase
3. Comprehensive testing
4. Update documentation

## Benefits

### 1. **Eliminated Redundancies**
- Single authentication service
- Single profile service
- Unified quiz services
- Consistent error handling

### 2. **Better Organization**
- Clear domain separation
- Logical grouping of related services
- Easier to find and maintain

### 3. **Improved Maintainability**
- Consistent patterns across services
- Unified error handling
- Better type safety
- Reduced code duplication

### 4. **Enhanced Performance**
- Optimized service calls
- Better caching strategies
- Reduced bundle size

## Migration Strategy

### Backward Compatibility
- Maintain existing API signatures where possible
- Provide deprecation warnings for old imports
- Gradual migration timeline

### Testing Strategy
- Unit tests for each consolidated service
- Integration tests for service interactions
- Performance benchmarks
- Migration tests for existing functionality

## Risk Mitigation

### 1. **Incremental Migration**
- One service at a time
- Comprehensive testing at each step
- Rollback plan for each phase

### 2. **Documentation**
- Clear migration guides
- Updated API documentation
- Code examples for new patterns

### 3. **Monitoring**
- Performance monitoring during migration
- Error tracking for new patterns
- User feedback collection

## Success Metrics

### 1. **Code Quality**
- Reduced lines of code (target: 30% reduction)
- Eliminated duplicate functionality
- Improved test coverage

### 2. **Performance**
- Faster service initialization
- Reduced memory usage
- Better caching efficiency

### 3. **Developer Experience**
- Easier to find services
- Consistent patterns
- Better documentation
- Reduced cognitive load

## Timeline

- **Week 1**: Core services and authentication/user services
- **Week 2**: Quiz and social services
- **Week 3**: Multiplayer services and cleanup
- **Week 4**: Testing, documentation, and final review

## Next Steps

1. **Approval**: Get stakeholder approval for this plan
2. **Prioritization**: Determine which services to consolidate first
3. **Resource Allocation**: Assign developers to specific phases
4. **Communication**: Inform team about migration timeline
5. **Implementation**: Begin with Phase 1 