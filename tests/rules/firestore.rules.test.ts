import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-questlog',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

beforeEach(() => env.clearFirestore());
afterAll(() => env.cleanup());

const alice = () => env.authenticatedContext('alice').firestore();
const bob = () => env.authenticatedContext('bob').firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe('firestore.rules', () => {
  it('Nutzer darf eigene Daten lesen und schreiben', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/quests/q1'), { name: 'Masterarbeit' }));
    await assertSucceeds(getDoc(doc(alice(), 'users/alice/quests/q1')));
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/state/activeTimer'), { title: 'x' }));
    await assertSucceeds(deleteDoc(doc(alice(), 'users/alice/state/activeTimer')));
    await assertSucceeds(setDoc(doc(alice(), 'users/alice/reflections/q1_2026-W47'), { text: 'gut' }));
  });

  it('fremde Nutzer haben keinen Zugriff', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'users/alice/sessions/s1'), { title: 'privat' }),
    );
    await assertFails(getDoc(doc(bob(), 'users/alice/sessions/s1')));
    await assertFails(setDoc(doc(bob(), 'users/alice/sessions/s2'), { title: 'fremd' }));
    await assertFails(deleteDoc(doc(bob(), 'users/alice/sessions/s1')));
  });

  it('nicht angemeldet: kein Zugriff', async () => {
    await assertFails(getDoc(doc(anon(), 'users/alice/quests/q1')));
    await assertFails(setDoc(doc(anon(), 'users/alice/quests/q1'), { name: 'x' }));
  });

  it('außerhalb von users/{uid} ist alles gesperrt', async () => {
    await assertFails(setDoc(doc(alice(), 'quests/q1'), { name: 'x' }));
    await assertFails(getDoc(doc(alice(), 'state/activeTimer')));
  });

  it('eigenes Nutzer-Dokument ja, fremdes nein', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'users/alice')));
    await assertFails(getDoc(doc(bob(), 'users/alice')));
  });
});
