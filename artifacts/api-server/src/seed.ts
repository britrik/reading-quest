import {
  db,
  worldsTable,
  storiesTable,
  chaptersTable,
  shopItemsTable,
  childProfilesTable,
  ownedItemsTable,
  decorStateTable,
  type TappableWord,
} from "@workspace/db";
import { sql } from "drizzle-orm";

type ChapterSeed = {
  title: string;
  sceneImageUrl: string;
  paragraphs: string[];
  tappableWords: TappableWord[];
};

type StorySeed = {
  slug: string;
  title: string;
  summary: string;
  chapters: ChapterSeed[];
};

type WorldSeed = {
  slug: string;
  name: string;
  blurb: string;
  difficulty: number;
  difficultyLabel: string;
  thumbnailUrl: string;
  accentColor: string;
  chipColor: string;
  chipTextColor: string;
  stories: StorySeed[];
};

const FOREST_SCENE = "/images/reading-quest/scene-forest.png";

const COMMON_WORDS: Record<string, TappableWord> = {
  carefully: { key: "carefully", word: "carefully", syllables: ["care", "ful", "ly"], reaction: "Nice — that's a big one!" },
  glowing: { key: "glowing", word: "glowing", syllables: ["glow", "ing"], reaction: "You got it!" },
  clearing: { key: "clearing", word: "clearing", syllables: ["clear", "ing"], reaction: "Easy peasy!" },
  floating: { key: "floating", word: "floating", syllables: ["float", "ing"], reaction: "Smooth!" },
  quietly: { key: "quietly", word: "quietly", syllables: ["qui", "et", "ly"], reaction: "Tricky one — well done!" },
  stardust: { key: "stardust", word: "stardust", syllables: ["star", "dust"], reaction: "Sparkly word!" },
  behind: { key: "behind", word: "behind", syllables: ["be", "hind"], reaction: "Got it!" },
  slowly: { key: "slowly", word: "slowly", syllables: ["slow", "ly"], reaction: "Take your time." },
  follow: { key: "follow", word: "follow", syllables: ["fol", "low"], reaction: "Yes!" },
  deeper: { key: "deeper", word: "deeper", syllables: ["deep", "er"], reaction: "Good one!" },
  whispering: { key: "whispering", word: "whispering", syllables: ["whis", "per", "ing"], reaction: "So quiet!" },
  ancient: { key: "ancient", word: "ancient", syllables: ["an", "cient"], reaction: "Old and cool!" },
  crystal: { key: "crystal", word: "crystal", syllables: ["crys", "tal"], reaction: "Sparkle!" },
  shimmer: { key: "shimmer", word: "shimmer", syllables: ["shim", "mer"], reaction: "Twinkle twinkle!" },
  wonder: { key: "wonder", word: "wonder", syllables: ["won", "der"], reaction: "What a word!" },
  treasure: { key: "treasure", word: "treasure", syllables: ["trea", "sure"], reaction: "Ooh shiny!" },
};

function pickWords(text: string): TappableWord[] {
  const used = new Set<string>();
  const result: TappableWord[] = [];
  for (const tok of text.toLowerCase().split(/[^a-z]+/)) {
    if (used.has(tok)) continue;
    if (COMMON_WORDS[tok]) {
      result.push(COMMON_WORDS[tok]);
      used.add(tok);
    }
  }
  return result;
}

function chap(title: string, paragraphs: string[]): ChapterSeed {
  return {
    title,
    sceneImageUrl: FOREST_SCENE,
    paragraphs,
    tappableWords: pickWords(paragraphs.join(" ")),
  };
}

const WORLDS: WorldSeed[] = [
  {
    slug: "whispering-woods",
    name: "Whispering Woods",
    blurb: "Help a lost voxel-bear find its way home through the blocky trees.",
    difficulty: 1,
    difficultyLabel: "Gentle Path",
    thumbnailUrl: "/images/reading-quest/world-forest.png",
    accentColor: "#A5FFD6",
    chipColor: "#A5FFD6",
    chipTextColor: "#0F766E",
    stories: [
      {
        slug: "the-glowing-clearing",
        title: "The Glowing Clearing",
        summary: "A friendly fox shows up. Where will it lead?",
        chapters: [
          chap("Into the woods", [
            "You step carefully into the glowing clearing. The trees here don't have leaves—they have soft, floating blocks of light that hum quietly.",
            "A small fox with a tail made of stardust pokes its head out from behind a glowing stump. It blinks its big eyes at you, then slowly waves a paw. It looks like it wants you to follow it deeper into the woods.",
          ]),
          chap("Following the fox", [
            "The fox trots ahead, glancing back to make sure you're following. The path ahead is glowing softly, like little blocks of light tucked into the moss.",
            "You hear whispering sounds — gentle, friendly ones. The trees are slowly waking up.",
          ]),
          chap("The bear's home", [
            "Behind a quietly humming bush, you find a cozy little den. A round voxel-bear is curled up inside, blinking sleepy eyes.",
            "The fox waves goodbye and floats away, leaving a trail of stardust. You did it.",
          ]),
        ],
      },
      {
        slug: "the-friendly-fog",
        title: "The Friendly Fog",
        summary: "A soft fog rolls in. It might want to be friends.",
        chapters: [
          chap("Soft fog", [
            "A pale, friendly fog drifts slowly through the trees. It hums a tune you almost know.",
            "The fog wraps gently around your boots and pulls you toward a glowing path.",
          ]),
          chap("Whispers", [
            "Inside the fog you hear whispering — quiet voices carefully telling stories from long ago.",
            "You feel cozy. The fog is glad you came.",
          ]),
        ],
      },
    ],
  },
  {
    slug: "cloud-ruins",
    name: "Cloud Ruins",
    blurb: "Discover the secrets of the ancient floating temples in the sky.",
    difficulty: 2,
    difficultyLabel: "Breezy Climb",
    thumbnailUrl: "/images/reading-quest/world-sky.png",
    accentColor: "#84DCC6",
    chipColor: "#84DCC6",
    chipTextColor: "#1E40AF",
    stories: [
      {
        slug: "above-the-clouds",
        title: "Above the Clouds",
        summary: "Float upward and see what the sky is hiding.",
        chapters: [
          chap("The cloud bridge", [
            "You step onto a soft, floating bridge of clouds. Each block hums quietly under your feet.",
            "Far above, an ancient temple is glowing in the morning sun.",
          ]),
          chap("Sky garden", [
            "The garden floats slowly between clouds. Glowing flowers carefully open their petals when you walk by.",
            "A friendly sky-fox watches from behind a stone, then follows you deeper.",
          ]),
          chap("The quiet temple", [
            "The temple is older than any forest. Its stones are humming, glowing, and whispering at the same time.",
            "You feel small — but in a good way. The wind hugs you slowly.",
          ]),
        ],
      },
      {
        slug: "the-sleepy-temple",
        title: "The Sleepy Temple",
        summary: "Wake the temple gently, the way it likes.",
        chapters: [
          chap("Quiet steps", [
            "You walk quietly into the temple. Dust floats slowly through bars of warm light.",
            "Behind a curtain you find a sleepy stone owl with glowing eyes.",
          ]),
          chap("Owl's gift", [
            "The owl carefully drops a small star into your hand. It hums.",
            "The temple opens its doors, slowly, as if welcoming an old friend.",
          ]),
        ],
      },
    ],
  },
  {
    slug: "crystal-caverns",
    name: "Crystal Caverns",
    blurb: "Brave the deep caves to find the legendary glowing geodes.",
    difficulty: 3,
    difficultyLabel: "Brave Journey",
    thumbnailUrl: "/images/reading-quest/world-cave.png",
    accentColor: "#B4A0E5",
    chipColor: "#E5D4FF",
    chipTextColor: "#6B21A8",
    stories: [
      {
        slug: "deep-down",
        title: "Deep Down",
        summary: "Climb down, slowly. The cave likes you.",
        chapters: [
          chap("Cave mouth", [
            "The cave is deeper than you expected. Crystal walls shimmer softly, glowing in pinks and blues.",
            "A small bat waves a wing — it's been waiting.",
          ]),
          chap("Crystal bridge", [
            "A bridge made of crystal hums quietly under your feet. Below, glowing fish float in a black river.",
            "You walk slowly, carefully. The bat hums along.",
          ]),
          chap("The big geode", [
            "At the bottom of the cave is a giant glowing geode. It is full of wonder.",
            "Inside, you find a tiny treasure — a stardust feather. The bat squeaks happily.",
          ]),
        ],
      },
      {
        slug: "the-singing-stones",
        title: "The Singing Stones",
        summary: "The stones are humming a quiet song. Learn it.",
        chapters: [
          chap("First note", [
            "A row of crystal stones hums quietly. When you tap one, it glows and sings a single note.",
            "The bat watches and waits patiently.",
          ]),
          chap("Whole song", [
            "When you tap them in order, the cave fills with shimmering light. The whole cave is glowing.",
            "You did it. The cave sings a thank you, slowly and gently.",
          ]),
        ],
      },
    ],
  },
];

const SHOP_ITEMS = [
  // snacks (sortIndex 0-9)
  { id: "snack.berry", kind: "snack", name: "Glow Berry", description: "A small but cheerful snack.", gemPrice: 1, fullnessBoost: 10, happinessBoost: 5, requiresPetLevel: 0, emoji: "🍓", glowColor: null, sortIndex: 0 },
  { id: "snack.cookie", kind: "snack", name: "Star Cookie", description: "Crunchy and sparkly.", gemPrice: 3, fullnessBoost: 25, happinessBoost: 15, requiresPetLevel: 0, emoji: "🍪", glowColor: null, sortIndex: 1 },
  { id: "snack.drumstick", kind: "snack", name: "Hearty Roast", description: "Big snack for hungry pets.", gemPrice: 5, fullnessBoost: 45, happinessBoost: 10, requiresPetLevel: 0, emoji: "🍗", glowColor: null, sortIndex: 2 },
  { id: "snack.cake", kind: "snack", name: "Birthday Cake", description: "A surprise treat!", gemPrice: 8, fullnessBoost: 30, happinessBoost: 40, requiresPetLevel: 0, emoji: "🎂", glowColor: null, sortIndex: 3 },
  // hats (10-19)
  { id: "hat.crown", kind: "hat", name: "Tiny Crown", description: "Royal vibes.", gemPrice: 6, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "👑", glowColor: null, sortIndex: 10 },
  { id: "hat.wizard", kind: "hat", name: "Wizard Hat", description: "Sparkles included.", gemPrice: 10, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 2, emoji: "🧙", glowColor: null, sortIndex: 11 },
  { id: "hat.party", kind: "hat", name: "Party Hat", description: "Always a good time.", gemPrice: 4, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🎉", glowColor: null, sortIndex: 12 },
  { id: "hat.halo", kind: "hat", name: "Glow Halo", description: "Soft and shiny.", gemPrice: 15, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 4, emoji: "😇", glowColor: null, sortIndex: 13 },
  // glow colors (20-29)
  { id: "glow.berry", kind: "glow", name: "Berry Pop", description: "A purple glow.", gemPrice: 5, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🟣", glowColor: "berry", sortIndex: 20 },
  { id: "glow.sun", kind: "glow", name: "Sunset", description: "Warm orange glow.", gemPrice: 5, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🟠", glowColor: "sun", sortIndex: 21 },
  { id: "glow.sky", kind: "glow", name: "Sky Drift", description: "Cool blue glow.", gemPrice: 5, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🔵", glowColor: "sky", sortIndex: 22 },
  { id: "glow.rainbow", kind: "glow", name: "Rainbow", description: "All the colors.", gemPrice: 20, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 5, emoji: "🌈", glowColor: "rainbow", sortIndex: 23 },
  // decor (30-39)
  { id: "decor.rug", kind: "decor", name: "Cozy Rug", description: "Soft on the paws.", gemPrice: 4, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🟫", glowColor: null, sortIndex: 30 },
  { id: "decor.lamp", kind: "decor", name: "Lava Lamp", description: "Slow and dreamy.", gemPrice: 6, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🪔", glowColor: null, sortIndex: 31 },
  { id: "decor.plant", kind: "decor", name: "Glow Plant", description: "Always cheerful.", gemPrice: 3, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🪴", glowColor: null, sortIndex: 32 },
  { id: "decor.bookshelf", kind: "decor", name: "Tiny Library", description: "For your stories.", gemPrice: 8, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 2, emoji: "📚", glowColor: null, sortIndex: 33 },
  { id: "decor.bed", kind: "decor", name: "Cloud Bed", description: "Big sleepy energy.", gemPrice: 10, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 3, emoji: "☁️", glowColor: null, sortIndex: 34 },
  { id: "decor.window", kind: "decor", name: "Star Window", description: "Stars all night.", gemPrice: 12, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 4, emoji: "🌌", glowColor: null, sortIndex: 35 },
];

export async function seed() {
  // Idempotent: skip if any worlds exist
  const existing = await db.select().from(worldsTable).limit(1);
  if (existing.length > 0) {
    return { seeded: false };
  }

  // Reset every table just in case (TRUNCATE not always available; use deletes for safety)
  await db.execute(sql`TRUNCATE worlds, stories, chapters, finished_chapters, sessions, word_help_events, shop_items, owned_items, decor_state, transactions, child_profiles RESTART IDENTITY CASCADE`);

  // Default profile
  await db.insert(childProfilesTable).values({ name: "Alex", gems: 24, stars: 12, petLevel: 3, petXp: 100, fullness: 70, happiness: 75 });

  let worldSort = 0;
  for (const w of WORLDS) {
    const insertedWorld = await db
      .insert(worldsTable)
      .values({
        slug: w.slug, name: w.name, blurb: w.blurb,
        difficulty: w.difficulty, difficultyLabel: w.difficultyLabel,
        thumbnailUrl: w.thumbnailUrl, accentColor: w.accentColor,
        chipColor: w.chipColor, chipTextColor: w.chipTextColor,
        sortIndex: worldSort++,
      })
      .returning();
    let storySort = 0;
    for (const s of w.stories) {
      const insertedStory = await db
        .insert(storiesTable)
        .values({ worldId: insertedWorld[0]!.id, slug: s.slug, title: s.title, summary: s.summary, sortIndex: storySort++ })
        .returning();
      let chapSort = 0;
      for (const c of s.chapters) {
        await db.insert(chaptersTable).values({
          storyId: insertedStory[0]!.id,
          sortIndex: chapSort++,
          title: c.title,
          sceneImageUrl: c.sceneImageUrl,
          paragraphs: c.paragraphs,
          tappableWords: c.tappableWords,
        });
      }
    }
  }

  for (const it of SHOP_ITEMS) {
    await db.insert(shopItemsTable).values(it);
  }

  // Owned starter items
  const profile = await db.select().from(childProfilesTable).limit(1);
  const profileId = profile[0]!.id;
  for (const itemId of ["hat.crown", "decor.rug", "decor.plant"]) {
    await db.insert(ownedItemsTable).values({ profileId, itemId });
  }
  for (const itemId of ["decor.rug", "decor.plant"]) {
    await db.insert(decorStateTable).values({ profileId, itemId, enabled: true });
  }

  return { seeded: true };
}

