# 04 - User Flows: CreatorOS

## 1. User Flow 1: Creator Onboarding & Brain Setup
1. **Sign Up**: User authenticates via Google/GitHub OAuth.
2. **Brain Wizard**:
   - Step 1: Input creator name, handle, and primary niche.
   - Step 2: Define audience ICP (e.g., "Early stage founders struggling to scale").
   - Step 3: Choose 3-5 tone keywords (e.g., "Direct", "High-energy", "No fluff").
   - Step 4: Add forbidden words (e.g., "synergy", "supercharge", "unleash").
   - Step 5: Upload visual brand assets (primary/accent colors, avatar, logo, font).
3. **Brain Compilation**: System stores initial Stable Memory record and initializes vector index.

## 2. User Flow 2: Core Creation Loop (Concept to Publish)
1. **Prompt Entry**: User types one core topic into the studio prompt box:
   > *"Why building an MVP in 2 weeks is better than spending 6 months planning."*
2. **Hook Selection**:
   - Model Council presents 3 distinct hooks with predicted retention scores:
     - Hook A (Contrarian): *"90% of founders waste 6 months building products nobody wants."*
     - Hook B (Curiosity): *"The 14-day rule that saved my startup from going broke."*
     - Hook C (Result): *"How we got our first 100 paying users in just two weeks."*
   - User selects Hook A or edits in-line.
3. **Script Review & Council Critique**:
   - System displays the 45-second beat breakdown with Critic quality score (e.g., Retention: 92/100, Brand Match: 95/100).
   - User approves or requests 1-click refinement.
4. **Scene Preview & Render**:
   - Video player renders preview via Remotion Studio.
   - User clicks **Export Video**. Background BullMQ worker renders 1080x1920 MP4.
5. **Omni-Channel Distribution**:
   - Repurposing tab displays ready-to-copy Twitter thread, LinkedIn post, and Shorts caption.
   - User copies or connects social publishing integration.
