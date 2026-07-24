# Games Expansion Design

## Goal
Add 10 new educational games to the MyBloom Life platform, aligned with the Algerian curriculum (Primaire, Moyen, Lycée cycles).

## Architecture
- `src/games/` folder with one file per game component
- `src/games/types.ts` for shared game types
- Each game supports 3 difficulty levels (cycle-based content)
- Existing games (MathQuiz, MemoryMatching) moved into `src/games/`
- Games routed via `activeGame` string in GamesScreen using a component lookup object

## New Games

| Game | File | Mechanic | Input |
|---|---|---|---|
| Speed Arithmetic | SpeedArithmeticGame.tsx | Rapid-fire, 30s timer, streak bonus | Text input |
| Word Builder | WordBuilderGame.tsx | Scrambled letters → type word | Keyboard/text |
| Vocabulary Match | VocabMatchGame.tsx | Word pair matching grid | Tap grid |
| Islamic Ed Quiz | IslamicQuizGame.tsx | MCQs on Islamic topics | Tap option |
| Science Flashcards | FlashcardsGame.tsx | Swipeable Q&A cards | Tap/swipe |
| Timeline Sort | TimelineGame.tsx | Drag events into order | Tap order |
| Wilaya Match | WilayaMatchGame.tsx | Match wilaya name ↔ number | Tap grid |
| Physics Lab | PhysicsLabGame.tsx | Match formula ↔ description | Tap grid |
| Spelling Bee | SpellingBeeGame.tsx | Definition → type the word | Text input |
| Crossword | CrosswordGame.tsx | Fill letters into grid | Tap grid cells |

## Content
- Each game has cycle-appropriate data (primaire, moyen, lycee)
- Arabic, French, English, and Tamazight language support where applicable

## Integration
- GamesScreen shows cards for each game (scrollable list)
- Admin panel extended to preview available games
- Locale strings added for game titles, descriptions, and UI text
