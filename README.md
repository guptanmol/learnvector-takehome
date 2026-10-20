# LearnVector discovery page

The page a learner sees right after Google sign-in. It asks one question, builds a learning path in front of you, and gets more personal as you use it, while asking for as little as possible.

**Prototype:** https://learnvector-takehome.vercel.app (add `?u=cathy` to sign in as Cathy instead of Priya)

## How it works

1. **One question.** "What brings you here?" with three answers, each with its own picture. You can also write your own answer or just look around.
2. **The guide builds the path in front of you.** The library starts grey and lessons light up as the guide checks them against what it knows about you.
3. **Everything else starts as an assumption, and says so.** Experience comes from your answer. Minutes come from your device (10 on a phone, 20 on a laptop). If your work email belongs to a bank, it adds a step on getting copy through review, and says why. Each assumption is marked "Assumed" until you confirm it.
4. **At most one question, once the path is on screen.** If it doesn't know your work, it asks what a normal week looks like and reads your experience from the answer. It never asks you to fill in its settings. The card waits ten seconds, then leaves on its own, and the assumption stays marked.
5. **It keeps learning.** Every piece has an Ask button: easier, harder, shorter, another format, or "I already know this". Saying a piece was too easy or hard to follow changes the later pieces on that topic.
6. **It shows its work.** Before anything moves, the guide shows what it heard and rebuilds the step in stages. Changing your minutes works the same way: it tells you what fits now and when you'd finish. New pieces fade in with a note saying why they're there. Every change is listed under Recent changes with Undo.
7. **You can change anything.** How I see you lists goal, experience, work, approvals, how you learn best and pace. Tap any line to change it.

The same rules give the two personas different pages:

- **Priya** is on her phone at lunch. She gets 10 minutes, tabs instead of a long scroll, and sheets near her thumb. The guide asks what her week looks like. "Building the product" brings lessons written for people who build apps, from the basics up.
- **Cathy** is on a laptop on the train. Her bank email adds a step on getting AI copy through review, with a note saying why, which she can keep or remove. Wanting AI at work puts practice first, and she can save today's pieces for when the signal drops.

## What's mocked, and what isn't here

- There's no real agent. The guide is rules plus a small keyword reader, and the library check is an animation.
- There are no lessons or games. Opening one says so.
- Nothing is saved. A reload starts over, and "Save offline" is mocked.
- There's no progress or mastery tracking past the first week's plan.
- Lora and Instrument Sans stand in for LearnVector's fonts.

## How I used AI

I built this with Claude Code. I set the direction, tested every change in the browser and on my iPhone, and pushed back when something looked wrong. Claude wrote most of the code and drafted the mock lessons, quizzes and templates. I generated the three first-screen pictures with an AI image tool from one shared prompt. The lesson thumbnails are free stock footage, credited in [CREDITS.md](CREDITS.md).

## Run it

```
npm install
npm run dev
```

## Where things are

Vite, React and TypeScript, with framer-motion for motion and plain CSS. There's no backend.

- `src/App.tsx`: state and the guide's actions (ask, signal, change, undo)
- `src/model.ts`: what the guide knows about you, ranking and the path
- `src/plan.ts`: how the path is laid out, filled into sittings and estimated
- `src/aboutYou.ts`: quick questions, How I see you rows and suggestions
- `src/guide.ts`: the guide's copy and the walk-through
- `src/data.ts`, `src/materials.ts`: the mock catalog
- `src/components/`: one file per piece of UI
- `src/styles.css`: tokens first, then components, then one block per breakpoint
