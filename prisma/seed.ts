import { nanoid } from 'nanoid'
import { getStore } from '../server/store/index.js'
import { createJoinCode } from '../server/lib/joinCode.js'

async function main() {
  const store = getStore()
  const user = await store.upsertUserProfile({
    authUserId: 'seed-auth-user',
    email: 'demo@pulse.local',
  })
  await store.updateUserProfile(user.id, {
    role: 'Product',
    useCases: ['Workshops'],
    audienceSize: '10–50',
    onboardingCompleted: true,
  })

  const session = await store.createSession({
    id: nanoid(),
    title: 'NextGen UX Feedback',
    description: 'Seeded demo workshop session',
    joinCode: createJoinCode(),
    createdById: user.id,
    settings: { allowAnonymous: true, maxParticipants: 200 },
    status: 'LOBBY',
  })

  const q1 = await store.createQuestion({
    id: nanoid(),
    sessionId: session.id,
    type: 'MULTIPLE_CHOICE',
    prompt: 'What is your biggest pain point?',
    config: { allowMultiple: false, required: true },
    order: 0,
  })
  await store.replaceOptions(q1.id, [
    { label: 'Navigation', order: 0 },
    { label: 'Performance', order: 1 },
    { label: 'Too many clicks', order: 2 },
    { label: 'Missing features', order: 3 },
  ])

  const q2 = await store.createQuestion({
    id: nanoid(),
    sessionId: session.id,
    type: 'RATING',
    prompt: 'How easy is the new experience?',
    config: { min: 1, max: 5, required: true },
    order: 1,
  })

  await store.createQuestion({
    id: nanoid(),
    sessionId: session.id,
    type: 'OPEN_TEXT',
    prompt: 'What should we improve?',
    config: { maxLength: 500, required: true },
    order: 2,
  })

  await store.createQuestion({
    id: nanoid(),
    sessionId: session.id,
    type: 'WORD_CLOUD',
    prompt: 'Describe the product in one word',
    config: { maxLength: 40, required: true },
    order: 3,
  })

  const options = await store.listOptions(q1.id)
  for (let i = 0; i < 8; i++) {
    const p = await store.createParticipant({
      id: nanoid(),
      sessionId: session.id,
      displayName: `Guest ${i + 1}`,
      token: nanoid(32),
    })
    await store.createResponse({
      sessionId: session.id,
      questionId: q1.id,
      participantId: p.id,
      value: { optionIds: [options[i % options.length].id] },
    })
    await store.createResponse({
      sessionId: session.id,
      questionId: q2.id,
      participantId: p.id,
      value: { value: 3 + (i % 3) },
    })
  }

  console.log('Seeded session', session.title, 'code', session.joinCode)
  console.log('Seed presenter profile id:', user.id, '(authUserId: seed-auth-user)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
